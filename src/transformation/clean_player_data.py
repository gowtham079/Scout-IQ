import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

# Ensure UTF-8 output encoding for consoles that default to cp1252 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
RAW_PLAYER_DIR = PROJECT_ROOT / "data" / "raw" / "player"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

FIXTURES_FILE = PROCESSED_DIR / "fixtures.json"
TEAMS_FILE = PROCESSED_DIR / "teams.json"


def load_json(filepath: Path) -> Any:
    """Load JSON file content using UTF-8."""
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(data: Any, filepath: Path) -> None:
    """Save formatted JSON file using UTF-8."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def extract_and_clean_player_data() -> Dict[str, Any]:
    """
    Extract, normalize, and validate all player, lineup, event, and statistic datasets.
    """
    valid_fixtures = {f["fixture_id"] for f in load_json(FIXTURES_FILE)}
    valid_teams = {t["team_id"] for t in load_json(TEAMS_FILE)}

    fixture_files = sorted(RAW_PLAYER_DIR.glob("fixture_*.json"))
    if not fixture_files:
        raise FileNotFoundError(f"No raw fixture files found in {RAW_PLAYER_DIR}")

    players_dict: Dict[int, Dict[str, Any]] = {}
    lineups_list: List[Dict[str, Any]] = []
    seen_lineups: Set[tuple] = set()

    stat_types_dict: Dict[str, Dict[str, Any]] = {}
    player_match_stats_list: List[Dict[str, Any]] = []
    seen_player_stats: Set[tuple] = set()

    match_events_list: List[Dict[str, Any]] = []
    seen_events: Set[int] = set()

    team_stat_types_dict: Dict[str, Dict[str, Any]] = {}
    team_match_stats_list: List[Dict[str, Any]] = []
    seen_team_stats: Set[tuple] = set()

    for fpath in fixture_files:
        with open(fpath, "r", encoding="utf-8") as f:
            content = json.load(f)

        data = content.get("data", {})
        if not data:
            continue

        fid = data.get("id")

        # 1. Lineups and Players
        for l in data.get("lineups", []):
            pid = l.get("player_id")
            if not pid:
                # Skip youth/bench placeholders without valid Sportmonks player ID
                continue

            tid = l.get("team_id")
            player_obj = l.get("player", {}) or {}

            # Add to players master
            if pid not in players_dict:
                name = player_obj.get("name") or player_obj.get("display_name") or l.get("player_name") or f"Player {pid}"
                height = player_obj.get("height")
                image = player_obj.get("image_path")
                players_dict[pid] = {
                    "player_id": pid,
                    "name": name,
                    "nationality": None,
                    "height_cm": float(height) if height is not None else None,
                    "image_url": image,
                }

            # Add to lineups
            lineup_key = (fid, pid)
            if lineup_key not in seen_lineups:
                seen_lineups.add(lineup_key)
                is_cap = 1 if (l.get("is_captain") or l.get("captain")) else 0
                lineups_list.append({
                    "lineup_id": l["id"],
                    "fixture_id": fid,
                    "player_id": pid,
                    "team_id": tid,
                    "position_id": l.get("position_id"),
                    "formation_position": l.get("formation_position"),
                    "formation_field": l.get("formation_field"),
                    "jersey_number": l.get("jersey_number"),
                    "lineup_type_id": l.get("type_id"),
                    "is_captain": is_cap,
                })

            # Player match statistics
            for dt in l.get("details", []):
                t_obj = dt.get("type", {})
                code = t_obj.get("code")
                st_id = t_obj.get("id")
                if not code or not st_id:
                    continue

                if code not in stat_types_dict:
                    stat_types_dict[code] = {
                        "stat_type_id": st_id,
                        "code": code,
                        "name": t_obj.get("name", code),
                        "category": t_obj.get("stat_group"),
                        "data_type": "numeric",
                    }

                pstat_key = (fid, pid, st_id)
                if pstat_key not in seen_player_stats:
                    seen_player_stats.add(pstat_key)
                    val = dt.get("data", {}).get("value")
                    num_val = None
                    if isinstance(val, bool):
                        num_val = 1.0 if val else 0.0
                    elif isinstance(val, (int, float)):
                        num_val = float(val)

                    player_match_stats_list.append({
                        "fixture_id": fid,
                        "player_id": pid,
                        "team_id": tid,
                        "stat_type_id": st_id,
                        "numeric_value": num_val,
                        "text_value": None if num_val is not None else (str(val) if val is not None else None),
                    })

        # 2. Match Events
        for ev in data.get("events", []):
            eid = ev.get("id")
            if eid in seen_events:
                continue
            seen_events.add(eid)

            ev_player_id = ev.get("player_id")
            # Ensure any event player is also recorded in players dictionary
            if ev_player_id and ev_player_id not in players_dict:
                ev_pname = ev.get("player_name") or f"Player {ev_player_id}"
                players_dict[ev_player_id] = {
                    "player_id": ev_player_id,
                    "name": ev_pname,
                    "nationality": None,
                    "height_cm": None,
                    "image_url": None,
                }

            type_obj = ev.get("type", {})
            event_type = type_obj.get("name") or type_obj.get("code") or str(ev.get("type_id"))

            match_events_list.append({
                "event_id": eid,
                "fixture_id": fid,
                "player_id": ev_player_id,
                "team_id": ev.get("participant_id"),
                "event_type": event_type,
                "minute": ev.get("minute"),
                "extra_minute": ev.get("extra_minute"),
                "raw_event_data": ev,
            })

        # 3. Team Match Statistics
        for st in data.get("statistics", []):
            t_obj = st.get("type", {})
            t_code = t_obj.get("code")
            t_id = t_obj.get("id")
            team_id = st.get("participant_id")
            if not t_code or not t_id or not team_id:
                continue

            if t_code not in team_stat_types_dict:
                team_stat_types_dict[t_code] = {
                    "team_stat_type_id": t_id,
                    "code": t_code,
                    "name": t_obj.get("name", t_code),
                    "data_type": "numeric",
                }

            team_stat_key = (fid, team_id, t_id)
            if team_stat_key not in seen_team_stats:
                seen_team_stats.add(team_stat_key)
                v = st.get("data", {}).get("value")
                n_val = float(v) if isinstance(v, (int, float)) else None

                team_match_stats_list.append({
                    "fixture_id": fid,
                    "team_id": team_id,
                    "team_stat_type_id": t_id,
                    "numeric_value": n_val,
                    "text_value": None if n_val is not None else (str(v) if v is not None else None),
                })

    players_list = list(players_dict.values())
    stat_types_list = list(stat_types_dict.values())
    team_stat_types_list = list(team_stat_types_dict.values())

    # ==========================================
    # VALIDATION
    # ==========================================
    player_ids_set = {p["player_id"] for p in players_list}
    stat_type_ids_set = {st["stat_type_id"] for st in stat_types_list}
    team_stat_type_ids_set = {tst["team_stat_type_id"] for tst in team_stat_types_list}

    # 1. Lineup integrity
    for l in lineups_list:
        assert l["fixture_id"] in valid_fixtures, f"Lineup fixture {l['fixture_id']} not in fixtures.json"
        assert l["player_id"] in player_ids_set, f"Lineup player {l['player_id']} not in players.json"
        assert l["team_id"] in valid_teams, f"Lineup team {l['team_id']} not in teams.json"

    # 2. Player match stats integrity
    for ps in player_match_stats_list:
        assert ps["fixture_id"] in valid_fixtures, f"Player stat fixture {ps['fixture_id']} not in fixtures.json"
        assert ps["player_id"] in player_ids_set, f"Player stat player {ps['player_id']} not in players.json"
        assert ps["stat_type_id"] in stat_type_ids_set, f"Player stat type {ps['stat_type_id']} not in stat_types.json"
        assert ps["team_id"] in valid_teams, f"Player stat team {ps['team_id']} not in teams.json"

    # 3. Match events integrity
    for me in match_events_list:
        assert me["fixture_id"] in valid_fixtures, f"Event fixture {me['fixture_id']} not in fixtures.json"
        if me["player_id"] is not None:
            assert me["player_id"] in player_ids_set, f"Event player {me['player_id']} not in players.json"
        if me["team_id"] is not None:
            assert me["team_id"] in valid_teams, f"Event team {me['team_id']} not in teams.json"

    # 4. Team match stats integrity
    for ts in team_match_stats_list:
        assert ts["fixture_id"] in valid_fixtures, f"Team stat fixture {ts['fixture_id']} not in fixtures.json"
        assert ts["team_id"] in valid_teams, f"Team stat team {ts['team_id']} not in teams.json"
        assert ts["team_stat_type_id"] in team_stat_type_ids_set, f"Team stat type {ts['team_stat_type_id']} not in team_stat_types.json"

    # 5. Duplicate checks
    assert len(players_list) == len(player_ids_set), "Duplicate player identities detected"
    assert len(stat_types_list) == len({s["code"] for s in stat_types_list}), "Duplicate player stat types detected"
    assert len(team_stat_types_list) == len({s["code"] for s in team_stat_types_list}), "Duplicate team stat types detected"
    assert len(lineups_list) == len(seen_lineups), "Duplicate lineups detected"

    # Save all datasets to data/processed/
    save_json(players_list, PROCESSED_DIR / "players.json")
    save_json(lineups_list, PROCESSED_DIR / "lineups.json")
    save_json(stat_types_list, PROCESSED_DIR / "stat_types.json")
    save_json(player_match_stats_list, PROCESSED_DIR / "player_match_stats.json")
    save_json(match_events_list, PROCESSED_DIR / "match_events.json")
    save_json(team_stat_types_list, PROCESSED_DIR / "team_stat_types.json")
    save_json(team_match_stats_list, PROCESSED_DIR / "team_match_stats.json")

    return {
        "players": len(players_list),
        "lineups": len(lineups_list),
        "stat_types": len(stat_types_list),
        "player_match_stats": len(player_match_stats_list),
        "match_events": len(match_events_list),
        "team_stat_types": len(team_stat_types_list),
        "team_match_stats": len(team_match_stats_list),
    }


def main() -> None:
    print("ScoutIQ — Cleaning Player & Match Analytics Data\n")
    try:
        counts = extract_and_clean_player_data()
        print("Generated Processed Datasets:")
        print(f"  - players: {counts['players']} records")
        print(f"  - lineups: {counts['lineups']} records")
        print(f"  - stat_types: {counts['stat_types']} records")
        print(f"  - player_match_stats: {counts['player_match_stats']} records")
        print(f"  - match_events: {counts['match_events']} records")
        print(f"  - team_stat_types: {counts['team_stat_types']} records")
        print(f"  - team_match_stats: {counts['team_match_stats']} records")
        print("\nAll relational integrity checks passed successfully.")
    except Exception as err:
        print(f"Transformation failed: {err}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
