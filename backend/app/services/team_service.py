import logging
from typing import Any, Dict, List, Optional

from backend.app.database import get_db_connection, serialize_row, serialize_rows
from backend.app.schemas.team import TeamDetail, TeamStandingItem

logger = logging.getLogger(__name__)

TEAM_COLUMNS = """
    team_id,
    season_id,
    team_name,
    matches,
    wins,
    draws,
    losses,
    goals_for,
    goals_against,
    goal_difference,
    average_possession,
    corners,
    yellowcards,
    redcards
"""


def get_teams(season_id: int = 25536) -> List[TeamStandingItem]:
    """
    Retrieve team season statistics with calculated points and official standings ranking.
    Tiebreakers: Points -> Goal Difference -> Goals Scored -> Team Name.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                f"""
                SELECT
                    {TEAM_COLUMNS},
                    (wins * 3 + draws) AS points
                FROM vw_team_season_performance_named
                WHERE season_id = %s
                ORDER BY points DESC, goal_difference DESC, goals_for DESC, team_name ASC;
                """,
                (season_id,),
            )
            raw_rows = serialize_rows(cursor.fetchall())
            standings: List[TeamStandingItem] = []
            for rank_idx, row in enumerate(raw_rows, start=1):
                row["rank"] = rank_idx
                standings.append(TeamStandingItem(**row))
            return standings
        finally:
            cursor.close()


def get_team_by_id(team_id: int, season_id: int = 25536) -> Optional[TeamDetail]:
    """
    Fetch comprehensive team record including official standings position,
    squad statistics, and top individual contributors.
    """
    # 1. Get official standings to find rank and baseline stats
    all_teams = get_teams(season_id=season_id)
    team_item = next((t for t in all_teams if t.team_id == team_id), None)
    if not team_item:
        return None

    with get_db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            # 2. Squad size and average player rating
            cursor.execute(
                """
                SELECT
                    COUNT(DISTINCT player_id) AS squad_size,
                    ROUND(AVG(average_rating), 2) AS squad_avg_rating
                FROM vw_player_season_performance
                WHERE team_id = %s AND season_id = %s;
                """,
                (team_id, season_id),
            )
            squad_res = cursor.fetchone()
            squad_size = int(squad_res["squad_size"]) if squad_res else 0
            squad_avg_rating = (
                float(squad_res["squad_avg_rating"])
                if squad_res and squad_res["squad_avg_rating"] is not None
                else None
            )

            # 3. Team Top Scorers
            cursor.execute(
                """
                SELECT
                    player_id,
                    player_name,
                    appearances,
                    minutes_played,
                    goals,
                    assists,
                    average_rating
                FROM vw_player_season_performance_named
                WHERE team_id = %s AND season_id = %s AND goals > 0
                ORDER BY goals DESC, minutes_played ASC
                LIMIT 5;
                """,
                (team_id, season_id),
            )
            top_scorers = serialize_rows(cursor.fetchall())

            # 4. Team Key Playmakers (Chance Creators)
            cursor.execute(
                """
                SELECT
                    player_id,
                    player_name,
                    appearances,
                    minutes_played,
                    rating,
                    key_passes_per90,
                    assists_per90,
                    pass_accuracy_percentage
                FROM vw_player_scouting_features
                WHERE team_id = %s AND season_id = %s AND minutes_played >= 250
                ORDER BY key_passes_per90 DESC, rating DESC
                LIMIT 5;
                """,
                (team_id, season_id),
            )
            key_playmakers = serialize_rows(cursor.fetchall())

            return TeamDetail(
                team=team_item,
                squad_size=squad_size,
                squad_average_rating=squad_avg_rating,
                top_scorers=top_scorers,
                key_playmakers=key_playmakers,
            )
        finally:
            cursor.close()
