import logging
from typing import Any, Dict, List, Optional, Tuple

from backend.app.database import get_db_connection, serialize_row, serialize_rows
from backend.app.schemas.player import (
    MetricComparison,
    PlayerComparisonResponse,
    PlayerScoutingItem,
    TopPerformerRanking,
)
from backend.app.services.player_service import SCOUTING_COLUMNS

logger = logging.getLogger(__name__)

COMPARISON_METRIC_CONFIGS = [
    ("rating", "Match Rating", True),
    ("minutes_played", "Minutes Played", True),
    ("appearances", "Appearances", True),
    ("goals_per90", "Goals / 90", True),
    ("assists_per90", "Assists / 90", True),
    ("shots_per90", "Shots / 90", True),
    ("key_passes_per90", "Key Passes / 90", True),
    ("passes_per90", "Passes / 90", True),
    ("pass_accuracy_percentage", "Pass Accuracy %", True),
    ("successful_dribbles_per90", "Successful Dribbles / 90", True),
    ("tackles_per90", "Tackles / 90", True),
    ("tackle_success_percentage", "Tackle Success %", True),
    ("interceptions_per90", "Interceptions / 90", True),
    ("clearances_per90", "Clearances / 90", True),
    ("duels_won_per90", "Duels Won / 90", True),
    ("duel_win_percentage", "Duel Win %", True),
    ("shot_accuracy_percentage", "Shot Accuracy %", True),
    ("touches_per90", "Touches / 90", True),
]


def compare_players(player_id_1: int, player_id_2: int) -> Optional[PlayerComparisonResponse]:
    """
    Compare two players side-by-side using metrics from vw_player_scouting_features.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                f"""
                SELECT {SCOUTING_COLUMNS}
                FROM vw_player_scouting_features
                WHERE player_id IN (%s, %s);
                """,
                (player_id_1, player_id_2),
            )
            rows = {r["player_id"]: serialize_row(r) for r in cursor.fetchall()}

            p1_dict = rows.get(player_id_1)
            p2_dict = rows.get(player_id_2)

            if not p1_dict or not p2_dict:
                return None

            p1_item = PlayerScoutingItem(**p1_dict)
            p2_item = PlayerScoutingItem(**p2_dict)

            metric_comparisons: List[MetricComparison] = []
            for metric_key, label, _ in COMPARISON_METRIC_CONFIGS:
                val1 = getattr(p1_item, metric_key, None)
                val2 = getattr(p2_item, metric_key, None)

                val1_num = float(val1) if val1 is not None else None
                val2_num = float(val2) if val2 is not None else None

                diff = None
                leader = None

                if val1_num is not None and val2_num is not None:
                    diff = round(val1_num - val2_num, 2)
                    if val1_num > val2_num:
                        leader = player_id_1
                    elif val2_num > val1_num:
                        leader = player_id_2

                metric_comparisons.append(
                    MetricComparison(
                        metric=metric_key,
                        label=label,
                        player1_value=val1_num,
                        player2_value=val2_num,
                        difference=diff,
                        leader_player_id=leader,
                    )
                )

            return PlayerComparisonResponse(
                player1=p1_item,
                player2=p2_item,
                comparison_metrics=metric_comparisons,
            )
        finally:
            cursor.close()


def get_top_performers(season_id: int = 25536) -> List[TopPerformerRanking]:
    """
    Return transparently ranked performers across four core tactical dimensions.
    All ranking formulas and thresholds are documented and explainable.
    Optimized to execute via a single analytical view scan.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT
                    player_id,
                    player_name,
                    team_name,
                    minutes_played,
                    appearances,
                    rating,
                    goals_per90,
                    shots_per90,
                    key_passes_per90,
                    assists_per90,
                    tackles_per90,
                    interceptions_per90,
                    pass_accuracy_percentage,
                    tackle_success_percentage,
                    shot_accuracy_percentage
                FROM vw_player_scouting_features
                WHERE season_id = %s AND minutes_played >= 450;
                """,
                (season_id,),
            )
            raw_players = serialize_rows(cursor.fetchall())
        finally:
            cursor.close()

    # 1. Clinical Finishers: goals_per90 DESC, rating DESC (min 450 mins)
    finishers = sorted(
        raw_players,
        key=lambda p: (p.get("goals_per90") or 0.0, p.get("rating") or 0.0),
        reverse=True,
    )[:5]
    finishers_formatted = [
        {
            "player_id": p["player_id"],
            "player_name": p["player_name"],
            "team_name": p["team_name"],
            "minutes_played": p["minutes_played"],
            "appearances": p["appearances"],
            "rating": p["rating"],
            "goals_per90": p["goals_per90"],
            "shots_per90": p["shots_per90"],
            "shot_accuracy_percentage": p["shot_accuracy_percentage"],
        }
        for p in finishers
    ]

    # 2. Creative Playmakers: (key_passes_per90 + assists_per90) DESC, rating DESC (min 450 mins)
    for p in raw_players:
        kp = p.get("key_passes_per90") or 0.0
        ast = p.get("assists_per90") or 0.0
        p["shot_contributions_per90"] = round(kp + ast, 2)

    playmakers = sorted(
        raw_players,
        key=lambda p: (p["shot_contributions_per90"], p.get("rating") or 0.0),
        reverse=True,
    )[:5]
    playmakers_formatted = [
        {
            "player_id": p["player_id"],
            "player_name": p["player_name"],
            "team_name": p["team_name"],
            "minutes_played": p["minutes_played"],
            "appearances": p["appearances"],
            "rating": p["rating"],
            "key_passes_per90": p["key_passes_per90"],
            "assists_per90": p["assists_per90"],
            "shot_contributions_per90": p["shot_contributions_per90"],
            "pass_accuracy_percentage": p["pass_accuracy_percentage"],
        }
        for p in playmakers
    ]

    # 3. Defensive Disruptors: (tackles_per90 + interceptions_per90) DESC, rating DESC (min 450 mins)
    for p in raw_players:
        tkl = p.get("tackles_per90") or 0.0
        inter = p.get("interceptions_per90") or 0.0
        p["defensive_actions_per90"] = round(tkl + inter, 2)

    defenders = sorted(
        raw_players,
        key=lambda p: (p["defensive_actions_per90"], p.get("rating") or 0.0),
        reverse=True,
    )[:5]
    defenders_formatted = [
        {
            "player_id": p["player_id"],
            "player_name": p["player_name"],
            "team_name": p["team_name"],
            "minutes_played": p["minutes_played"],
            "appearances": p["appearances"],
            "rating": p["rating"],
            "tackles_per90": p["tackles_per90"],
            "interceptions_per90": p["interceptions_per90"],
            "defensive_actions_per90": p["defensive_actions_per90"],
            "tackle_success_percentage": p["tackle_success_percentage"],
        }
        for p in defenders
    ]

    # 4. Elite Performers: rating DESC (min 900 mins)
    elite_qualified = [p for p in raw_players if (p.get("minutes_played") or 0) >= 900]
    elite = sorted(
        elite_qualified,
        key=lambda p: (p.get("rating") or 0.0, p.get("minutes_played") or 0),
        reverse=True,
    )[:5]
    elite_formatted = [
        {
            "player_id": p["player_id"],
            "player_name": p["player_name"],
            "team_name": p["team_name"],
            "minutes_played": p["minutes_played"],
            "appearances": p["appearances"],
            "rating": p["rating"],
            "goals_per90": p["goals_per90"],
            "assists_per90": p["assists_per90"],
            "pass_accuracy_percentage": p["pass_accuracy_percentage"],
        }
        for p in elite
    ]

    return [
        TopPerformerRanking(
            category="Clinical Finishers",
            description="Highest goal volume per 90 minutes of play",
            formula="goals_per90 DESC",
            criteria="Minimum 450 minutes played in season",
            players=finishers_formatted,
        ),
        TopPerformerRanking(
            category="Creative Playmakers",
            description="Combined shot contributions per 90 (key passes + assists)",
            formula="(key_passes_per90 + assists_per90) DESC",
            criteria="Minimum 450 minutes played in season",
            players=playmakers_formatted,
        ),
        TopPerformerRanking(
            category="Defensive Disruptors",
            description="Combined ball-winning actions per 90 (tackles + interceptions)",
            formula="(tackles_per90 + interceptions_per90) DESC",
            criteria="Minimum 450 minutes played in season",
            players=defenders_formatted,
        ),
        TopPerformerRanking(
            category="Elite Performers",
            description="Highest overall match performance ratings over substantial pitch time",
            formula="rating DESC",
            criteria="Minimum 900 minutes played (high sample confidence)",
            players=elite_formatted,
        ),
    ]
