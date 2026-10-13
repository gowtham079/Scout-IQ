import logging
import os
import sys
from pathlib import Path
from typing import List

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure project root is in sys.path
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from backend.app.database import check_db_health
from backend.app.routers import overview, players, scouting, teams

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("scoutiq_api")

app = FastAPI(
    title="ScoutIQ — Football Intelligence & Recruitment API",
    description=(
        "Production-grade RESTful API serving high-resolution Danish Superliga (2025/26) "
        "football intelligence, scouting metrics, team standings, and head-to-head player comparisons."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173")
origins: List[str] = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True if "*" not in origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all exception handler guaranteeing no sensitive database credentials,
    tokens, or stack trace details are exposed to the API consumer.
    """
    logger.error("Unhandled API exception on %s %s: %s", request.method, request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred while processing the request."},
    )


# Register Feature Routers
app.include_router(overview.router)
app.include_router(players.router)
app.include_router(teams.router)
app.include_router(scouting.router)


@app.get("/api/health", tags=["Health"], summary="API and Database Health Check")
def health_check():
    """Verify API operational status and MySQL database connectivity."""
    db_health = check_db_health()
    is_db_ok = db_health.get("status") == "connected"
    return {
        "status": "healthy" if is_db_ok else "degraded",
        "service": "ScoutIQ API",
        "version": "1.0.0",
        "database": db_health,
    }


@app.get("/", tags=["Root"], include_in_schema=False)
def root():
    """Root welcome route with link to interactive OpenAPI documentation."""
    return {
        "name": "ScoutIQ Football Analytics API",
        "documentation": "/docs",
        "health": "/api/health",
    }
