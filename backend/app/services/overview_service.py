import logging
from typing import Any, Dict, List

from backend.app.database import get_db_connection, serialize_row, serialize_rows
from backend.app.schemas.overview import LeagueOverview, TeamGoalSummary, TopAssister, TopScorer

logger = logging.getLogger(__name__)


def get_league_overview(season_id: int = 25536) -> LeagueOverview:
    """
    Retrieve high-level league KPIs and distributions for the Danish Superliga season.
    Consolidates queries into a single team-season pass and a single player-season pass
    to minimize expensive unindexed view evaluations.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            # 1. Consolidated Team Query: calculates team goal dynamics, total teams, and total goals
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
            total_teams = len(team_goal_distribution)
            total_goals = sum(row["goals_for"] for row in team_goals_raw)

            # 2. Consolidated Player Query: retrieves all player-season records in a single view evaluation
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
                WHERE season_id = %s;
                """,
                (season_id,),
            )
            player_rows_raw = serialize_rows(cursor.fetchall())

            # Unique player count across the season (avoids double-counting players across mid-season transfers)
            unique_player_ids = {
                row["player_id"]
                for row in player_rows_raw
                if row.get("player_id") is not None
            }
            total_unique_players = len(unique_player_ids)

            # Total assists across the season
            total_assists = int(sum(row["assists"] or 0 for row in player_rows_raw))

            # League-wide average player rating (excluding NULL ratings, rounded to 2 decimal places)
            ratings = [
                row["average_rating"]
                for row in player_rows_raw
                if row.get("average_rating") is not None
            ]
            avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0

            # Top 10 Goal Scorers (goals > 0, tie-broken by minutes_played ASC)
            scorers_candidates = [
                row for row in player_rows_raw if (row.get("goals") or 0) > 0
            ]
            scorers_sorted = sorted(
                scorers_candidates,
                key=lambda r: (-r["goals"], r["minutes_played"]),
            )[:10]
            top_scorers = [TopScorer(**row) for row in scorers_sorted]

            # Top 10 Assist Providers (assists > 0, tie-broken by minutes_played ASC)
            assisters_candidates = [
                row for row in player_rows_raw if (row.get("assists") or 0) > 0
            ]
            assisters_sorted = sorted(
                assisters_candidates,
                key=lambda r: (-r["assists"], r["minutes_played"]),
            )[:10]
            top_assisters = [TopAssister(**row) for row in assisters_sorted]

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
