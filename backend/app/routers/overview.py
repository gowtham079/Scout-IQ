from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.overview import LeagueOverview
from backend.app.services.overview_service import get_league_overview

router = APIRouter(prefix="/api/overview", tags=["Overview"])


@router.get("", response_model=LeagueOverview, summary="Get League Season Overview KPIs")
def read_overview(season_id: int = Query(25536, description="Competition season ID")):
    """
    Retrieve executive KPIs for the Danish Superliga season:
    - Total unique players active across the season (avoids counting transfer moves twice)
    - Total teams participating
    - Total goals and assists recorded
    - League-wide average player rating
    - Top 10 absolute goalscorers & assist providers
    - Goals for/against breakdown per team
    """
    try:
        return get_league_overview(season_id=season_id)
    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve league overview metrics from the database.",
        ) from err
