from typing import List
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.player import PlayerComparisonResponse, TopPerformerRanking
from backend.app.services.scouting_service import compare_players, get_top_performers

router = APIRouter(prefix="/api/scouting", tags=["Scouting"])


@router.get("/compare", response_model=PlayerComparisonResponse, summary="Compare Two Players")
def compare_two_players(
    player_ids: str = Query(
        ...,
        description="Comma-separated IDs of the two players to compare (e.g. '?player_ids=203498,375339')",
    ),
):
    """
    Compare two players across all normalized per-90 metrics, ratings, and efficiency percentages.
    Calculates numerical differentials and designates statistical category leaders.
    """
    try:
        id_tokens = [token.strip() for token in player_ids.split(",") if token.strip()]
        if len(id_tokens) != 2:
            raise HTTPException(
                status_code=400,
                detail="Exactly two comma-separated player IDs must be provided (e.g. '?player_ids=123,456').",
            )

        try:
            player_id_1 = int(id_tokens[0])
            player_id_2 = int(id_tokens[1])
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Player IDs must be valid integer numbers.",
            )

        if player_id_1 == player_id_2:
            raise HTTPException(
                status_code=400,
                detail="Please specify two different player IDs for comparison.",
            )

        comparison = compare_players(player_id_1=player_id_1, player_id_2=player_id_2)
        if comparison is None:
            raise HTTPException(
                status_code=404,
                detail=f"One or both players (IDs: {player_id_1}, {player_id_2}) could not be found in the database.",
            )
        return comparison
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail="Failed to compute player comparison from database.",
        ) from err


@router.get("/top-performers", response_model=List[TopPerformerRanking], summary="Get Ranked Top Performers")
def list_top_performers(
    season_id: int = Query(25536, description="Competition season ID"),
):
    """
    Retrieve ranked leaderboards across four transparently documented scouting dimensions:
    1. Clinical Finishers (Goals per 90)
    2. Creative Playmakers (Combined Shot Contributions per 90)
    3. Defensive Disruptors (Combined Ball-Winning Actions per 90)
    4. Elite Consistency (Highest Average Rating with 900+ mins)
    """
    try:
        return get_top_performers(season_id=season_id)
    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail="Failed to calculate top performers from database.",
        ) from err
