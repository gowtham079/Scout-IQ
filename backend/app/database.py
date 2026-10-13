import logging
import sys
from contextlib import contextmanager
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional

import mysql.connector
from mysql.connector import Error, pooling

# Ensure project root is in sys.path
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from src.config.settings import MYSQL_CONFIG

logger = logging.getLogger(__name__)

# Initialize thread-safe connection pool reusing existing MYSQL_CONFIG
_POOL_NAME = "scoutiq_api_pool"
_POOL_SIZE = 8

_connection_pool: Optional[pooling.MySQLConnectionPool] = None


def get_connection_pool() -> pooling.MySQLConnectionPool:
    """Lazy initialize and return the MySQL connection pool."""
    global _connection_pool
    if _connection_pool is None:
        try:
            _connection_pool = pooling.MySQLConnectionPool(
                pool_name=_POOL_NAME,
                pool_size=_POOL_SIZE,
                pool_reset_session=True,
                **MYSQL_CONFIG,
            )
            logger.info("Database connection pool initialized with pool_size=%d", _POOL_SIZE)
        except Error as err:
            logger.error("Failed to initialize MySQL connection pool: %s", err.msg)
            raise RuntimeError(f"Database connection pool initialization error: {err.msg}") from err
    return _connection_pool


@contextmanager
def get_db_connection() -> Generator[mysql.connector.connection_cext.CMySQLConnection, None, None]:
    """
    Context manager yielding a pooled MySQL connection.
    Guarantees the connection is returned to the pool upon exit.
    """
    pool = get_connection_pool()
    connection = None
    try:
        connection = pool.get_connection()
        yield connection
    except Error as err:
        logger.error("Database connection checkout error: %s", err.msg)
        raise
    finally:
        if connection is not None and connection.is_connected():
            connection.close()


def check_db_health() -> Dict[str, Any]:
    """
    Execute a ping / query check to verify database connectivity.
    Does not expose sensitive credentials or tokens.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1;")
            cursor.fetchone()
            cursor.close()
            return {"status": "connected", "database": MYSQL_CONFIG.get("database")}
    except Exception as err:
        logger.error("Health check database failure: %s", str(err))
        return {"status": "disconnected", "error": "Database service unreachable"}


def serialize_value(val: Any) -> Any:
    """Convert MySQL Decimal and other non-standard types to JSON-safe primitives."""
    if isinstance(val, Decimal):
        # If no fractional part, convert to int, otherwise float
        return int(val) if val % 1 == 0 else float(val)
    return val


def serialize_row(row: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Convert dictionary row containing Decimal values to JSON-safe types."""
    if row is None:
        return None
    return {k: serialize_value(v) for k, v in row.items()}


def serialize_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Convert a list of dictionary rows containing Decimal values to JSON-safe types."""
    return [serialize_row(r) for r in rows if r is not None]
