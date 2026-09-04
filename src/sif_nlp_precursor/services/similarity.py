from sqlalchemy.orm import Session

from sif_nlp_precursor.database.models import Incident


def find_similar_reports(
    db: Session,
    case_id: str,
    limit: int = 5,
):
    try:
        incident = (
            db.query(Incident)
            .filter(Incident.case_id == case_id)
            .first()
        )

        if incident is None:
            raise ValueError("Report not found.")

        other_incidents = (
            db.query(Incident)
            .filter(Incident.case_id != case_id)
            .order_by(Incident.created_at.desc())
            .limit(limit)
            .all()
        )

        # Temporary implementation.
        # Actual NLP/embedding similarity will be added later.
        results = []

        for other in other_incidents:
            results.append(
                {
                    "case_id": other.case_id,
                    "title": other.title,
                    "narrative": other.narrative,
                    "similarity_score": 0.0,
                }
            )

        return results

    except ValueError:
        raise

    except Exception as e:
        raise RuntimeError(
            f"Unexpected similarity service error: {e}"
        ) from e