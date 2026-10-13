import logging
import math
from typing import Any, Dict, List, Optional, Tuple

from backend.app.database import get_db_connection, serialize_row, serialize_rows
from backend.app.schemas.player import (
    PaginatedPlayersResponse,
    PlayerDetail,
    PlayerPer90Metrics,
    PlayerScoutingItem,
    PlayerSeasonTotals,
)

logger = logging.getLogger(__name__)

# Validated column whitelist to avoid SQL injection on dynamic ordering
ALLOWED_SORT_FIELDS = {
    "rating": "rating",
    "goals_per90": "goals_per90",
    "assists_per90": "assists_per90",
    "shots_per90": "shots_per90",
    "key_passes_per90": "key_passes_per90",
    "passes_per90": "passes_per90",
    "accurate_passes_per90": "accurate_passes_per90",
    "successful_dribbles_per90": "successful_dribbles_per90",
    "tackles_per90": "tackles_per90",
    "interceptions_per90": "interceptions_per90",
    "clearances_per90": "clearances_per90",
    "duels_won_per90": "duels_won_per90",
    "touches_per90": "touches_per90",
    "pass_accuracy_percentage": "pass_accuracy_percentage",
    "tackle_success_percentage": "tackle_success_percentage",
    "duel_win_percentage": "duel_win_percentage",
    "shot_accuracy_percentage": "shot_accuracy_percentage",
    "minutes_played": "minutes_played",
    "appearances": "appearances",
    "player_name": "player_name",
    "team_name": "team_name",
}

SCOUTING_COLUMNS = """
    player_id,
    player_name,
    team_id,
    team_name,
    season_id,
    minutes_played,
    appearances,
    rating,
    goals_per90,
    assists_per90,
    shots_per90,
    key_passes_per90,
    passes_per90,
    accurate_passes_per90,
    successful_dribbles_per90,
    tackles_per90,
    interceptions_per90,
    clearances_per90,
    duels_won_per90,
    touches_per90,
    pass_accuracy_percentage,
    tackle_success_percentage,
    duel_win_percentage,
    shot_accuracy_percentage
"""


def get_players(
    search: Optional[str] = None,
    team_id: Optional[int] = None,
    min_minutes: Optional[float] = None,
    min_rating: Optional[float] = None,
    sort_by: str = "rating",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 20,
) -> PaginatedPlayersResponse:
    """
    Search, filter, and paginate player records from vw_player_scouting_features.
    """
    # Sanitize sort fields
    order_col = ALLOWED_SORT_FIELDS.get(sort_by.lower(), "rating")
    direction = "ASC" if sort_order.lower() == "asc" else "DESC"

    # Enforce safe pagination boundaries
    page = max(1, page)
    page_size = max(1, min(100, page_size))
    offset = (page - 1) * page_size

    where_clauses: List[str] = []
    params: List[Any] = []

    if search and search.strip():
        where_clauses.append("player_name LIKE %s")
        params.append(f"%{search.strip()}%")

    if team_id is not None:
        where_clauses.append("team_id = %s")
        params.append(team_id)

    if min_minutes is not None and min_minutes > 0:
        where_clauses.append("minutes_played >= %s")
        params.append(min_minutes)

    if min_rating is not None and min_rating > 0:
        where_clauses.append("rating >= %s")
        params.append(min_rating)

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    with get_db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            # 1. Total count query
            count_query = f"SELECT COUNT(*) AS total FROM vw_player_scouting_features {where_sql};"
            cursor.execute(count_query, params)
            total = cursor.fetchone()["total"]

            # 2. Paginated data query
            data_query = f"""
                SELECT {SCOUTING_COLUMNS}
                FROM vw_player_scouting_features
                {where_sql}
                ORDER BY {order_col} {direction}, player_name ASC
                LIMIT %s OFFSET %s;
            """
            cursor.execute(data_query, params + [page_size, offset])
            rows = serialize_rows(cursor.fetchall())
            items = [PlayerScoutingItem(**row) for row in rows]

            total_pages = math.ceil(total / page_size) if total > 0 else 1

            return PaginatedPlayersResponse(
                items=items,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            )
        finally:
            cursor.close()


def get_player_by_id(player_id: int) -> Optional[PlayerDetail]:
    """
    Fetch comprehensive player record combining scouting features,
    season totals, and per-90 metrics.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            # 1. Scouting features
            cursor.execute(
                f"""
                SELECT {SCOUTING_COLUMNS}
                FROM vw_player_scouting_features
                WHERE player_id = %s;
                """,
                (player_id,),
            )
            scouting_row = serialize_row(cursor.fetchone())
            if not scouting_row:
                return None

            # 2. Season totals
            cursor.execute(
                """
                SELECT
                    appearances,
                    minutes_played,
                    goals,
                    assists,
                    shots_total,
                    shots_on_target,
                    passes,
                    accurate_passes,
                    key_passes,
                    successful_dribbles,
                    tackles,
                    tackles_won,
                    interceptions,
                    clearances,
                    duels_won,
                    duels_lost,
                    touches,
                    possession_lost,
                    average_rating
                FROM vw_player_season_performance_named
                WHERE player_id = %s;
                """,
                (player_id,),
            )
            season_row = serialize_row(cursor.fetchone())

            # 3. Per-90 metrics
            cursor.execute(
                """
                SELECT
                    minutes_played,
                    goals_per90,
                    assists_per90,
                    shots_per90,
                    shots_on_target_per90,
                    key_passes_per90,
                    passes_per90,
                    accurate_passes_per90,
                    successful_dribbles_per90,
                    tackles_per90,
                    interceptions_per90,
                    clearances_per90,
                    duels_won_per90,
                    touches_per90
                FROM vw_player_per90_metrics
                WHERE player_id = %s;
                """,
                (player_id,),
            )
            per90_row = serialize_row(cursor.fetchone())

            scouting_features = PlayerScoutingItem(**scouting_row)
            season_totals = PlayerSeasonTotals(**season_row) if season_row else None
            per90_metrics = PlayerPer90Metrics(**per90_row) if per90_row else None

            return PlayerDetail(
                player_id=scouting_row["player_id"],
                player_name=scouting_row["player_name"],
                team_id=scouting_row["team_id"],
                team_name=scouting_row["team_name"],
                season_id=scouting_row["season_id"],
                scouting_features=scouting_features,
                season_totals=season_totals,
                per90_metrics=per90_metrics,
            )
        finally:
            cursor.close()
