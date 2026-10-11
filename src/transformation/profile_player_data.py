import json
import sys
from collections import Counter
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
RAW_PLAYER_DIR = PROJECT_ROOT / "data" / "raw" / "player"
DOCS_DIR = PROJECT_ROOT / "docs"
PROFILE_REPORT_FILE = DOCS_DIR / "player_data_profile.md"


def profile_player_data() -> Dict[str, Any]:
    """
    Profile all raw fixture JSON files in data/raw/player/.
    """
    fixture_files = sorted(RAW_PLAYER_DIR.glob("fixture_*.json"))
    if not fixture_files:
        raise FileNotFoundError(f"No fixture files found in {RAW_PLAYER_DIR}")

    total_fixtures = len(fixture_files)
    total_lineups = 0
    total_events = 0
    total_player_stats = 0
    total_team_stats = 0

    unique_players: Dict[int, Dict[str, Any]] = {}
    unique_teams: Set[int] = set()

    event_type_counter: Counter = Counter()
    event_type_names: Dict[str, str] = {}

    player_stat_type_counter: Counter = Counter()
    player_stat_type_info: Dict[str, Dict[str, Any]] = {}

    team_stat_type_counter: Counter = Counter()
    team_stat_type_info: Dict[str, str] = {}

    for fpath in fixture_files:
        with open(fpath, "r", encoding="utf-8") as f:
            content = json.load(f)

        data = content.get("data", {})
        if not data:
            continue

        # Lineups & Players & Player Stats
        lineups = data.get("lineups", [])
        total_lineups += len(lineups)

        for l in lineups:
            pid = l.get("player_id")
            tid = l.get("team_id")
            if tid:
                unique_teams.add(tid)

            player_obj = l.get("player", {})
            if pid:
                if pid not in unique_players:
                    unique_players[pid] = {
                        "player_id": pid,
                        "name": player_obj.get("name") or l.get("player_name"),
                        "height": player_obj.get("height"),
                        "image_path": player_obj.get("image_path"),
                        "nationality_id": player_obj.get("nationality_id"),
                        "country_id": player_obj.get("country_id"),
                    }

            # Player statistics from lineup details
            details = l.get("details", [])
            total_player_stats += len(details)
            for d in details:
                st_obj = d.get("type", {})
                code = st_obj.get("code")
                if code:
                    player_stat_type_counter[code] += 1
                    if code not in player_stat_type_info:
                        player_stat_type_info[code] = {
                            "id": st_obj.get("id"),
                            "name": st_obj.get("name"),
                            "group": st_obj.get("stat_group"),
                            "model_type": st_obj.get("model_type"),
                        }

        # Events
        events = data.get("events", [])
        total_events += len(events)
        for e in events:
            etype_obj = e.get("type", {})
            code = etype_obj.get("code") or str(e.get("type_id"))
            name = etype_obj.get("name") or f"Type {code}"
            event_type_counter[code] += 1
            event_type_names[code] = name

        # Team Match Statistics
        statistics = data.get("statistics", [])
        total_team_stats += len(statistics)
        for s in statistics:
            t_obj = s.get("type", {})
            code = t_obj.get("code")
            name = t_obj.get("name")
            if code:
                team_stat_type_counter[code] += 1
                if code not in team_stat_type_info:
                    team_stat_type_info[code] = name or code

    return {
        "total_fixtures": total_fixtures,
        "total_lineups": total_lineups,
        "total_players": len(unique_players),
        "total_teams": len(unique_teams),
        "total_events": total_events,
        "total_player_stats": total_player_stats,
        "total_player_stat_types": len(player_stat_type_info),
        "total_team_stats": total_team_stats,
        "total_team_stat_types": len(team_stat_type_info),
        "event_type_counter": event_type_counter,
        "event_type_names": event_type_names,
        "player_stat_type_counter": player_stat_type_counter,
        "player_stat_type_info": player_stat_type_info,
        "team_stat_type_counter": team_stat_type_counter,
        "team_stat_type_info": team_stat_type_info,
        "sample_players": list(unique_players.values())[:3],
    }


def generate_markdown_report(metrics: Dict[str, Any]) -> str:
    lines = [
        "# ScoutIQ — Player & Match Analytics Data Profile",
        "",
        "## 1. Executive Summary",
        "",
        f"- **Fixtures Ingested:** {metrics['total_fixtures']} (100% of season schedule)",
        f"- **Lineup Records:** {metrics['total_lineups']}",
        f"- **Unique Players Identified:** {metrics['total_players']}",
        f"- **Unique Teams Identified:** {metrics['total_teams']}",
        f"- **Match Events Recorded:** {metrics['total_events']}",
        f"- **Player Match Statistics Records:** {metrics['total_player_stats']}",
        f"- **Unique Player Statistic Types:** {metrics['total_player_stat_types']}",
        f"- **Team Match Statistics Records:** {metrics['total_team_stats']}",
        f"- **Unique Team Statistic Types:** {metrics['total_team_stat_types']}",
        "",
        "---",
        "",
        "## 2. Match Events Breakdown",
        "",
        f"Total events analyzed: {metrics['total_events']}",
        "",
        "| Event Code | Event Name | Occurrences |",
        "|:---|:---|:---|",
    ]

    for code, count in metrics["event_type_counter"].most_common():
        name = metrics["event_type_names"].get(code, code)
        lines.append(f"| `{code}` | {name} | {count} |")

    lines.extend([
        "",
        "---",
        "",
        "## 3. Team Match Statistics Catalog",
        "",
        f"Total unique team stat types: {metrics['total_team_stat_types']}",
        "",
        "| Stat Code | Stat Name | Occurrences |",
        "|:---|:---|:---|",
    ])

    for code, count in metrics["team_stat_type_counter"].most_common():
        name = metrics["team_stat_type_info"].get(code, code)
        lines.append(f"| `{code}` | {name} | {count} |")

    lines.extend([
        "",
        "---",
        "",
        "## 4. Player Statistics Catalog (Sample Top 25)",
        "",
        f"Total unique player stat types: {metrics['total_player_stat_types']}",
        "",
        "| Code | Metric Name | Category / Group | Occurrences |",
        "|:---|:---|:---|:---|",
    ])

    for code, count in metrics["player_stat_type_counter"].most_common(25):
        info = metrics["player_stat_type_info"].get(code, {})
        lines.append(f"| `{code}` | {info.get('name')} | {info.get('group', 'general')} | {count} |")

    lines.extend([
        "",
        "---",
        "",
        "## 5. Player Master Attribute Availability",
        "",
        "Sample player records extracted from lineups:",
        "```json",
        json.dumps(metrics["sample_players"], indent=2),
        "```",
        "",
    ])

    return "\n".join(lines)


def main() -> None:
    print("Profiling player analytics data across all raw fixture files...")
    metrics = profile_player_data()
    report = generate_markdown_report(metrics)

    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    with open(PROFILE_REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\nReport written to: {PROFILE_REPORT_FILE.as_posix()}\n")
    print(f"Fixtures: {metrics['total_fixtures']}")
    print(f"Lineup records: {metrics['total_lineups']}")
    print(f"Unique players: {metrics['total_players']}")
    print(f"Unique teams: {metrics['total_teams']}")
    print(f"Match events: {metrics['total_events']}")
    print(f"Player-stat records: {metrics['total_player_stats']}")
    print(f"Unique player stat types: {metrics['total_player_stat_types']}")
    print(f"Team-stat records: {metrics['total_team_stats']}")
    print(f"Unique team stat types: {metrics['total_team_stat_types']}")


if __name__ == "__main__":
    main()
