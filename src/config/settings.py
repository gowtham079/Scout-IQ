import os
from pathlib import Path
from dotenv import load_dotenv

# Locate and load the .env file from the project root
_BASE_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_PATH = _BASE_DIR / ".env"

if _ENV_PATH.exists():
    load_dotenv(dotenv_path=_ENV_PATH)
else:
    load_dotenv()

# Required MySQL environment variables
_REQUIRED_VARS = [
    "MYSQL_HOST",
    "MYSQL_PORT",
    "MYSQL_USER",
    "MYSQL_PASSWORD",
    "MYSQL_DATABASE",
]

_missing_vars = [var for var in _REQUIRED_VARS if not os.getenv(var)]
if _missing_vars:
    raise ValueError(
        f"Missing required MySQL environment variable(s): {', '.join(_missing_vars)}"
    )

try:
    MYSQL_PORT = int(os.environ["MYSQL_PORT"])
except ValueError as err:
    raise ValueError(
        f"Invalid MYSQL_PORT '{os.environ.get('MYSQL_PORT')}': must be an integer."
    ) from err

MYSQL_HOST = os.environ["MYSQL_HOST"]
MYSQL_USER = os.environ["MYSQL_USER"]
MYSQL_PASSWORD = os.environ["MYSQL_PASSWORD"]
MYSQL_DATABASE = os.environ["MYSQL_DATABASE"]

MYSQL_CONFIG = {
    "host": MYSQL_HOST,
    "port": MYSQL_PORT,
    "user": MYSQL_USER,
    "password": MYSQL_PASSWORD,
    "database": MYSQL_DATABASE,
}
