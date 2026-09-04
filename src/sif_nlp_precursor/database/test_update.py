from sif_nlp_precursor.database.connection import SessionLocal
from sif_nlp_precursor.database.crud import update_prediction_confidence


db = SessionLocal()

try:
    prediction = update_prediction_confidence(
        db=db,
        prediction_id=1,
        new_confidence=0.96,
    )

    print("Prediction updated successfully!")
    print("Prediction ID:", prediction.id)
    print("New confidence:", prediction.confidence)

except Exception as e:
    print(f"Update failed: {e}")

finally:
    db.close()
    print("Database session closed.")
    