import os
import sys
import mysql.connector
from dotenv import load_dotenv

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

load_dotenv()

try:
    connection = mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        port=int(os.getenv("MYSQL_PORT")),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE")
    )

    if connection.is_connected():
        print("✅ MySQL connection successful!")
        print("Database:", os.getenv("MYSQL_DATABASE"))

except mysql.connector.Error as error:
    print("❌ MySQL connection failed:")
    print(error)

finally:
    if "connection" in locals() and connection.is_connected():
        connection.close()
        print("Connection closed.")