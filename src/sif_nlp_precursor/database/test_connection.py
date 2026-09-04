import sqlite3

from sif_nlp_precursor.database.connection import get_connection


def test_database_connection():
    connection = None

    try:
        connection = get_connection()

        cursor = connection.cursor()

        cursor.execute("SELECT 1")

        result = cursor.fetchone()

        print("Database connection successful!")
        print(f"Test result: {result[0]}")

    except sqlite3.Error as e:
        print(f"Database error: {e}")

    except Exception as e:
        print(f"Unexpected error: {e}")

    finally:
        if connection:
            connection.close()
            print("Database connection closed.")


if __name__ == "__main__":
    test_database_connection()