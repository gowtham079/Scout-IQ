from typing import List
from fastapi import APIRouter, HTTPException, Path, Query
from backend.app.schemas.team import TeamDetail, TeamStandingItem
from backend.app.services.team_service import get_team_by_id, get_teams

router = APIRouter(prefix="/api/teams", tags=["Teams"])


@router.get("", response_model=List[TeamStandingItem], summary="Get League Standings")
def list_teams(season_id: int = Query(25536, description="Competition season ID")):
    """
    Retrieve official team standings with points, goal differential, possession,
    and disciplinary records from `vw_team_season_performance_named`.
    """
    try:
        return get_teams(season_id=season_id)
    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve team standings from database.",
        ) from err


@router.get("/{team_id}", response_model=TeamDetail, summary="Get Team Detail & Squad Breakdown")
def read_team_detail(
    team_id: int = Path(..., ge=1, description="Unique team identifier"),
    season_id: int = Query(25536, description="Competition season ID"),
):
    """
    Retrieve comprehensive team metrics including:
    - Official league standing and goal record
    - Squad size and squad average match rating
    - Top goalscorers within the squad
    - Top playmakers / chance creators
    """
    try:
        team_detail = get_team_by_id(team_id=team_id, season_id=season_id)
        if team_detail is None:
            raise HTTPException(
                status_code=404,
                detail=f"Team with ID {team_id} was not found in the database.",
            )
        return team_detail
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve team detail from database.",
        ) from err
