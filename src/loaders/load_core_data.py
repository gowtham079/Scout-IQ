import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Set

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
        raise FileNotFoundError(f"Processed dataset not found: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def load_competitions(cursor, records: List[Dict[str, Any]]) -> int:
    """Upsert competition records."""
    query = """
        INSERT INTO competitions (competition_id, name, short_code, sport_id, country_id, active)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            short_code = VALUES(short_code),
            sport_id = VALUES(sport_id),
            country_id = VALUES(country_id),
            active = VALUES(active);
    """
    data = [
        (
            c["competition_id"],
            c["name"],
            c.get("short_code"),
            c.get("sport_id"),
            c.get("country_id"),
            1 if c.get("active") is True else (0 if c.get("active") is False else None),
        )
        for c in records
    ]
    cursor.executemany(query, data)
    return len(records)


def load_seasons(cursor, records: List[Dict[str, Any]]) -> int:
    """Upsert season records."""
    query = """
        INSERT INTO seasons (season_id, competition_id, name, starting_at, ending_at)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            competition_id = VALUES(competition_id),
            name = VALUES(name),
            starting_at = VALUES(starting_at),
            ending_at = VALUES(ending_at);
    """
    data = [
        (
            s["season_id"],
            s["competition_id"],
            s["name"],
            s.get("starting_at"),
            s.get("ending_at"),
        )
        for s in records
    ]
    cursor.executemany(query, data)
    return len(records)


def load_teams(cursor, records: List[Dict[str, Any]]) -> int:
    """Upsert team records."""
    query = """
        INSERT INTO teams (team_id, name, short_code, country_id, venue_id)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            short_code = VALUES(short_code),
            country_id = VALUES(country_id),
            venue_id = VALUES(venue_id);
    """
    data = [
        (
            t["team_id"],
            t["name"],
            t.get("short_code"),
            t.get("country_id"),
            t.get("venue_id"),
        )
        for t in records
    ]
    cursor.executemany(query, data)
    return len(records)


def load_team_seasons(cursor, records: List[Dict[str, Any]]) -> int:
    """Upsert team_season association records."""
    query = """
        INSERT INTO team_seasons (team_id, season_id)
        VALUES (%s, %s)
        ON DUPLICATE KEY UPDATE
            team_id = VALUES(team_id),
            season_id = VALUES(season_id);
    """
    data = [(ts["team_id"], ts["season_id"]) for ts in records]
    cursor.executemany(query, data)
    return len(records)


def load_fixtures(cursor, records: List[Dict[str, Any]]) -> int:
    """Upsert fixture records."""
    query = """
        INSERT INTO fixtures (
            fixture_id, season_id, home_team_id, away_team_id,
            venue_id, starting_at, stage_name, round_number, status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            season_id = VALUES(season_id),
            home_team_id = VALUES(home_team_id),
            away_team_id = VALUES(away_team_id),
            venue_id = VALUES(venue_id),
            starting_at = VALUES(starting_at),
            stage_name = VALUES(stage_name),
            round_number = VALUES(round_number),
            status = VALUES(status);
    """
    data = [
        (
            f["fixture_id"],
            f["season_id"],
            f["home_team_id"],
            f["away_team_id"],
            f.get("venue_id"),
            f["starting_at"],
            f.get("stage_name"),
            f.get("round_number"),
            f.get("status"),
        )
        for f in records
    ]
    cursor.executemany(query, data)
    return len(records)


def load_fixture_scores(cursor, records: List[Dict[str, Any]]) -> int:
    """
    Idempotent bulk insert for fixture_scores:
    1. Delete existing scores for the fixture IDs being loaded.
    2. Insert processed score records.
    """
    fixture_ids: List[int] = list({s["fixture_id"] for s in records})

    # Delete existing scores in chunks to ensure safe query parameter limits
    chunk_size = 500
    for i in range(0, len(fixture_ids), chunk_size):
        chunk = fixture_ids[i:i + chunk_size]
        placeholders = ",".join(["%s"] * len(chunk))
        cursor.execute(
            f"DELETE FROM fixture_scores WHERE fixture_id IN ({placeholders});",
            tuple(chunk),
        )

    # Bulk insert scores
    insert_query = """
        INSERT INTO fixture_scores (fixture_id, team_id, score_type, goals)
        VALUES (%s, %s, %s, %s);
    """
    data = [
        (
            s["fixture_id"],
            s["team_id"],
            s["score_type"],
            s["goals"],
        )
        for s in records
    ]
    cursor.executemany(insert_query, data)
    return len(records)


def verify_referential_integrity(
    competitions: List[Dict[str, Any]],
    seasons: List[Dict[str, Any]],
    teams: List[Dict[str, Any]],
    team_seasons: List[Dict[str, Any]],
    fixtures: List[Dict[str, Any]],
    fixture_scores: List[Dict[str, Any]],
) -> None:
    """
    Verify referential integrity across all datasets before committing.
    """
    comp_ids: Set[int] = {c["competition_id"] for c in competitions}
    season_ids: Set[int] = {s["season_id"] for s in seasons}
    team_ids: Set[int] = {t["team_id"] for t in teams}
    fixture_ids: Set[int] = {f["fixture_id"] for f in fixtures}

    for s in seasons:
        if s["competition_id"] not in comp_ids:
            raise ValueError(f"Integrity check failed: Season {s['season_id']} references invalid competition_id {s['competition_id']}")

    for ts in team_seasons:
        if ts["team_id"] not in team_ids:
            raise ValueError(f"Integrity check failed: TeamSeason references invalid team_id {ts['team_id']}")
        if ts["season_id"] not in season_ids:
            raise ValueError(f"Integrity check failed: TeamSeason references invalid season_id {ts['season_id']}")

    for f in fixtures:
        if f["season_id"] not in season_ids:
            raise ValueError(f"Integrity check failed: Fixture {f['fixture_id']} references invalid season_id {f['season_id']}")
        if f["home_team_id"] not in team_ids:
            raise ValueError(f"Integrity check failed: Fixture {f['fixture_id']} references invalid home_team_id {f['home_team_id']}")
        if f["away_team_id"] not in team_ids:
            raise ValueError(f"Integrity check failed: Fixture {f['fixture_id']} references invalid away_team_id {f['away_team_id']}")

    for sc in fixture_scores:
        if sc["fixture_id"] not in fixture_ids:
            raise ValueError(f"Integrity check failed: Score references invalid fixture_id {sc['fixture_id']}")
        if sc["team_id"] not in team_ids:
            raise ValueError(f"Integrity check failed: Score references invalid team_id {sc['team_id']}")


def get_database_counts(cursor) -> Dict[str, int]:
    """Query row counts for the core tables."""
    tables = [
        "competitions",
        "seasons",
        "teams",
        "team_seasons",
        "fixtures",
        "fixture_scores",
    ]
    counts = {}
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table};")
        counts[table] = cursor.fetchone()[0]
    return counts


def main() -> None:
    # 1. Load datasets from data/processed/
    competitions = load_json(PROCESSED_DIR / "competitions.json")
    seasons = load_json(PROCESSED_DIR / "seasons.json")
    teams = load_json(PROCESSED_DIR / "teams.json")
    team_seasons = load_json(PROCESSED_DIR / "team_seasons.json")
    fixtures = load_json(PROCESSED_DIR / "fixtures.json")
    fixture_scores = load_json(PROCESSED_DIR / "fixture_scores.json")

    # 2. Referential integrity pre-check
    verify_referential_integrity(
        competitions=competitions,
        seasons=seasons,
        teams=teams,
        team_seasons=team_seasons,
        fixtures=fixtures,
        fixture_scores=fixture_scores,
    )

    connection = None
    cursor = None

    try:
        connection = get_connection()
        connection.autocommit = False
        cursor = connection.cursor()

        # 3. Load in exact dependency order
        comp_count = load_competitions(cursor, competitions)
        season_count = load_seasons(cursor, seasons)
        team_count = load_teams(cursor, teams)
        ts_count = load_team_seasons(cursor, team_seasons)
        fixture_count = load_fixtures(cursor, fixtures)
        score_count = load_fixture_scores(cursor, fixture_scores)

        # 4. Commit transaction
        connection.commit()

        # 5. Print loading summary
        print("ScoutIQ — MySQL Core Data Load\n")
        print(f"Competitions loaded: {comp_count}")
        print(f"Seasons loaded: {season_count}")
        print(f"Teams loaded: {team_count}")
        print(f"Team-seasons loaded: {ts_count}")
        print(f"Fixtures loaded: {fixture_count}")
        print(f"Fixture-scores loaded: {score_count}\n")
        print("Transaction:")
        print("COMMITTED\n")

        # 6. Verify and print actual database counts
        db_counts = get_database_counts(cursor)
        print("Database Row Counts:")
        for table, count in db_counts.items():
            print(f"{table}: {count}")

    except Exception as err:
        if connection is not None:
            try:
                connection.rollback()
                print("\nTransaction:")
                print("ROLLED BACK")
            except Exception:
                pass
        print(f"\nError during MySQL load: {err}", file=sys.stderr)
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
