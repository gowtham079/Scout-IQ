import logging
from typing import Any, Dict, List

from backend.app.database import get_db_connection, serialize_row, serialize_rows
from backend.app.schemas.overview import LeagueOverview, TeamGoalSummary, TopAssister, TopScorer

logger = logging.getLogger(__name__)


def get_league_overview(season_id: int = 25536) -> LeagueOverview:
    """
    Retrieve high-level league KPIs and distributions for the Danish Superliga season.
    Reuses existing analytical views without duplicating player totals across transfers.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            # 1. Unique player count across the season
            cursor.execute(
                """
                SELECT COUNT(DISTINCT player_id) AS total_players
                FROM vw_player_season_performance
                WHERE season_id = %s;
                """,
                (season_id,),
            )
            player_count_res = cursor.fetchone()
            total_unique_players = int(player_count_res["total_players"]) if player_count_res else 0

            # 2. Total active teams
            cursor.execute(
                """
                SELECT COUNT(DISTINCT team_id) AS total_teams
                FROM vw_team_season_performance
                WHERE season_id = %s;
                """,
                (season_id,),
            )
            team_count_res = cursor.fetchone()
            total_teams = int(team_count_res["total_teams"]) if team_count_res else 0

            # 3. Total league goals and assists
            cursor.execute(
                """
                SELECT
                    COALESCE(SUM(goals_for), 0) AS total_goals
                FROM vw_team_season_performance
                WHERE season_id = %s;
                """,
                (season_id,),
            )
            goals_res = cursor.fetchone()
            total_goals = int(goals_res["total_goals"]) if goals_res else 0

            cursor.execute(
                """
                SELECT
                    COALESCE(SUM(assists), 0) AS total_assists,
                    ROUND(AVG(average_rating), 2) AS avg_rating
                FROM vw_player_season_performance
                WHERE season_id = %s AND average_rating IS NOT NULL;
                """,
                (season_id,),
            )
            assist_rating_res = cursor.fetchone()
            total_assists = int(assist_rating_res["total_assists"]) if assist_rating_res else 0
            avg_rating = float(assist_rating_res["avg_rating"]) if assist_rating_res and assist_rating_res["avg_rating"] is not None else 0.0

            # 4. Top 10 Goal Scorers
            cursor.execute(
                """
                SELECT
                    player_id,
                    player_name,
                    team_name,
                    appearances,
                    minutes_played,
                    goals,
                    assists,
                    average_rating
                FROM vw_player_season_performance_named
                WHERE season_id = %s AND goals > 0
                ORDER BY goals DESC, minutes_played ASC
                LIMIT 10;
                """,
                (season_id,),
            )
            top_scorers_raw = serialize_rows(cursor.fetchall())
            top_scorers = [TopScorer(**row) for row in top_scorers_raw]

            # 5. Top 10 Assist Providers
            cursor.execute(
                """
                SELECT
                    player_id,
                    player_name,
                    team_name,
                    appearances,
                    minutes_played,
                    assists,
                    goals,
                    average_rating
                FROM vw_player_season_performance_named
                WHERE season_id = %s AND assists > 0
                ORDER BY assists DESC, minutes_played ASC
                LIMIT 10;
                """,
                (season_id,),
            )
            top_assisters_raw = serialize_rows(cursor.fetchall())
            top_assisters = [TopAssister(**row) for row in top_assisters_raw]

            # 6. Team Goal Dynamics
            cursor.execute(
                """
                SELECT
                    team_id,
                    team_name,
                    goals_for,
                    goals_against,
                    goal_difference
                FROM vw_team_season_performance_named
                WHERE season_id = %s
                ORDER BY goals_for DESC;
                """,
                (season_id,),
            )
            team_goals_raw = serialize_rows(cursor.fetchall())
            team_goal_distribution = [TeamGoalSummary(**row) for row in team_goals_raw]

            return LeagueOverview(
                season_id=season_id,
                total_unique_players=total_unique_players,
                total_teams=total_teams,
                total_goals=total_goals,
                total_assists=total_assists,
                average_player_rating=avg_rating,
                top_scorers=top_scorers,
                top_assisters=top_assisters,
                team_goal_distribution=team_goal_distribution,
            )
        finally:
            cursor.close()
