import sqlite3


DATABASE_PATH = "data/sif.db"

connection = None

try:
    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )

    tables = cursor.fetchall()

    print("Database tables:")

    for table in tables:
        print(f"- {table[0]}")

except sqlite3.Error as e:
    print(f"Database error: {e}")

except Exception as e:
    print(f"Unexpected error: {e}")

finally:
    if connection:
        connection.close()
        print("Database connection closed.")