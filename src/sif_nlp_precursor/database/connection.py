from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


# ============================================================
# DATABASE PATH
# ============================================================

# Get the project root directory
BASE_DIR = Path(__file__).resolve().parents[3]

# Data directory
DATA_DIR = BASE_DIR / "data"

# Create data directory if it does not exist
DATA_DIR.mkdir(exist_ok=True)

# SQLite database file
DATABASE_PATH = DATA_DIR / "sif.db"


def get_connection():
    """Return a raw SQLite connection for low-level database checks."""
    import sqlite3

    return sqlite3.connect(DATABASE_PATH)


# ============================================================
# DATABASE URL
# ============================================================

DATABASE_URL = f"sqlite:///{DATABASE_PATH}"


# ============================================================
# SQLALCHEMY ENGINE
# ============================================================

try:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )

except Exception as e:
    print(f"Database engine creation error: {e}")
    raise


# ============================================================
# DATABASE SESSION
# ============================================================

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)