import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure UTF-8 output encoding for consoles that default to cp1252 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

RAW_LEAGUE_FILE = RAW_DIR / "superliga_271.json"
RAW_SEASON_FILE = RAW_DIR / "season_25536.json"
RAW_TEAMS_FILE = RAW_DIR / "teams_season_25536.json"
RAW_SCHEDULE_FILE = RAW_DIR / "schedule_season_25536.json"

SEASON_ID = 25536


def load_json(filepath: Path) -> Dict[str, Any]:
    """Load JSON content from a file."""
    if not filepath.exists():
        raise FileNotFoundError(f"Raw data file not found: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(data: Any, filepath: Path) -> None:
    """Save data structure to a JSON file formatted with indentation and UTF-8."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def transform_competition(raw_league: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Transform raw league JSON into normalized competition record.
    """
    data = raw_league.get("data", {})
    record = {
        "competition_id": data.get("id"),
        "name": data.get("name"),
        "short_code": data.get("short_code"),
        "sport_id": data.get("sport_id"),
        "country_id": data.get("country_id"),
        "active": bool(data.get("active")) if data.get("active") is not None else None,
    }
    return [record]


def transform_season(raw_season: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Transform raw season JSON into normalized season record.
    """
    data = raw_season.get("data", {})
    record = {
        "season_id": data.get("id"),
        "competition_id": data.get("league_id"),
        "name": data.get("name"),
        "starting_at": data.get("starting_at"),
        "ending_at": data.get("ending_at"),
    }
    return [record]


def transform_teams(raw_teams: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Transform raw teams JSON into normalized team records.
    """
    teams_list = raw_teams.get("data", [])
    records = []
    for item in teams_list:
        record = {
            "team_id": item.get("id"),
            "name": item.get("name"),
            "short_code": item.get("short_code"),
            "country_id": item.get("country_id"),
            "venue_id": item.get("venue_id"),
        }
        records.append(record)
    return records


def transform_team_seasons(teams: List[Dict[str, Any]], season_id: int = SEASON_ID) -> List[Dict[str, Any]]:
    """
    Generate normalized team_season association records.
    """
    records = []
    for team in teams:
        record = {
            "team_id": team["team_id"],
            "season_id": season_id,
        }
        records.append(record)
    return records


def _parse_round_number(round_name: Any) -> Optional[int]:
    """Parse round number safely from string/integer or return None."""
    if round_name is None:
        return None
    try:
        return int(str(round_name).strip())
    except (ValueError, TypeError):
        return None


def _normalize_status(state_id: Optional[int], result_info: Optional[str]) -> Optional[str]:
    """
    Normalize match status:
    - If state_id == 5, map to 'FT' (Full Time).
    - Otherwise fallback to result_info or safe string representation.
    """
    if state_id == 5:
        return "FT"
    elif result_info:
        return str(result_info).strip()
    elif state_id is not None:
        return str(state_id)
    return None


def transform_fixtures(raw_schedule: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Traverse schedule stages, rounds, and fixtures to extract normalized fixture records.
    """
    stages = raw_schedule.get("data", [])
    fixtures: List[Dict[str, Any]] = []
    seen_ids = set()

    for stage in stages:
        stage_name = stage.get("name")
        rounds = stage.get("rounds", [])
        if not isinstance(rounds, list):
            continue

        for r in rounds:
            round_number = _parse_round_number(r.get("name"))
            round_fixtures = r.get("fixtures", [])
            if not isinstance(round_fixtures, list):
                continue

            for f in round_fixtures:
                fixture_id = f.get("id")
                if fixture_id in seen_ids:
                    continue
                seen_ids.add(fixture_id)

                home_team_id = None
                away_team_id = None
                for participant in f.get("participants", []):
                    location = participant.get("meta", {}).get("location")
                    if location == "home":
                        home_team_id = participant.get("id")
                    elif location == "away":
                        away_team_id = participant.get("id")

                record = {
                    "fixture_id": fixture_id,
                    "season_id": f.get("season_id"),
                    "home_team_id": home_team_id,
                    "away_team_id": away_team_id,
                    "venue_id": f.get("venue_id"),
                    "starting_at": f.get("starting_at"),
                    "stage_name": stage_name,
                    "round_number": round_number,
                    "status": _normalize_status(f.get("state_id"), f.get("result_info")),
                }
                fixtures.append(record)

    return fixtures


def transform_fixture_scores(raw_schedule: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extract normalized individual score records for every fixture.
    """
    stages = raw_schedule.get("data", [])
    scores: List[Dict[str, Any]] = []
    seen_fixture_ids = set()

    for stage in stages:
        rounds = stage.get("rounds", [])
        if not isinstance(rounds, list):
            continue

        for r in rounds:
            round_fixtures = r.get("fixtures", [])
            if not isinstance(round_fixtures, list):
                continue

            for f in round_fixtures:
                fixture_id = f.get("id")
                if fixture_id in seen_fixture_ids:
                    continue
                seen_fixture_ids.add(fixture_id)

                fixture_scores = f.get("scores", [])
                if not isinstance(fixture_scores, list):
                    continue

                for s in fixture_scores:
                    goals = s.get("score", {}).get("goals")
                    score_record = {
                        "fixture_id": fixture_id,
                        "team_id": s.get("participant_id"),
                        "score_type": s.get("description"),
                        "goals": goals if goals is not None else 0,
                    }
                    scores.append(score_record)

    return scores


def validate_processed_data(
    competitions: List[Dict[str, Any]],
    seasons: List[Dict[str, Any]],
    teams: List[Dict[str, Any]],
    team_seasons: List[Dict[str, Any]],
    fixtures: List[Dict[str, Any]],
    fixture_scores: List[Dict[str, Any]],
) -> Dict[str, int]:
    """
    Run comprehensive structural and relational validations against normalized datasets.
    """
    if len(competitions) != 1:
        raise ValueError(f"Validation Error: Expected 1 competition, got {len(competitions)}")
    if len(seasons) != 1:
        raise ValueError(f"Validation Error: Expected 1 season, got {len(seasons)}")
    if len(teams) != 12:
        raise ValueError(f"Validation Error: Expected 12 teams, got {len(teams)}")
    if len(team_seasons) != 12:
        raise ValueError(f"Validation Error: Expected 12 team_seasons, got {len(team_seasons)}")
    if len(fixtures) != 192:
        raise ValueError(f"Validation Error: Expected 192 fixtures, got {len(fixtures)}")

    valid_team_ids = {t["team_id"] for t in teams}
    valid_season_id = seasons[0]["season_id"]
    valid_fixture_ids = set()

    seen_fids = set()
    duplicate_fixtures = 0
    missing_home_teams = 0
    missing_away_teams = 0
    invalid_team_refs = 0
    invalid_season_refs = 0

    for f in fixtures:
        fid = f.get("fixture_id")
        if fid in seen_fids:
            duplicate_fixtures += 1
        seen_fids.add(fid)
        valid_fixture_ids.add(fid)

        if f.get("home_team_id") is None:
            missing_home_teams += 1
        elif f.get("home_team_id") not in valid_team_ids:
            invalid_team_refs += 1

        if f.get("away_team_id") is None:
            missing_away_teams += 1
        elif f.get("away_team_id") not in valid_team_ids:
            invalid_team_refs += 1

        if f.get("season_id") != valid_season_id:
            invalid_season_refs += 1

        if f.get("starting_at") is None:
            raise ValueError(f"Validation Error: Fixture {fid} has null starting_at")
        if f.get("venue_id") is None:
            raise ValueError(f"Validation Error: Fixture {fid} has null venue_id")

    for s in fixture_scores:
        if s.get("fixture_id") not in valid_fixture_ids:
            raise ValueError(f"Validation Error: Fixture score references unknown fixture_id {s.get('fixture_id')}")
        if s.get("team_id") not in valid_team_ids:
            invalid_team_refs += 1

    validation_results = {
        "duplicate_fixtures": duplicate_fixtures,
        "invalid_team_refs": invalid_team_refs,
        "invalid_season_refs": invalid_season_refs,
        "missing_home_teams": missing_home_teams,
        "missing_away_teams": missing_away_teams,
    }

    if any(val > 0 for val in validation_results.values()):
        raise ValueError(f"Validation failed with issues: {validation_results}")

    return validation_results


def clean_core_data() -> Dict[str, Any]:
    """
    Orchestrate extraction, normalization, validation, and serialization of all core datasets.
    """
    raw_league = load_json(RAW_LEAGUE_FILE)
    raw_season = load_json(RAW_SEASON_FILE)
    raw_teams = load_json(RAW_TEAMS_FILE)
    raw_schedule = load_json(RAW_SCHEDULE_FILE)

    competitions = transform_competition(raw_league)
    seasons = transform_season(raw_season)
    teams = transform_teams(raw_teams)
    team_seasons = transform_team_seasons(teams, season_id=SEASON_ID)
    fixtures = transform_fixtures(raw_schedule)
    fixture_scores = transform_fixture_scores(raw_schedule)

    validation_stats = validate_processed_data(
        competitions=competitions,
        seasons=seasons,
        teams=teams,
        team_seasons=team_seasons,
        fixtures=fixtures,
        fixture_scores=fixture_scores,
    )

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    save_json(competitions, PROCESSED_DIR / "competitions.json")
    save_json(seasons, PROCESSED_DIR / "seasons.json")
    save_json(teams, PROCESSED_DIR / "teams.json")
    save_json(team_seasons, PROCESSED_DIR / "team_seasons.json")
    save_json(fixtures, PROCESSED_DIR / "fixtures.json")
    save_json(fixture_scores, PROCESSED_DIR / "fixture_scores.json")

    return {
        "competitions": competitions,
        "seasons": seasons,
        "teams": teams,
        "team_seasons": team_seasons,
        "fixtures": fixtures,
        "fixture_scores": fixture_scores,
        "validation": validation_stats,
    }


def main():
    print("ScoutIQ — Core Data Transformation\n")
    try:
        results = clean_core_data()
        val = results["validation"]

        print(f"Competition records: {len(results['competitions'])}")
        print(f"Season records: {len(results['seasons'])}")
        print(f"Team records: {len(results['teams'])}")
        print(f"Team-season records: {len(results['team_seasons'])}")
        print(f"Fixture records: {len(results['fixtures'])}")
        print(f"Fixture-score records: {len(results['fixture_scores'])}\n")

        print("Validation:")
        print(f"Duplicate fixtures: {val['duplicate_fixtures']}")
        print(f"Invalid team references: {val['invalid_team_refs']}")
        print(f"Invalid season references: {val['invalid_season_refs']}")
        print(f"Missing home teams: {val['missing_home_teams']}")
        print(f"Missing away teams: {val['missing_away_teams']}\n")

        print("Transformation completed successfully.")
    except Exception as err:
        print(f"Transformation failed: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
