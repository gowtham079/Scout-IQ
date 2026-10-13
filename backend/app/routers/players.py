from typing import Optional
from fastapi import APIRouter, HTTPException, Path, Query
from backend.app.schemas.player import PaginatedPlayersResponse, PlayerDetail
from backend.app.services.player_service import get_player_by_id, get_players

router = APIRouter(prefix="/api/players", tags=["Players"])


@router.get("", response_model=PaginatedPlayersResponse, summary="List & Filter Players")
def list_players(
    search: Optional[str] = Query(None, description="Search player by name substring"),
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    min_minutes: Optional[float] = Query(None, ge=0, description="Minimum pitch minutes played"),
    min_rating: Optional[float] = Query(None, ge=0, le=10, description="Minimum average rating"),
    sort_by: str = Query("rating", description="Sort field (e.g., rating, goals_per90, assists_per90, minutes_played)"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order: 'asc' or 'desc'"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    Query player scouting features with flexible filtering, sorting, and pagination.
    Data is extracted from `vw_player_scouting_features`.
    """
    try:
        return get_players(
            search=search,
            team_id=team_id,
            min_minutes=min_minutes,
            min_rating=min_rating,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )
    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve players from database.",
        ) from err


@router.get("/{player_id}", response_model=PlayerDetail, summary="Get Player Profile Details")
def read_player_profile(
    player_id: int = Path(..., ge=1, description="Unique player identifier"),
):
    """
    Retrieve exhaustive player profile including:
    - Scouting features & tactical percentages
    - Season counting totals (goals, assists, shots, duels)
    - Per-90 normalized offensive and defensive metrics
    """
    try:
        player = get_player_by_id(player_id=player_id)
        if player is None:
            raise HTTPException(
                status_code=404,
                detail=f"Player with ID {player_id} was not found in the scouting database.",
            )
        return player
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve player profile from database.",
        ) from err
