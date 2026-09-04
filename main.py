from fastapi import FastAPI, HTTPException, UploadFile, File 
from sif_nlp_precursor.services.zip_decoder import extract_zip

from sif_nlp_precursor.database.connection import SessionLocal
from sif_nlp_precursor.database.crud import create_prediction_feedback
from sif_nlp_precursor.database.models import (
    Incident,
    Prediction,
    PredictionFeedback,
)
from sif_nlp_precursor.services.similarity import find_similar_reports
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


app = FastAPI(
    title="SIF-NLP-Precursor API",
    version="1.0.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SIF-NLP-Precursor API",
    }


@app.post(
    "/api/v1/analyze",
    response_model=ReportReceivedResponse,
)
def analyze_report(report: ReportInput):
    db = SessionLocal()

    try:
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

        # Create the initial incident
        incident = Incident(
            case_id=case_id,
            narrative=report.content,
            title=None,
            input_type=report.file_type,
            processing_type="individual",
            created_by="user",
        )

        db.add(incident)
        db.commit()
        db.refresh(incident)

        return ReportReceivedResponse(
            case_id=incident.case_id,
            file_type=report.file_type,
            message="Safety report received successfully.",
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to store safety report: {e}",
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
                    processing_type=incident.processing_type,
                    created_by=incident.created_by,
                    created_at=incident.created_at.isoformat(),
                )
            )

        return history

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve report history: {e}",
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
            "processing_type": incident.processing_type,
            "created_by": incident.created_by,
            "created_at": incident.created_at.isoformat(),
            "prediction": (
                {
                    "energy_source": prediction.energy_source,
                    "energy_level": prediction.energy_level,
                    "exposure_type": prediction.exposure_type,
                    "barrier_status": prediction.barrier_status,
                    "life_saving_rule": (
                        prediction.life_saving_rule
                    ),
                    "counterfactual_could_be_fatal_or_permanent": (
                        prediction.counterfactual_could_be_fatal_or_permanent
                    ),
                    "counterfactual_reasoning": (
                        prediction.counterfactual_reasoning
                    ),
                    "evidence_phrase": prediction.evidence_phrase,
                    "recorded_severity": prediction.recorded_severity,
                    "confidence": prediction.confidence,
                    "evidence_verified": prediction.evidence_verified,
                    "sps": prediction.sps,
                    "normalized_sps": prediction.normalized_sps,
                    "sps_breakdown": prediction.sps_breakdown,
                    "model_version": prediction.model_version,
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
            detail=f"Failed to retrieve report details: {e}",
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
            .filter(Prediction.incident_id == incident.id)
            .order_by(Prediction.id.desc())
            .first()
        )

        if prediction is None:
            raise HTTPException(
                status_code=404,
                detail="No NLP prediction found for this report.",
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
            detail=f"Failed to submit feedback: {e}",
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
        total_reports = db.query(Incident).count()

        total_predictions = db.query(Prediction).count()

        high_risk_reports = (
            db.query(Prediction)
            .filter(Prediction.normalized_sps > 0.66)
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
            .filter(Prediction.normalized_sps <= 0.33)
            .count()
        )

        correct_predictions = (
            db.query(PredictionFeedback)
            .filter(PredictionFeedback.status == "correct")
            .count()
        )

        incorrect_predictions = (
            db.query(PredictionFeedback)
            .filter(PredictionFeedback.status == "incorrect")
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
            detail=f"Failed to populate dashboard: {e}",
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
            detail=f"Failed to find similar reports: {e}",
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
            detail=f"Failed to retrieve taxonomy: {e}",
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
            task="Serious Injury & Fatality precursor detection",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve model information: {e}",
        ) from e
@app.post("/api/v1/upload-zip")
async def upload_zip(file: UploadFile = File(...)):
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
        zip_path = f"{upload_dir}/{file.filename}"
        extract_dir = "data/extracted_reports"

        import os

        os.makedirs(upload_dir, exist_ok=True)

        file_data = await file.read()

        if not file_data:
            raise HTTPException(
                status_code=400,
                detail="Uploaded ZIP file is empty.",
            )

        with open(zip_path, "wb") as output_file:
            output_file.write(file_data)

        extracted_files = extract_zip(
            zip_path=zip_path,
            output_dir=extract_dir,
        )

        return {
            "message": "ZIP uploaded and extracted successfully.",
            "filename": file.filename,
            "files_extracted": len(extracted_files),
            "files": [
                str(path)
                for path in extracted_files
            ],
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
            detail=f"Failed to process ZIP file: {e}",
        ) from e