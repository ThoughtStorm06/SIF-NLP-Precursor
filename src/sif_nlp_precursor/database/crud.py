from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from sif_nlp_precursor.database.models import (
    Incident,
    Prediction,
    PredictionFeedback,
)
from sif_nlp_precursor.schemas.nlp_result import NLPResult
from sif_nlp_precursor.services.sps import calculate_normalized_sps


def create_incident_and_prediction(
    db: Session,
    case_id: str,
    narrative: str,
    input_type: str,
    processing_type: str,
    created_by: str,
    nlp_result: NLPResult,
):
    try:
        # Create incident
        incident = Incident(
            case_id=case_id,
            narrative=narrative,
            title=nlp_result.title,
            input_type=input_type,
            processing_type=processing_type,
            created_by=created_by,
        )

        db.add(incident)
        db.flush()

        # Calculate normalized SPS
        normalized_sps = calculate_normalized_sps(
            nlp_result.sps_breakdown
        )

        # Create NLP prediction
        prediction = Prediction(
            incident_id=incident.id,
            energy_source=nlp_result.energy_source,
            energy_level=nlp_result.energy_level,
            exposure_type=nlp_result.exposure_type,
            barrier_status=nlp_result.barrier_status,
            life_saving_rule=nlp_result.life_saving_rule,
            counterfactual_could_be_fatal_or_permanent=(
                nlp_result.counterfactual_could_be_fatal_or_permanent
            ),
            counterfactual_reasoning=nlp_result.counterfactual_reasoning,
            evidence_phrase=nlp_result.evidence_phrase,
            recorded_severity=nlp_result.recorded_severity,
            confidence=nlp_result.confidence,
            evidence_verified=nlp_result.evidence_verified,
            sps=nlp_result.sps,
            normalized_sps=normalized_sps,
            sps_breakdown=nlp_result.sps_breakdown.model_dump(),
            model_version="initial",
        )

        db.add(prediction)
        db.commit()

        db.refresh(incident)
        db.refresh(prediction)

        return incident, prediction

    except ValueError:
        db.rollback()
        raise

    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(
            f"Database error while storing incident: {e}"
        ) from e

    except Exception as e:
        db.rollback()
        raise RuntimeError(
            f"Unexpected error while storing incident: {e}"
        ) from e


def update_prediction_confidence(
    db: Session,
    prediction_id: int,
    new_confidence: float,
):
    try:
        prediction = db.query(Prediction).filter(
            Prediction.id == prediction_id
        ).first()

        if prediction is None:
            raise ValueError("Prediction not found.")

        if not 0.0 <= new_confidence <= 1.0:
            raise ValueError(
                "Confidence must be between 0 and 1."
            )

        prediction.confidence = new_confidence

        db.commit()
        db.refresh(prediction)

        return prediction

    except ValueError:
        db.rollback()
        raise

    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(
            f"Database update error: {e}"
        ) from e

    except Exception as e:
        db.rollback()
        raise RuntimeError(
            f"Unexpected update error: {e}"
        ) from e


def delete_prediction(
    db: Session,
    prediction_id: int,
):
    try:
        prediction = db.query(Prediction).filter(
            Prediction.id == prediction_id
        ).first()

        if prediction is None:
            raise ValueError("Prediction not found.")

        db.delete(prediction)
        db.commit()

        return True

    except ValueError:
        db.rollback()
        raise

    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(
            f"Database delete error: {e}"
        ) from e

    except Exception as e:
        db.rollback()
        raise RuntimeError(
            f"Unexpected delete error: {e}"
        ) from e

    
def create_prediction_feedback(
    db: Session,
    prediction_id: int,
    case_id: str,
    status: str,
    created_by: str,
    corrected_data: dict | None = None,
    comment: str | None = None,
):
    try:
        if status not in {"correct", "incorrect"}:
            raise ValueError(
                "Status must be 'correct' or 'incorrect'."
            )

        prediction = db.query(Prediction).filter(
            Prediction.id == prediction_id
        ).first()

        if prediction is None:
            raise ValueError("Prediction not found.")

        feedback = PredictionFeedback(
            prediction_id=prediction_id,
            case_id=case_id,
            status=status,
            corrected_data=corrected_data,
            comment=comment,
            created_by=created_by,
        )

        db.add(feedback)
        db.commit()
        db.refresh(feedback)

        return feedback

    except ValueError:
        db.rollback()
        raise

    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(
            f"Database feedback error: {e}"
        ) from e

    except Exception as e:
        db.rollback()
        raise RuntimeError(
            f"Unexpected feedback error: {e}"
        ) from e