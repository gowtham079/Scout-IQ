import sys
from pathlib import Path
import mysql.connector
from mysql.connector import Error

# Ensure UTF-8 output encoding for consoles that default to cp1252 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure project root is on sys.path for direct script execution
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from src.config.settings import MYSQL_CONFIG


def get_connection():
    """
    Establish and return a connection to the MySQL database.
    Raises a RuntimeError if the connection cannot be established.
    """
    try:
        connection = mysql.connector.connect(**MYSQL_CONFIG)
        return connection
    except Error as err:
        raise RuntimeError(f"Database connection error: {err.msg}") from err


def test_connection():
    """
    Verify the database connection, display the status and database name,
    and safely close the connection.
    """
    connection = None
    try:
        connection = get_connection()
        if connection.is_connected():
            print("MySQL connection successful!")
            print(f"Database: {MYSQL_CONFIG['database']}")
            return True
        else:
            print("MySQL connection failed.")
            print(f"Database: {MYSQL_CONFIG['database']}")
            return False
    except Exception as err:
        print("MySQL connection failed:")
        print(err)
        print(f"Database: {MYSQL_CONFIG['database']}")
        return False
    finally:
        if connection is not None and connection.is_connected():
            connection.close()
            print("Connection closed.")


if __name__ == "__main__":
    test_connection()
