from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, HTTPException, UploadFile, File

from src.sif_nlp_precursor.services.file_converter import (
    convert_pdf_to_images,
)

from src.sif_nlp_precursor.services.zip_decoder import extract_zip

from src.sif_nlp_precursor.services.ocr_service import (
    ocr_image,
    ocr_pdf,
)

from src.sif_nlp_precursor.services.batch_processor import (
    process_extracted_files,
)

from sif_nlp_precursor.database.connection import SessionLocal
from sif_nlp_precursor.database.crud import (
    create_incident_and_prediction,
    create_prediction_feedback,
)

from sif_nlp_precursor.database.models import (
    Incident,
    Prediction,
    PredictionFeedback,
    UploadJob,
)

from sif_nlp_precursor.services.similarity import find_similar_reports
from sif_nlp_precursor.services.sps import calculate_normalized_sps

from sif_nlp_precursor.schemas.report import (
    DashboardResponse,
    FeedbackInput,
    FeedbackResponse,
    ModelInfoResponse,
    ReportHistoryItem,
    ReportInput,
    ReportReceivedResponse,
    SimilarReportsResponse,
    TaxonomyResponse,
)

from sif_nlp_precursor.schemas.nlp_result import (
    NLPResult,
    SPSBreakdown,
)


app = FastAPI(
    title="SIF-NLP-Precursor API",
    version="1.0.0",
)


def _update_upload_job(job_id: str, **changes):
    db = SessionLocal()
    try:
        job = db.query(UploadJob).filter(UploadJob.id == job_id).first()
        if job is None:
            return
        for key, value in changes.items():
            setattr(job, key, value)
        db.commit()
    finally:
        db.close()


def _uploaded_report(job_id: str, text: str, filename: str, input_type: str):
    db = SessionLocal()
    try:
        job = db.query(UploadJob).filter(UploadJob.id == job_id).first()
        if job is None:
            return
        case_id = f"UPLOAD-{job_id[:12]}"
        incident = Incident(
            case_id=case_id,
            narrative=text,
            title=f"Uploaded report: {filename}",
            input_type=input_type,
            processing_type="upload",
            created_by="Admin",
        )
        db.add(incident)
        db.flush()
        job.case_id = case_id
        job.extracted_text = text
        db.commit()
    finally:
        db.close()


def _process_upload_job(job_id: str, file_path: str, filename: str, suffix: str):
    input_type = suffix.lstrip(".")
    try:
        _update_upload_job(job_id, status="processing", stage="validating", progress=10, message="File validated")
        if suffix == ".pdf":
            _update_upload_job(job_id, stage="ocr", progress=25, message="Rendering PDF pages and running OCR")
            result = ocr_pdf(file_path, Path("data/pdf_images") / Path(filename).stem)
            text = result["text"]
        elif suffix in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}:
            _update_upload_job(job_id, stage="ocr", progress=35, message="Running image OCR")
            text = ocr_image(file_path)
        elif suffix in {".txt", ".csv"}:
            _update_upload_job(job_id, stage="extracting", progress=35, message="Extracting text")
            text = Path(file_path).read_text(encoding="utf-8", errors="replace")
        elif suffix == ".docx":
            _update_upload_job(job_id, stage="extracting", progress=35, message="Extracting DOCX text")
            from docx import Document
            text = "\n".join(paragraph.text for paragraph in Document(file_path).paragraphs).strip()
        else:
            raise ValueError("This upload type is not supported by the single-file job processor.")

        _update_upload_job(job_id, stage="ocr_complete", progress=65, message="Text extraction complete", extracted_text=text)
        _uploaded_report(job_id, text, filename, input_type)
        _update_upload_job(job_id, stage="classifying", progress=70, message="Calling NLP model", model_status="running")

        # Classification is deliberately attempted after the upload/report is persisted.
        from inference_pipeline import predict_full_record
        bert_model, bert_tokenizer, gen_model, gen_tokenizer, device = _get_model_runtime()
        predicted = predict_full_record(text, bert_model, bert_tokenizer, gen_model, gen_tokenizer, device)
        db = SessionLocal()
        try:
            job = db.query(UploadJob).filter(UploadJob.id == job_id).first()
            incident = db.query(Incident).filter(Incident.case_id == job.case_id).first()
            raw = predicted["sps_breakdown"]
            breakdown = SPSBreakdown(
                energy_level_pts=raw.get("energy_level_pts", 0),
                exposure_pts=raw.get("exposure_pts", raw.get("exposure_type_pts", 0)),
                barrier_pts=raw.get("barrier_pts", raw.get("barrier_status_pts", 0)),
                counterfactual_pts=raw.get("counterfactual_pts", 0),
                raw_total=raw.get("raw_total", raw.get("raw_score", 0)),
                max_possible=raw.get("max_possible", raw.get("max_raw_score", 16)),
            )
            nlp_result = NLPResult(
                case_id=job.case_id,
                narrative=text,
                title=f"Uploaded report: {filename}",
                energy_source=predicted["energy_source"],
                energy_level=predicted["energy_level"],
                exposure_type=predicted["exposure_type"],
                barrier_status=predicted["barrier_status"],
                life_saving_rule=predicted["life_saving_rule"],
                counterfactual_could_be_fatal_or_permanent=predicted["counterfactual_could_be_fatal_or_permanent"],
                counterfactual_reasoning=predicted["counterfactual_reasoning"],
                evidence_phrase=predicted["evidence_phrase"],
                recorded_severity={str(i + 1): value for i, value in enumerate(predicted["recorded_severity"])},
                confidence=predicted["confidence"],
                evidence_verified=predicted["evidence_verified"],
                sps=predicted["sps"],
                sps_breakdown=breakdown,
            )
            db.add(Prediction(
                incident_id=incident.id,
                energy_source=nlp_result.energy_source,
                energy_level=nlp_result.energy_level,
                exposure_type=nlp_result.exposure_type,
                barrier_status=nlp_result.barrier_status,
                life_saving_rule=nlp_result.life_saving_rule,
                counterfactual_could_be_fatal_or_permanent=nlp_result.counterfactual_could_be_fatal_or_permanent,
                counterfactual_reasoning=nlp_result.counterfactual_reasoning,
                evidence_phrase=nlp_result.evidence_phrase,
                recorded_severity=nlp_result.recorded_severity,
                confidence=nlp_result.confidence,
                evidence_verified=nlp_result.evidence_verified,
                sps=nlp_result.sps,
                normalized_sps=calculate_normalized_sps(breakdown),
                sps_breakdown=breakdown.model_dump(),
                model_version="upload-model",
            ))
            db.commit()
        finally:
            db.close()
        _update_upload_job(job_id, status="complete", stage="complete", progress=100, message="Report stored and classified", model_status="predicted")
    except Exception as exc:
        _update_upload_job(job_id, status="failed", stage="failed", progress=100, message="Upload processing failed", model_status="failed", error=str(exc))


_MODEL_RUNTIME = None


def _get_model_runtime():
    global _MODEL_RUNTIME

    if _MODEL_RUNTIME is not None:
        return _MODEL_RUNTIME

    try:
        from inference_pipeline import load_bert_model
        import config as model_config
        import torch
        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
        )

    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Model dependencies are unavailable. "
                "Install torch, transformers, and pandas "
                f"before calling analyze: {exc}"
            ),
        ) from exc

    device = torch.device(
        "cuda" if torch.cuda.is_available() else "cpu"
    )

    bert_model, bert_tokenizer = load_bert_model(
        f"{model_config.OUTPUT_DIR}/best_model.pt",
        device,
    )

    gen_tokenizer = AutoTokenizer.from_pretrained(
        f"{model_config.GEN_OUTPUT_DIR}/best_gen_model",
        local_files_only=True,
    )

    gen_model = AutoModelForCausalLM.from_pretrained(
        f"{model_config.GEN_OUTPUT_DIR}/best_gen_model",
        local_files_only=True,
    ).to(device)

    gen_model.eval()

    _MODEL_RUNTIME = (
        bert_model,
        bert_tokenizer,
        gen_model,
        gen_tokenizer,
        device,
    )

    return _MODEL_RUNTIME


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SIF-NLP-Precursor API",
    }


@app.get("/api/v1/ocr/status")
def ocr_status():
    from src.sif_nlp_precursor.services.ocr_service import (
        MODEL_ID,
        OCR_ENGINE,
        _OCR_RUNTIME,
    )

    return {
        "engine": OCR_ENGINE,
        "model": "PP-OCRv6_det_small + PP-OCRv6_rec_small" if OCR_ENGINE == "rapidocr" else MODEL_ID,
        "loaded": _OCR_RUNTIME is not None,
        "available": True,
    }


@app.post(
    "/api/v1/analyze",
    response_model=ReportReceivedResponse,
)
def analyze_report(report: ReportInput):
    db = SessionLocal()

    try:
        from inference_pipeline import predict_full_record

        (
            bert_model,
            bert_tokenizer,
            gen_model,
            gen_tokenizer,
            device,
        ) = _get_model_runtime()

        predicted = predict_full_record(
            report.content,
            bert_model,
            bert_tokenizer,
            gen_model,
            gen_tokenizer,
            device,
        )

        # Get the next database ID
        last_incident = (
            db.query(Incident)
            .order_by(Incident.id.desc())
            .first()
        )

        if last_incident is None:
            next_id = 1
        else:
            next_id = last_incident.id + 1

        case_id = f"CASE-{next_id:07d}"

        raw_breakdown = predicted["sps_breakdown"]

        breakdown = SPSBreakdown(
            energy_level_pts=raw_breakdown.get(
                "energy_level_pts",
                0,
            ),
            exposure_pts=raw_breakdown.get(
                "exposure_pts",
                raw_breakdown.get(
                    "exposure_type_pts",
                    0,
                ),
            ),
            barrier_pts=raw_breakdown.get(
                "barrier_pts",
                raw_breakdown.get(
                    "barrier_status_pts",
                    0,
                ),
            ),
            counterfactual_pts=raw_breakdown.get(
                "counterfactual_pts",
                0,
            ),
            raw_total=raw_breakdown.get(
                "raw_total",
                raw_breakdown.get(
                    "raw_score",
                    0,
                ),
            ),
            max_possible=raw_breakdown.get(
                "max_possible",
                raw_breakdown.get(
                    "max_raw_score",
                    16,
                ),
            ),
        )

        nlp_result = NLPResult(
            case_id=case_id,
            narrative=report.content,
            title="Model analyzed safety report",
            energy_source=predicted["energy_source"],
            energy_level=predicted["energy_level"],
            exposure_type=predicted["exposure_type"],
            barrier_status=predicted["barrier_status"],
            life_saving_rule=predicted["life_saving_rule"],
            counterfactual_could_be_fatal_or_permanent=predicted[
                "counterfactual_could_be_fatal_or_permanent"
            ],
            counterfactual_reasoning=predicted[
                "counterfactual_reasoning"
            ],
            evidence_phrase=predicted["evidence_phrase"],
            recorded_severity={
                str(index + 1): label
                for index, label in enumerate(
                    predicted["recorded_severity"]
                )
            },
            confidence=predicted["confidence"],
            evidence_verified=predicted[
                "evidence_verified"
            ],
            sps=predicted["sps"],
            sps_breakdown=breakdown,
        )

        incident, prediction = (
            create_incident_and_prediction(
                db=db,
                case_id=case_id,
                narrative=report.content,
                input_type=report.file_type,
                processing_type="individual",
                created_by="user",
                nlp_result=nlp_result,
            )
        )

        return ReportReceivedResponse(
            case_id=incident.case_id,
            file_type=report.file_type,
            message=(
                "Safety report analyzed and "
                "stored successfully."
            ),
            prediction={
                "energy_source": prediction.energy_source,
                "energy_level": prediction.energy_level,
                "exposure_type": prediction.exposure_type,
                "barrier_status": prediction.barrier_status,
                "life_saving_rule": (
                    prediction.life_saving_rule
                ),
                "recorded_severity": (
                    prediction.recorded_severity
                ),
                "confidence": prediction.confidence,
                "evidence_phrase": (
                    prediction.evidence_phrase
                ),
                "sps": prediction.sps,
                "sps_breakdown": (
                    prediction.sps_breakdown
                ),
                "counterfactual_reasoning": (
                    prediction.counterfactual_reasoning
                ),
                "model_version": (
                    prediction.model_version
                ),
            },
            model_status="predicted",
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to store safety report: {e}"
            ),
        ) from e

    finally:
        db.close()


@app.get(
    "/api/v1/analyze",
    response_model=list[ReportHistoryItem],
)
def get_report_history():
    db = SessionLocal()

    try:
        incidents = (
            db.query(Incident)
            .order_by(Incident.created_at.desc())
            .all()
        )

        history = []

        for incident in incidents:
            history.append(
                ReportHistoryItem(
                    case_id=incident.case_id,
                    title=incident.title,
                    narrative=incident.narrative,
                    input_type=incident.input_type,
                    processing_type=(
                        incident.processing_type
                    ),
                    created_by=incident.created_by,
                    created_at=(
                        incident.created_at.isoformat()
                    ),
                )
            )

        return history

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to retrieve report history: {e}"
            ),
        ) from e

    finally:
        db.close()


@app.get("/api/v1/{case_id}")
def get_report_details(case_id: str):
    db = SessionLocal()

    try:
        incident = (
            db.query(Incident)
            .filter(Incident.case_id == case_id)
            .first()
        )

        if incident is None:
            raise HTTPException(
                status_code=404,
                detail="Report not found.",
            )

        prediction = (
            incident.predictions[0]
            if incident.predictions
            else None
        )

        return {
            "case_id": incident.case_id,
            "title": incident.title,
            "narrative": incident.narrative,
            "input_type": incident.input_type,
            "processing_type": (
                incident.processing_type
            ),
            "created_by": incident.created_by,
            "created_at": incident.created_at.isoformat(),
            "prediction": (
                {
                    "energy_source": (
                        prediction.energy_source
                    ),
                    "energy_level": (
                        prediction.energy_level
                    ),
                    "exposure_type": (
                        prediction.exposure_type
                    ),
                    "barrier_status": (
                        prediction.barrier_status
                    ),
                    "life_saving_rule": (
                        prediction.life_saving_rule
                    ),
                    "counterfactual_could_be_fatal_or_permanent": (
                        prediction
                        .counterfactual_could_be_fatal_or_permanent
                    ),
                    "counterfactual_reasoning": (
                        prediction
                        .counterfactual_reasoning
                    ),
                    "evidence_phrase": (
                        prediction.evidence_phrase
                    ),
                    "recorded_severity": (
                        prediction.recorded_severity
                    ),
                    "confidence": (
                        prediction.confidence
                    ),
                    "evidence_verified": (
                        prediction.evidence_verified
                    ),
                    "sps": prediction.sps,
                    "normalized_sps": (
                        prediction.normalized_sps
                    ),
                    "sps_breakdown": (
                        prediction.sps_breakdown
                    ),
                    "model_version": (
                        prediction.model_version
                    ),
                }
                if prediction
                else None
            ),
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to retrieve report details: {e}"
            ),
        ) from e

    finally:
        db.close()


@app.post(
    "/api/v1/{case_id}/feedback",
    response_model=FeedbackResponse,
)
def submit_feedback(
    case_id: str,
    feedback: FeedbackInput,
):
    db = SessionLocal()

    try:
        incident = (
            db.query(Incident)
            .filter(Incident.case_id == case_id)
            .first()
        )

        if incident is None:
            raise HTTPException(
                status_code=404,
                detail="Report not found.",
            )

        prediction = (
            db.query(Prediction)
            .filter(
                Prediction.incident_id == incident.id
            )
            .order_by(Prediction.id.desc())
            .first()
        )

        if prediction is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    "No NLP prediction found "
                    "for this report."
                ),
            )

        saved_feedback = create_prediction_feedback(
            db=db,
            prediction_id=prediction.id,
            case_id=case_id,
            status=feedback.status,
            created_by=feedback.created_by,
            corrected_data=feedback.corrected_data,
            comment=feedback.comment,
        )

        return FeedbackResponse(
            prediction_id=saved_feedback.prediction_id,
            case_id=saved_feedback.case_id,
            status=saved_feedback.status,
            message="Feedback submitted successfully.",
        )

    except HTTPException:
        raise

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        ) from e

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to submit feedback: {e}"
            ),
        ) from e

    finally:
        db.close()


@app.post(
    "/api/v2/dashboard",
    response_model=DashboardResponse,
)
def populate_dashboard():
    db = SessionLocal()

    try:
        total_reports = (
            db.query(Incident).count()
        )

        total_predictions = (
            db.query(Prediction).count()
        )

        high_risk_reports = (
            db.query(Prediction)
            .filter(
                Prediction.normalized_sps > 0.66
            )
            .count()
        )

        medium_risk_reports = (
            db.query(Prediction)
            .filter(
                Prediction.normalized_sps > 0.33,
                Prediction.normalized_sps <= 0.66,
            )
            .count()
        )

        low_risk_reports = (
            db.query(Prediction)
            .filter(
                Prediction.normalized_sps <= 0.33
            )
            .count()
        )

        correct_predictions = (
            db.query(PredictionFeedback)
            .filter(
                PredictionFeedback.status == "correct"
            )
            .count()
        )

        incorrect_predictions = (
            db.query(PredictionFeedback)
            .filter(
                PredictionFeedback.status == "incorrect"
            )
            .count()
        )

        return DashboardResponse(
            total_reports=total_reports,
            total_predictions=total_predictions,
            high_risk_reports=high_risk_reports,
            medium_risk_reports=medium_risk_reports,
            low_risk_reports=low_risk_reports,
            correct_predictions=correct_predictions,
            incorrect_predictions=incorrect_predictions,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to populate dashboard: {e}"
            ),
        ) from e

    finally:
        db.close()


@app.get(
    "/api/v1/similar-reports/{case_id}/similar",
    response_model=SimilarReportsResponse,
)
def get_similar_reports(case_id: str):
    db = SessionLocal()

    try:
        incident = (
            db.query(Incident)
            .filter(Incident.case_id == case_id)
            .first()
        )

        if incident is None:
            raise HTTPException(
                status_code=404,
                detail="Report not found.",
            )

        similar_reports = find_similar_reports(
            db=db,
            case_id=case_id,
        )

        return SimilarReportsResponse(
            case_id=case_id,
            similar_reports=similar_reports,
        )

    except HTTPException:
        raise

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        ) from e

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to find similar reports: {e}"
            ),
        ) from e

    finally:
        db.close()


@app.get(
    "/api/v1/categories/taxonomy",
    response_model=TaxonomyResponse,
)
def get_taxonomy():
    try:
        categories = [
            "energy_source",
            "energy_level",
            "exposure_type",
            "barrier_status",
            "life_saving_rule",
            "counterfactual",
            "recorded_severity",
        ]

        return TaxonomyResponse(
            categories=categories,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to retrieve taxonomy: {e}"
            ),
        ) from e


@app.get(
    "/api/v1/model/model-info",
    response_model=ModelInfoResponse,
)
def get_model_info():
    try:
        return ModelInfoResponse(
            model_name="SIF-NLP-Precursor",
            model_version="not_connected",
            status="not_loaded",
            task=(
                "Serious Injury & Fatality "
                "precursor detection"
            ),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to retrieve model information: {e}"
            ),
        ) from e


@app.post("/api/v1/upload-zip")
async def upload_zip(
    file: UploadFile = File(...),
):
    try:
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file was provided.",
            )

        if not file.filename.lower().endswith(".zip"):
            raise HTTPException(
                status_code=400,
                detail="Only ZIP files are accepted.",
            )

        upload_dir = "data/uploads"
        extract_dir = "data/extracted_reports"
        converted_dir = "data/batch_converted"

        import os

        os.makedirs(
            upload_dir,
            exist_ok=True,
        )

        file_data = await file.read()

        if not file_data:
            raise HTTPException(
                status_code=400,
                detail="Uploaded ZIP file is empty.",
            )

        zip_path = os.path.join(
            upload_dir,
            file.filename,
        )

        with open(
            zip_path,
            "wb",
        ) as output_file:
            output_file.write(file_data)

        # Extract files from ZIP
        extracted_files = extract_zip(
            zip_path=zip_path,
            output_dir=extract_dir,
        )

        # Process every extracted file
        processing_results = process_extracted_files(
            extracted_files=extracted_files,
            output_dir=converted_dir,
        )

        return {
            "message": (
                "ZIP uploaded and batch "
                "processed successfully."
            ),
            "filename": file.filename,
            "files_extracted": len(
                extracted_files
            ),
            "processing_results": (
                processing_results
            ),
        }

    except HTTPException:
        raise

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        ) from e

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to process ZIP batch: {e}"
            ),
        ) from e


@app.post("/api/v1/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file was provided.")

    suffix = Path(file.filename).suffix.lower()
    supported = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".txt", ".csv", ".docx"}
    if suffix not in supported:
        raise HTTPException(status_code=400, detail="Supported uploads are PDF, images, TXT, and CSV.")

    import uuid
    job_id = uuid.uuid4().hex
    safe_filename = Path(file.filename).name
    upload_dir = Path("data/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_path = upload_dir / f"{job_id}_{safe_filename}"
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    stored_path.write_bytes(data)
    db = SessionLocal()
    try:
        db.add(UploadJob(
            id=job_id,
            filename=safe_filename,
            input_type=suffix.lstrip("."),
            stored_path=str(stored_path),
            message="Upload stored; queued for processing",
        ))
        db.commit()
    finally:
        db.close()
    background_tasks.add_task(_process_upload_job, job_id, str(stored_path), safe_filename, suffix)
    return {
        "job_id": job_id,
        "filename": safe_filename,
        "status": "queued",
        "stage": "queued",
        "progress": 0,
        "model_status": "not_called",
        "message": "Upload stored and processing queued.",
    }


@app.get("/api/v1/upload/{job_id}")
def upload_status(job_id: str):
    db = SessionLocal()
    try:
        job = db.query(UploadJob).filter(UploadJob.id == job_id).first()
        if job is None:
            raise HTTPException(status_code=404, detail="Upload job not found.")
        report = None
        if job.case_id:
            incident = db.query(Incident).filter(Incident.case_id == job.case_id).first()
            prediction = incident.predictions[0] if incident and incident.predictions else None
            if incident:
                report = {
                    "id": incident.case_id,
                    "title": incident.title,
                    "narrative": incident.narrative,
                    "status": "Pending Triage" if prediction else "Processing",
                    "input_type": incident.input_type,
                    "sps": prediction.sps if prediction else None,
                    "sps_tier": "Critical" if prediction and prediction.sps >= 75 else "High" if prediction and prediction.sps >= 60 else "Medium" if prediction else "Pending",
                    "confidence": prediction.confidence if prediction else None,
                    "energy_source": prediction.energy_source if prediction else "Pending model classification",
                    "energy_level": prediction.energy_level if prediction else "Pending",
                    "exposure_type": prediction.exposure_type if prediction else "Pending",
                    "barrier_status": prediction.barrier_status if prediction else "Pending",
                    "life_saving_rule": prediction.life_saving_rule if prediction else "Pending",
                    "recorded_severity": prediction.recorded_severity if prediction else "Pending",
                    "evidence_spans": [{"text": prediction.evidence_phrase, "verified": prediction.evidence_verified}] if prediction else [],
                }
        return {
            "job_id": job.id,
            "filename": job.filename,
            "status": job.status,
            "stage": job.stage,
            "progress": job.progress,
            "message": job.message,
            "case_id": job.case_id,
            "model_status": job.model_status,
            "error": job.error,
            "report": report,
        }
    finally:
        db.close()


@app.get("/api/v1/upload-report/{case_id}")
def get_uploaded_report(case_id: str):
    db = SessionLocal()
    try:
        incident = db.query(Incident).filter(Incident.case_id == case_id).first()
        if incident is None:
            raise HTTPException(status_code=404, detail="Uploaded report not found.")
        prediction = incident.predictions[0] if incident.predictions else None
        if prediction is None:
            raise HTTPException(status_code=409, detail="Uploaded report is still being classified.")
        return {
            "id": incident.case_id,
            "title": incident.title,
            "narrative": incident.narrative,
            "status": "Pending Triage",
            "input_type": incident.input_type,
            "processing_type": incident.processing_type,
            "sps": prediction.sps,
            "sps_tier": "Critical" if prediction.sps >= 75 else "High" if prediction.sps >= 60 else "Medium",
            "confidence": prediction.confidence,
            "energy_source": prediction.energy_source,
            "energy_level": prediction.energy_level,
            "exposure_type": prediction.exposure_type,
            "barrier_status": prediction.barrier_status,
            "life_saving_rule": prediction.life_saving_rule,
            "recorded_severity": prediction.recorded_severity,
            "evidence_spans": [{"text": prediction.evidence_phrase, "verified": prediction.evidence_verified}],
            "sps_breakdown": prediction.sps_breakdown,
        }
    finally:
        db.close()

async def upload_text(file: UploadFile):
    try:
        content = await file.read()
        text_content = content.decode("utf-8")
        
        return {
            "message": "Text document uploaded and processed successfully.",
            "filename": file.filename,
            "ocr_result": text_content,
            "id": f"CASE-TXT-{file.filename}",
            "case_id": f"CASE-TXT-{file.filename}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process text file: {e}"
        )

@app.post("/api/v1/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
):
    try:
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file was provided.",
            )

        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are accepted.",
            )

        upload_dir = "data/pdf_uploads"
        output_dir = "data/pdf_images"

        import os

        os.makedirs(
            upload_dir,
            exist_ok=True,
        )

        os.makedirs(
            output_dir,
            exist_ok=True,
        )

        safe_filename = Path(file.filename).name
        pdf_path = os.path.join(upload_dir, safe_filename)

        file_data = await file.read()

        if not file_data:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF file is empty.",
            )

        with open(
            pdf_path,
            "wb",
        ) as output_file:
            output_file.write(file_data)

        image_dir = os.path.join(
            output_dir,
            Path(safe_filename).stem,
        )

        ocr_result = ocr_pdf(pdf_path=pdf_path, output_dir=image_dir)

        return {
            "message": (
                "PDF uploaded, converted, and OCR processed successfully."
            ),
            "filename": safe_filename,
            "pages_converted": len(ocr_result["pages"]),
            "images": [page["image"] for page in ocr_result["pages"]],
            "text": ocr_result["text"],
            "pages": ocr_result["pages"],
        }

    except HTTPException:
        raise

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        ) from e

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        ) from e

    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to process PDF: {e}"
            ),
        ) from e


@app.post("/api/v1/upload-image")
async def upload_image(
    file: UploadFile = File(...),
):
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file was provided.")

        suffix = Path(file.filename).suffix.lower()
        if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}:
            raise HTTPException(status_code=400, detail="Only image files are accepted.")

        file_data = await file.read()
        if not file_data:
            raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

        import os
        upload_dir = Path("data/image_uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        safe_filename = Path(file.filename).name
        image_path = upload_dir / safe_filename
        image_path.write_bytes(file_data)

        text = ocr_image(image_path)
        return {
            "message": "Image uploaded and OCR processed successfully.",
            "filename": safe_filename,
            "text": text,
            "image": str(image_path),
        }
    except HTTPException:
        raise
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to OCR image: {exc}") from exc