import json
import sys
from pathlib import Path
from typing import Any, Dict, List

# Ensure UTF-8 output encoding for consoles that default to cp1252 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.database.connection import get_connection

PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"


def load_json(filepath: Path) -> Any:
    """Load JSON content safely using UTF-8."""
    if not filepath.exists():
        raise FileNotFoundError(f"Processed file not found: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def load_players(cursor, records: List[Dict[str, Any]], batch_size: int = 2000) -> int:
    """Upsert players into MySQL."""
    query = """
        INSERT INTO players (player_id, name, nationality, height_cm, image_url)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            nationality = VALUES(nationality),
            height_cm = VALUES(height_cm),
            image_url = VALUES(image_url);
    """
    for i in range(0, len(records), batch_size):
        chunk = records[i : i + batch_size]
        data = [
            (
                p["player_id"],
                p["name"],
                p.get("nationality"),
                p.get("height_cm"),
                p.get("image_url"),
            )
            for p in chunk
        ]
        cursor.executemany(query, data)
    return len(records)


def load_stat_types(cursor, records: List[Dict[str, Any]], batch_size: int = 1000) -> int:
    """Upsert stat types into MySQL."""
    query = """
        INSERT INTO stat_types (stat_type_id, code, name, category, data_type)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            code = VALUES(code),
            name = VALUES(name),
            category = VALUES(category),
            data_type = VALUES(data_type);
    """
    for i in range(0, len(records), batch_size):
        chunk = records[i : i + batch_size]
        data = [
            (
                s["stat_type_id"],
                s["code"],
                s["name"],
                s.get("category"),
                s.get("data_type", "numeric"),
            )
            for s in chunk
        ]
        cursor.executemany(query, data)
    return len(records)


def load_lineups(cursor, records: List[Dict[str, Any]], batch_size: int = 2000) -> int:
    """Upsert lineups into MySQL."""
    query = """
        INSERT INTO lineups (
            lineup_id, fixture_id, player_id, team_id,
            position_id, formation_position, formation_field,
            jersey_number, lineup_type_id, is_captain
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            lineup_id = VALUES(lineup_id),
            team_id = VALUES(team_id),
            position_id = VALUES(position_id),
            formation_position = VALUES(formation_position),
            formation_field = VALUES(formation_field),
            jersey_number = VALUES(jersey_number),
            lineup_type_id = VALUES(lineup_type_id),
            is_captain = VALUES(is_captain);
    """
    for i in range(0, len(records), batch_size):
        chunk = records[i : i + batch_size]
        data = [
            (
                l["lineup_id"],
                l["fixture_id"],
                l["player_id"],
                l["team_id"],
                l.get("position_id"),
                l.get("formation_position"),
                l.get("formation_field"),
                l.get("jersey_number"),
                l.get("lineup_type_id"),
                l.get("is_captain", 0),
            )
            for l in chunk
        ]
        cursor.executemany(query, data)
    return len(records)


def load_player_match_stats(cursor, records: List[Dict[str, Any]], batch_size: int = 5000) -> int:
    """Upsert player match statistics in batches."""
    query = """
        INSERT INTO player_match_stats (
            fixture_id, player_id, team_id, stat_type_id, numeric_value, text_value
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            team_id = VALUES(team_id),
            numeric_value = VALUES(numeric_value),
            text_value = VALUES(text_value);
    """
    for i in range(0, len(records), batch_size):
        chunk = records[i : i + batch_size]
        data = [
            (
                p["fixture_id"],
                p["player_id"],
                p["team_id"],
                p["stat_type_id"],
                p.get("numeric_value"),
                p.get("text_value"),
            )
            for p in chunk
        ]
        cursor.executemany(query, data)
    return len(records)


def load_match_events(cursor, records: List[Dict[str, Any]], batch_size: int = 2000) -> int:
    """Upsert match events into MySQL."""
    query = """
        INSERT INTO match_events (
            event_id, fixture_id, player_id, team_id,
            event_type, minute, extra_minute, raw_event_data
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            fixture_id = VALUES(fixture_id),
            player_id = VALUES(player_id),
            team_id = VALUES(team_id),
            event_type = VALUES(event_type),
            minute = VALUES(minute),
            extra_minute = VALUES(extra_minute),
            raw_event_data = VALUES(raw_event_data);
    """
    for i in range(0, len(records), batch_size):
        chunk = records[i : i + batch_size]
        data = [
            (
                e["event_id"],
                e["fixture_id"],
                e.get("player_id"),
                e.get("team_id"),
                e["event_type"],
                e.get("minute"),
                e.get("extra_minute"),
                json.dumps(e.get("raw_event_data"), ensure_ascii=False) if e.get("raw_event_data") else None,
            )
            for e in chunk
        ]
        cursor.executemany(query, data)
    return len(records)


def load_team_stat_types(cursor, records: List[Dict[str, Any]], batch_size: int = 1000) -> int:
    """Upsert team statistic definitions into MySQL."""
    query = """
        INSERT INTO team_stat_types (team_stat_type_id, code, name, data_type)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            code = VALUES(code),
            name = VALUES(name),
            data_type = VALUES(data_type);
    """
    for i in range(0, len(records), batch_size):
        chunk = records[i : i + batch_size]
        data = [
            (
                t["team_stat_type_id"],
                t["code"],
                t["name"],
                t.get("data_type", "numeric"),
            )
            for t in chunk
        ]
        cursor.executemany(query, data)
    return len(records)


def load_team_match_stats(cursor, records: List[Dict[str, Any]], batch_size: int = 2000) -> int:
    """Upsert team match statistics into MySQL."""
    query = """
        INSERT INTO team_match_stats (
            fixture_id, team_id, team_stat_type_id, numeric_value, text_value
        )
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            numeric_value = VALUES(numeric_value),
            text_value = VALUES(text_value);
    """
    for i in range(0, len(records), batch_size):
        chunk = records[i : i + batch_size]
        data = [
            (
                ts["fixture_id"],
                ts["team_id"],
                ts["team_stat_type_id"],
                ts.get("numeric_value"),
                ts.get("text_value"),
            )
            for ts in chunk
        ]
        cursor.executemany(query, data)
    return len(records)


def get_actual_row_counts(cursor) -> Dict[str, int]:
    """Query row counts for all player analytics tables."""
    tables = [
        "players",
        "stat_types",
        "lineups",
        "player_match_stats",
        "match_events",
        "team_stat_types",
        "team_match_stats",
    ]
    counts = {}
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table};")
        counts[table] = cursor.fetchone()[0]
    return counts


def main() -> None:
    # 1. Load processed JSON datasets
    players = load_json(PROCESSED_DIR / "players.json")
    stat_types = load_json(PROCESSED_DIR / "stat_types.json")
    lineups = load_json(PROCESSED_DIR / "lineups.json")
    player_match_stats = load_json(PROCESSED_DIR / "player_match_stats.json")
    match_events = load_json(PROCESSED_DIR / "match_events.json")
    team_stat_types = load_json(PROCESSED_DIR / "team_stat_types.json")
    team_match_stats = load_json(PROCESSED_DIR / "team_match_stats.json")

    connection = None
    cursor = None

    try:
        connection = get_connection()
        connection.autocommit = False
        cursor = connection.cursor()

        # 2. Load in exact dependency order
        p_count = load_players(cursor, players)
        st_count = load_stat_types(cursor, stat_types)
        l_count = load_lineups(cursor, lineups)
        pms_count = load_player_match_stats(cursor, player_match_stats)
        me_count = load_match_events(cursor, match_events)
        tst_count = load_team_stat_types(cursor, team_stat_types)
        tms_count = load_team_match_stats(cursor, team_match_stats)

        # 3. Commit transaction
        connection.commit()

        # 4. Print summary report
        print("ScoutIQ — Player Data Load\n")
        print(f"Players loaded: {p_count}")
        print(f"Statistic types loaded: {st_count}")
        print(f"Lineups loaded: {l_count}")
        print(f"Player match stats loaded: {pms_count}")
        print(f"Match events loaded: {me_count}")
        print(f"Team statistic types loaded: {tst_count}")
        print(f"Team match stats loaded: {tms_count}\n")
        print("Transaction:")
        print("COMMITTED\n")

        # 5. Query and print actual row counts
        row_counts = get_actual_row_counts(cursor)
        print("Database Row Counts:")
        for table, count in row_counts.items():
            print(f"{table}: {count}")

    except Exception as err:
        if connection is not None:
            try:
                connection.rollback()
                print("\nTransaction:")
                print("ROLLED BACK")
            except Exception:
                pass
        print(f"\nError during player data load: {err}", file=sys.stderr)
        sys.exit(1)

    finally:
        if cursor is not None:
            try:
                cursor.close()
            except Exception:
                pass
        if connection is not None and connection.is_connected():
            try:
                connection.close()
            except Exception:
                pass


if __name__ == "__main__":
    main()
