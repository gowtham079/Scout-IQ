import json
import sys
from pathlib import Path
from typing import Any, Dict

# Ensure UTF-8 output encoding for consoles that default to cp1252 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure project root is in sys.path for direct execution and module imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.api.sportmonks import SportmonksClient, SportmonksError

RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"

LEAGUE_ID = 271
LEAGUE_NAME = "Superliga"
SEASON_ID = 25536
SEASON_NAME = "2025/2026"


def save_raw_json(data: Dict[str, Any], filepath: Path) -> None:
    """Save raw response dictionary to a JSON file formatted with UTF-8."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def fetch_core_data(client: SportmonksClient) -> Dict[str, Any]:
    """
    Fetch raw league, season, teams, and schedule data from Sportmonks
    and save them as JSON files in data/raw/.
    """
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)

    files_created = []

    # 1. League information
    print(f"Fetching league info for ID {LEAGUE_ID} ({LEAGUE_NAME})...")
    league_response = client.get(f"leagues/{LEAGUE_ID}")
    league_file = RAW_DATA_DIR / f"superliga_{LEAGUE_ID}.json"
    save_raw_json(league_response, league_file)
    files_created.append(league_file)

    # 2. Season information
    print(f"Fetching season info for ID {SEASON_ID} ({SEASON_NAME})...")
    season_response = client.get(f"seasons/{SEASON_ID}")
    season_file = RAW_DATA_DIR / f"season_{SEASON_ID}.json"
    save_raw_json(season_response, season_file)
    files_created.append(season_file)

    # 3. Teams for season
    print(f"Fetching teams for season ID {SEASON_ID}...")
    teams_response = client.get_teams_by_season(SEASON_ID)
    teams_file = RAW_DATA_DIR / f"teams_season_{SEASON_ID}.json"
    save_raw_json(teams_response, teams_file)
    files_created.append(teams_file)

    # 4. Schedule/fixtures for season
    print(f"Fetching schedule for season ID {SEASON_ID}...")
    schedule_response = client.get_schedule_by_season(SEASON_ID)
    schedule_file = RAW_DATA_DIR / f"schedule_season_{SEASON_ID}.json"
    save_raw_json(schedule_response, schedule_file)
    files_created.append(schedule_file)

    # Extract summary metrics
    teams_data = teams_response.get("data", [])
    teams_count = len(teams_data) if isinstance(teams_data, list) else 0

    stages = schedule_response.get("data", [])
    stages_count = len(stages) if isinstance(stages, list) else 0

    total_fixtures = 0
    if isinstance(stages, list):
        for stage in stages:
            rounds = stage.get("rounds", [])
            if isinstance(rounds, list):
                for round_item in rounds:
                    fixtures = round_item.get("fixtures", [])
                    if isinstance(fixtures, list):
                        total_fixtures += len(fixtures)

    return {
        "files_created": files_created,
        "teams_count": teams_count,
        "stages_count": stages_count,
        "total_fixtures": total_fixtures,
    }


def main() -> None:
    try:
        client = SportmonksClient()
        summary = fetch_core_data(client)

        print("\nIngestion Summary:")
        print("------------------")
        print("Files created:")
        for file_path in summary["files_created"]:
            print(f"  - {file_path.relative_to(PROJECT_ROOT).as_posix()}")
        print(f"Number of teams fetched: {summary['teams_count']}")
        print(f"Number of schedule stages: {summary['stages_count']}")
        print(f"Total fixtures found: {summary['total_fixtures']}")
    except SportmonksError as err:
        print(f"Sportmonks API error: {err}")
        sys.exit(1)
    except Exception as err:
        print(f"Error during ingestion: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
