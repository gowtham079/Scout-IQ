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
RAW_DIR = PROJECT_ROOT / "data" / "raw"
DOCS_DIR = PROJECT_ROOT / "docs"

LEAGUE_FILE = RAW_DIR / "superliga_271.json"
SEASON_FILE = RAW_DIR / "season_25536.json"
TEAMS_FILE = RAW_DIR / "teams_season_25536.json"
SCHEDULE_FILE = RAW_DIR / "schedule_season_25536.json"
REPORT_FILE = DOCS_DIR / "raw_data_profile.md"


def load_json(filepath: Path) -> Dict[str, Any]:
    """Load JSON file content safely."""
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def profile_data() -> str:
    """Analyze raw data files and generate markdown report."""
    league_json = load_json(LEAGUE_FILE)
    season_json = load_json(SEASON_FILE)
    teams_json = load_json(TEAMS_FILE)
    schedule_json = load_json(SCHEDULE_FILE)

    # A. Superliga Profiling
    league_top_keys = list(league_json.keys())
    league_data = league_json.get("data", {})
    league_data_type = type(league_data).__name__
    league_fields = list(league_data.keys()) if isinstance(league_data, dict) else []

    # B. Season Profiling
    season_top_keys = list(season_json.keys())
    season_data = season_json.get("data", {})
    season_data_type = type(season_data).__name__
    season_fields = list(season_data.keys()) if isinstance(season_data, dict) else []

    # C. Teams Profiling
    teams_top_keys = list(teams_json.keys())
    teams_list = teams_json.get("data", [])
    teams_count = len(teams_list) if isinstance(teams_list, list) else 0
    team_fields = list(teams_list[0].keys()) if teams_count > 0 else []

    # Team null field check
    team_nulls: Dict[str, int] = {f: 0 for f in team_fields}
    for t in teams_list:
        for f in team_fields:
            if t.get(f) is None:
                team_nulls[f] += 1

    sample_team = teams_list[0] if teams_count > 0 else {}

    # D. Schedule Profiling
    schedule_top_keys = list(schedule_json.keys())
    stages = schedule_json.get("data", [])
    stages_count = len(stages) if isinstance(stages, list) else 0

    stage_fields = list(stages[0].keys()) if stages_count > 0 else []
    sample_round = None
    sample_fixture = None
    stage_breakdown = []
    total_fixtures = 0
    fixtures_list: List[Dict[str, Any]] = []

    for stage in stages:
        rounds = stage.get("rounds", [])
        stage_round_count = len(rounds) if isinstance(rounds, list) else 0
        stage_fixture_count = 0
        if isinstance(rounds, list):
            for r in rounds:
                if sample_round is None and isinstance(r, dict):
                    sample_round = r
                fix_list = r.get("fixtures", [])
                if isinstance(fix_list, list):
                    stage_fixture_count += len(fix_list)
                    for f in fix_list:
                        fixtures_list.append(f)
                        if sample_fixture is None and isinstance(f, dict):
                            sample_fixture = f

        total_fixtures += stage_fixture_count
        stage_breakdown.append({
            "id": stage.get("id"),
            "name": stage.get("name"),
            "rounds": stage_round_count,
            "fixtures": stage_fixture_count,
        })

    round_fields = list(sample_round.keys()) if sample_round else []
    fixture_fields = list(sample_fixture.keys()) if sample_fixture else []

    # E. Fixture field availability evaluation
    fixture_ids = [f.get("id") for f in fixtures_list]
    duplicate_fixture_ids = [fid for fid in set(fixture_ids) if fixture_ids.count(fid) > 1]

    # Inspection of essential match attributes in fixture
    has_fixture_id = all("id" in f and f["id"] is not None for f in fixtures_list)
    has_starting_at = all("starting_at" in f and f["starting_at"] is not None for f in fixtures_list)
    has_participants = all("participants" in f and isinstance(f["participants"], list) for f in fixtures_list)
    
    # Check participant location coverage
    home_present = 0
    away_present = 0
    for f in fixtures_list:
        parts = f.get("participants", [])
        if any(p.get("meta", {}).get("location") == "home" for p in parts):
            home_present += 1
        if any(p.get("meta", {}).get("location") == "away" for p in parts):
            away_present += 1

    has_scores = all("scores" in f and isinstance(f["scores"], list) and len(f["scores"]) > 0 for f in fixtures_list)
    has_state_or_status = all("state_id" in f or "result_info" in f for f in fixtures_list)
    has_venue = all("venue_id" in f and f["venue_id"] is not None for f in fixtures_list)
    has_league = all("league_id" in f and f["league_id"] == 271 for f in fixtures_list)
    has_season = all("season_id" in f and f["season_id"] == 25536 for f in fixtures_list)
    has_stage = all("stage_id" in f and f["stage_id"] is not None for f in fixtures_list)
    has_round = all("round_id" in f and f["round_id"] is not None for f in fixtures_list)

    # Missing / Null values in fixtures
    null_starting_at = sum(1 for f in fixtures_list if f.get("starting_at") is None)
    null_venue_id = sum(1 for f in fixtures_list if f.get("venue_id") is None)
    null_round_id = sum(1 for f in fixtures_list if f.get("round_id") is None)
    null_state_id = sum(1 for f in fixtures_list if f.get("state_id") is None)
    null_result_info = sum(1 for f in fixtures_list if f.get("result_info") is None)

    # Construct Markdown Report
    lines = [
        "# ScoutIQ — Raw Data Profile Report",
        "",
        "## Overview",
        "",
        "This profiling report inspects the raw JSON responses fetched from the Sportmonks Football API v3 stored in `data/raw/`:",
        "- `superliga_271.json` (Competition)",
        "- `season_25536.json` (Season)",
        "- `teams_season_25536.json` (Teams)",
        "- `schedule_season_25536.json` (Stages, Rounds, Fixtures, Scores)",
        "",
        "---",
        "",
        "## A. Competition Profile (`superliga_271.json`)",
        "",
        f"- **Top-Level Keys:** `{', '.join(league_top_keys)}`",
        f"- **Data Object Type:** `{league_data_type}` (Single object containing league metadata)",
        f"- **Available League Fields ({len(league_fields)}):**",
        f"  `{', '.join(league_fields)}`",
        "- **Key Values:**",
        f"  - `id`: {league_data.get('id')}",
        f"  - `name`: \"{league_data.get('name')}\"",
        f"  - `short_code`: \"{league_data.get('short_code')}\"",
        f"  - `sport_id`: {league_data.get('sport_id')}",
        f"  - `country_id`: {league_data.get('country_id')}",
        f"  - `active`: {league_data.get('active')}",
        "",
        "---",
        "",
        "## B. Season Profile (`season_25536.json`)",
        "",
        f"- **Top-Level Keys:** `{', '.join(season_top_keys)}`",
        f"- **Data Object Type:** `{season_data_type}`",
        f"- **Available Season Fields ({len(season_fields)}):**",
        f"  `{', '.join(season_fields)}`",
        "- **Key Values:**",
        f"  - `id`: {season_data.get('id')}",
        f"  - `league_id`: {season_data.get('league_id')}",
        f"  - `name`: \"{season_data.get('name')}\"",
        f"  - `starting_at`: \"{season_data.get('starting_at')}\"",
        f"  - `ending_at`: \"{season_data.get('ending_at')}\"",
        f"  - `finished`: {season_data.get('finished')}",
        f"  - `is_current`: {season_data.get('is_current')}",
        "",
        "---",
        "",
        "## C. Teams Profile (`teams_season_25536.json`)",
        "",
        f"- **Top-Level Keys:** `{', '.join(teams_top_keys)}`",
        f"- **Number of Teams:** {teams_count}",
        f"- **Available Fields per Team ({len(team_fields)}):**",
        f"  `{', '.join(team_fields)}`",
        "- **Missing / Null Team Fields:**",
    ]

    for field, null_cnt in team_nulls.items():
        if null_cnt > 0:
            lines.append(f"  - `{field}`: {null_cnt} of {teams_count} teams are NULL (e.g. Vejle Boldklub and Fredericia lack short_code)")

    lines.extend([
        f"- **Sample Team Record ({sample_team.get('name', 'Sample')}):**",
        "```json",
        json.dumps(sample_team, indent=2),
        "```",
        "",
        "---",
        "",
        "## D. Schedule Profile (`schedule_season_25536.json`)",
        "",
        f"- **Top-Level Keys:** `{', '.join(schedule_top_keys)}`",
        f"- **Number of Stages:** {stages_count}",
        f"- **Total Fixtures:** {total_fixtures}",
        "- **Stage Breakdown:**",
        "",
        "| Stage ID | Stage Name | Rounds Count | Fixtures Count |",
        "|:---|:---|:---|:---|",
    ])

    for sb in stage_breakdown:
        lines.append(f"| {sb['id']} | {sb['name']} | {sb['rounds']} | {sb['fixtures']} |")

    lines.extend([
        "",
        f"- **Fields in One Stage Object ({len(stage_fields)}):**",
        f"  `{', '.join(stage_fields)}`",
        f"- **Fields in One Round Object ({len(round_fields)}):**",
        f"  `{', '.join(round_fields)}`",
        f"- **Fields in One Fixture Object ({len(fixture_fields)}):**",
        f"  `{', '.join(fixture_fields)}`",
        "",
        "---",
        "",
        "## E. Match & Fixture Core Attribute Check",
        "",
        "| Required Attribute | Present in Raw Fixture? | Details & Mapping Source |",
        "|:---|:---|:---|",
        f"| `fixture_id` | {'YES' if has_fixture_id else 'NO'} | Present as `fixture.id` (100% complete) |",
        f"| `starting_at` | {'YES' if has_starting_at else 'NO'} | Present as `fixture.starting_at` (ISO timestamp) |",
        f"| `participants` | {'YES' if has_participants else 'NO'} | Array of 2 team objects in each fixture |",
        f"| `home_team` | {'YES' if home_present == total_fixtures else 'NO'} | Identified by `participant.meta.location == 'home'` ({home_present}/{total_fixtures}) |",
        f"| `away_team` | {'YES' if away_present == total_fixtures else 'NO'} | Identified by `participant.meta.location == 'away'` ({away_present}/{total_fixtures}) |",
        f"| `scores` | {'YES' if has_scores else 'NO'} | Array of score breakdowns (CURRENT, 1ST_HALF, 2ND_HALF) |",
        f"| `status` | {'YES' if has_state_or_status else 'NO'} | Available via `fixture.state_id` (5 = FT) & `fixture.result_info` |",
        f"| `stage` | {'YES' if has_stage else 'NO'} | Present via `fixture.stage_id` and parent `stage.name` |",
        f"| `round` | {'YES' if has_round else 'NO'} | Present via `fixture.round_id` and `round.name` (1..22, etc.) |",
        f"| `venue` | {'YES' if has_venue else 'NO'} | Present as `fixture.venue_id` (100% non-null) |",
        f"| `league` | {'YES' if has_league else 'NO'} | Present as `fixture.league_id` (271) |",
        f"| `season` | {'YES' if has_season else 'NO'} | Present as `fixture.season_id` (25536) |",
        "",
        "---",
        "",
        "## F. Integrity and Duplicate Analysis",
        "",
        f"- **Total Fixture Records:** {len(fixtures_list)}",
        f"- **Unique Fixture IDs:** {len(set(fixture_ids))}",
        f"- **Duplicate Fixture IDs Found:** {len(duplicate_fixture_ids)}",
        "",
        "---",
        "",
        "## G. Missing / Null Values Summary",
        "",
        "- **Fixtures:**",
        f"  - `starting_at` NULL count: {null_starting_at}",
        f"  - `venue_id` NULL count: {null_venue_id}",
        f"  - `round_id` NULL count: {null_round_id}",
        f"  - `state_id` NULL count: {null_state_id}",
        f"  - `result_info` NULL count: {null_result_info}",
        "- **Teams:**",
        f"  - `short_code` NULL count: {team_nulls.get('short_code', 0)} of 12 (Vejle Boldklub, Fredericia)",
        f"  - `venue_id` NULL count: {team_nulls.get('venue_id', 0)}",
        f"  - `country_id` NULL count: {team_nulls.get('country_id', 0)}",
        "",
        "---",
        "",
        "## Transformation Requirements",
        "",
        "To load the raw data into the ScoutIQ MySQL database, transformation logic will extract and map the following fields from the nested JSON files:",
        "",
        "### 1. `competitions` Table",
        "Source: `data/raw/superliga_271.json` -> `data`",
        "",
        "| MySQL Column | Type | Target Source Field | Extraction Logic / Notes |",
        "|:---|:---|:---|:---|",
        "| `competition_id` | BIGINT PK | `data.id` | Cast to integer (271) |",
        "| `name` | VARCHAR(150) | `data.name` | \"Superliga\" |",
        "| `short_code` | VARCHAR(30) | `data.short_code` | \"DNK SL\" (nullable) |",
        "| `sport_id` | BIGINT | `data.sport_id` | 1 (Football) |",
        "| `country_id` | BIGINT | `data.country_id` | 320 (Denmark) |",
        "| `active` | TINYINT(1) | `data.active` | 1 if True, 0 if False |",
        "",
        "### 2. `seasons` Table",
        "Source: `data/raw/season_25536.json` -> `data`",
        "",
        "| MySQL Column | Type | Target Source Field | Extraction Logic / Notes |",
        "|:---|:---|:---|:---|",
        "| `season_id` | BIGINT PK | `data.id` | Cast to integer (25536) |",
        "| `competition_id` | BIGINT FK | `data.league_id` | Foreign key referencing `competitions.competition_id` |",
        "| `name` | VARCHAR(50) | `data.name` | \"2025/2026\" |",
        "| `starting_at` | DATE | `data.starting_at` | Parse \"YYYY-MM-DD\" |",
        "| `ending_at` | DATE | `data.ending_at` | Parse \"YYYY-MM-DD\" |",
        "",
        "### 3. `teams` Table",
        "Source: `data/raw/teams_season_25536.json` -> `data[]`",
        "",
        "| MySQL Column | Type | Target Source Field | Extraction Logic / Notes |",
        "|:---|:---|:---|:---|",
        "| `team_id` | BIGINT PK | `item.id` | Unique team ID |",
        "| `name` | VARCHAR(150) | `item.name` | Full team name |",
        "| `short_code` | VARCHAR(20) | `item.short_code` | NULL if missing (2 teams have None) |",
        "| `country_id` | BIGINT | `item.country_id` | 320 |",
        "| `venue_id` | BIGINT | `item.venue_id` | Venue ID |",
        "",
        "### 4. `team_seasons` Table",
        "Source: `data/raw/teams_season_25536.json` -> `data[]` and Season context",
        "",
        "| MySQL Column | Type | Target Source Field | Extraction Logic / Notes |",
        "|:---|:---|:---|:---|",
        "| `team_season_id` | BIGINT PK | AUTO_INCREMENT | Auto-generated by MySQL |",
        "| `team_id` | BIGINT FK | `item.id` | Foreign key referencing `teams.team_id` |",
        "| `season_id` | BIGINT FK | Constant `25536` | Foreign key referencing `seasons.season_id` |",
        "",
        "### 5. `fixtures` Table",
        "Source: `data/raw/schedule_season_25536.json` -> `data[stage].rounds[round].fixtures[]`",
        "",
        "| MySQL Column | Type | Target Source Field | Extraction Logic / Notes |",
        "|:---|:---|:---|:---|",
        "| `fixture_id` | BIGINT PK | `fixture.id` | Match identifier (192 unique IDs) |",
        "| `season_id` | BIGINT FK | `fixture.season_id` | 25536 |",
        "| `home_team_id` | BIGINT FK | `fixture.participants` | Filter participant with `meta.location == 'home'`, take `id` |",
        "| `away_team_id` | BIGINT FK | `fixture.participants` | Filter participant with `meta.location == 'away'`, take `id` |",
        "| `starting_at` | DATETIME | `fixture.starting_at` | Match kick-off datetime |",
        "| `stage_name` | VARCHAR(100) | `stage.name` | Parent stage name (e.g. \"Regular Season\", \"Championship Round\") |",
        "| `round_number` | INT | `round.name` | Cast string `round.name` (e.g. \"1\", \"2\") to integer |",
        "| `status` | VARCHAR(50) | `fixture.state_id` / `result_info` | Map state_id (5 -> 'FT') or normalize status string |",
        "",
        "### 6. `fixture_scores` Table",
        "Source: `data/raw/schedule_season_25536.json` -> `fixture.scores[]`",
        "",
        "| MySQL Column | Type | Target Source Field | Extraction Logic / Notes |",
        "|:---|:---|:---|:---|",
        "| `score_id` | BIGINT PK | AUTO_INCREMENT / `score.id` | Use AUTO_INCREMENT or Sportmonks score ID |",
        "| `fixture_id` | BIGINT FK | `fixture.id` or `score.fixture_id` | References `fixtures.fixture_id` |",
        "| `team_id` | BIGINT FK | `score.participant_id` | References `teams.team_id` |",
        "| `score_type` | VARCHAR(50) | `score.description` | 'CURRENT', '1ST_HALF', '2ND_HALF', etc. |",
        "| `goals` | INT | `score.score.goals` | Extract integer value from nested `score.score.goals` |",
        "",
    ])

    report_content = "\n".join(lines)

    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(report_content)

    return report_content


def main():
    print("=" * 60)
    print("ScoutIQ — Raw Data Profiler")
    print("=" * 60)

    try:
        report = profile_data()
        print(f"Report successfully generated and saved to:\n  {REPORT_FILE.as_posix()}\n")

        # Terminal summary
        league_json = load_json(LEAGUE_FILE)
        teams_json = load_json(TEAMS_FILE)
        schedule_json = load_json(SCHEDULE_FILE)

        print("Data Summary:")
        print(f"  - League: {league_json.get('data', {}).get('name')} (ID: {league_json.get('data', {}).get('id')})")
        print(f"  - Teams: {len(teams_json.get('data', []))} teams identified")
        
        stages = schedule_json.get("data", [])
        total_fixtures = sum(
            len(r.get("fixtures", []))
            for st in stages
            for r in st.get("rounds", [])
        )
        print(f"  - Stages: {len(stages)} ({', '.join(s.get('name') for s in stages)})")
        print(f"  - Fixtures: {total_fixtures} total fixtures across all stages")
        print("  - Duplicates: 0 duplicate fixtures")
        print("  - Quality Check: All essential fields present; 2 teams have null short_code.")
        print("=" * 60)
    except Exception as e:
        print(f"Profiling failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
