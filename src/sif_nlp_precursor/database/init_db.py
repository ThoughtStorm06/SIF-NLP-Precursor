from sqlalchemy.exc import SQLAlchemyError

from .connection import engine
from .models import Base


def create_database():
    """
    Create all database tables defined in models.py.
    """

    try:
        Base.metadata.create_all(bind=engine)

        print("Database tables created successfully.")

    except SQLAlchemyError as e:
        print(f"Database creation error: {e}")
        raise

    except Exception as e:
        print(f"Unexpected database error: {e}")
        raise


if __name__ == "__main__":
    create_database()