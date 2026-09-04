import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from sif_nlp_precursor.database.connection import SessionLocal
from sif_nlp_precursor.database.models import Incident, Prediction
from sif_nlp_precursor.services.sps import calculate_normalized_sps
from sif_nlp_precursor.schemas.nlp_result import SPSBreakdown


ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = ROOT / "database" / "seed" / "seedData.json"


def normalize_label(value):
    return str(value or "unknown").strip().lower().replace(" ", "_")


def seed_sqlite():
    seed_data = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    db = SessionLocal()
    created = 0
    skipped = 0

    try:
        for report in seed_data.get("reports", []):
            case_id = f"CSV-{report['id']}"
            incident = db.query(Incident).filter(Incident.case_id == case_id).first()
            if incident is None:
                incident = Incident(
                    case_id=case_id,
                    narrative=report.get("narrative", ""),
                    title=report.get("title"),
                    input_type="csv",
                    processing_type="batch",
                    created_by="seed",
                )
                db.add(incident)
                db.flush()

            if db.query(Prediction).filter(Prediction.incident_id == incident.id).first():
                skipped += 1
                continue

            raw_breakdown = report.get("sps_breakdown", {})
            component_total = sum(
                raw_breakdown.get(key, 0)
                for key in ("energy_score", "exposure_score", "barrier_score", "counterfactual_pts")
            )
            breakdown = SPSBreakdown(
                energy_level_pts=raw_breakdown.get("energy_score", 0),
                exposure_pts=raw_breakdown.get("exposure_score", 0),
                barrier_pts=raw_breakdown.get("barrier_score", 0),
                counterfactual_pts=raw_breakdown.get("counterfactual_pts", 0),
                raw_total=raw_breakdown.get("raw_total", component_total),
                max_possible=raw_breakdown.get("max_possible", 16),
            )
            counterfactual = report.get("counterfactual", {})
            evidence = (report.get("evidence_spans") or [{}])[0]
            db.add(Prediction(
                incident_id=incident.id,
                energy_source=normalize_label(report.get("energy_source")),
                energy_level=normalize_label(report.get("energy_level")),
                exposure_type=normalize_label(report.get("exposure_type")),
                barrier_status=normalize_label(report.get("barrier_status")),
                life_saving_rule=normalize_label(report.get("life_saving_rule")),
                counterfactual_could_be_fatal_or_permanent=counterfactual.get("could_be_fatal", False),
                counterfactual_reasoning=counterfactual.get("reasoning", ""),
                evidence_phrase=evidence.get("text", ""),
                recorded_severity={"1": report.get("recorded_severity", "Reported Incident")},
                confidence=report.get("confidence", 0.0),
                evidence_verified=evidence.get("verified", False),
                sps=report.get("sps", 0.0),
                normalized_sps=calculate_normalized_sps(breakdown),
                sps_breakdown=breakdown.model_dump(),
                model_version="seed-csv",
            ))
            created += 1

        db.commit()
        print(f"Seeded {created} predictions; skipped {skipped} existing predictions.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_sqlite()