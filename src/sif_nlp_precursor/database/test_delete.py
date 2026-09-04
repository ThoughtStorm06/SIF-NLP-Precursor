from sif_nlp_precursor.database.connection import SessionLocal
from sif_nlp_precursor.database.crud import delete_prediction


db = SessionLocal()

try:
    result = delete_prediction(
        db=db,
        prediction_id=1,
    )

    if result:
        print("Prediction deleted successfully!")

except Exception as e:
    print(f"Delete failed: {e}")

finally:
    db.close()
    print("Database session closed.")
    