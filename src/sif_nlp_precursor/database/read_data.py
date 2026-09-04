from sif_nlp_precursor.database.connection import SessionLocal
from sif_nlp_precursor.database.models import Incident


db = SessionLocal()

try:
    incident = db.query(Incident).filter(
        Incident.case_id == "CASE-001"
    ).first()

    if incident is None:
        print("Incident not found.")
    else:
        print("Incident retrieved successfully!")
        print()
        print("Case ID:", incident.case_id)
        print("Title:", incident.title)
        print("Narrative:", incident.narrative)

        print()
        print("NLP Prediction")
        print("----------------")

        prediction = incident.prediction

        if prediction is None:
            print("No NLP prediction found for this incident.")
        else:
            print("Energy source:", prediction.energy_source)
            print("Energy level:", prediction.energy_level)
            print("Exposure type:", prediction.exposure_type)
            print("Barrier status:", prediction.barrier_status)
            print("Life saving rule:", prediction.life_saving_rule)
            print(
                "Counterfactual:",
                prediction.counterfactual_could_be_fatal_or_permanent,
            )
            print(
                "Counterfactual reasoning:",
                prediction.counterfactual_reasoning,
            )
            print("Evidence phrase:", prediction.evidence_phrase)
            print("Recorded severity:", prediction.recorded_severity)
            print("Confidence:", prediction.confidence)
            print("Evidence verified:", prediction.evidence_verified)
            print("SPS:", prediction.sps)
            print("Normalized SPS:", prediction.normalized_sps)
            print("SPS breakdown:", prediction.sps_breakdown)

except Exception as e:
    print(f"Unexpected error: {e}")

finally:
    db.close()
    print()
    print("Database session closed.")