from sif_nlp_precursor.database.connection import SessionLocal
from sif_nlp_precursor.database.crud import (
    create_incident_and_prediction,
)
from sif_nlp_precursor.schemas.nlp_result import NLPResult


nlp_data = {
    "case_id": "CASE-0000001",
    "narrative": "A worker nearly fell from an elevated platform.",
    "title": "Near fall from elevated platform",
    "energy_source": "gravity",
    "energy_level": "high",
    "exposure_type": "fall from height",
    "barrier_status": "guardrail missing",
    "life_saving_rule": "working at height",
    "counterfactual_could_be_fatal_or_permanent": True,
    "counterfactual_reasoning": (
        "A fall from the elevated platform could result "
        "in fatal or permanent injury."
    ),
    "evidence_phrase": "nearly fell from an elevated platform",
    "recorded_severity": {
        "EMP001": "near_miss"
    },
    "confidence": 0.94,
    "evidence_verified": True,
    "sps": 14,
    "sps_breakdown": {
        "energy_level_pts": 3,
        "exposure_pts": 4,
        "barrier_pts": 2,
        "counterfactual_pts": 5,
        "raw_total": 14,
        "max_possible": 20,
    },
}


db = SessionLocal()

try:
    nlp_result = NLPResult(**nlp_data)

    incident, prediction = create_incident_and_prediction(
        db=db,
        case_id=nlp_result.case_id,
        narrative=nlp_result.narrative,
        input_type="digital",
        processing_type="individual",
        created_by="user",
        nlp_result=nlp_result,
    )

    print("Incident and prediction stored successfully!")
    print("Case ID:", incident.case_id)
    print("Incident ID:", incident.id)
    print("Prediction ID:", prediction.id)
    print("Title:", incident.title)
    print("Input type:", incident.input_type)
    print("Processing type:", incident.processing_type)
    print("Created by:", incident.created_by)
    print("Energy level:", prediction.energy_level)
    print("Confidence:", prediction.confidence)
    print("SPS:", prediction.sps)
    print("Normalized SPS:", prediction.normalized_sps)
    print("SPS breakdown:", prediction.sps_breakdown)

except Exception as e:
    print(f"Test failed: {e}")

finally:
    db.close()
    print("Database session closed.")