import sys
from pathlib import Path
import requests

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000"


def test_suite():
    print("=" * 80)
    print("RUNNING SCOUTIQ BACKEND INTEGRATION TEST SUITE")
    print("=" * 80)

    # 1. GET /api/health
    print("\n[TEST 1] GET /api/health")
    r = requests.get(f"{BASE_URL}/api/health", timeout=10)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    health_data = r.json()
    assert health_data["status"] == "healthy", f"Health status error: {health_data}"
    assert health_data["database"]["status"] == "connected", f"DB disconnected: {health_data}"
    print(f"  -> PASSED: {health_data}")

    # 2. GET /api/overview
    print("\n[TEST 2] GET /api/overview")
    r = requests.get(f"{BASE_URL}/api/overview", timeout=10)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    overview = r.json()
    assert overview["total_unique_players"] > 0, "No unique players found"
    assert overview["total_teams"] == 12, f"Expected 12 teams, got {overview['total_teams']}"
    assert overview["total_goals"] > 0, "Expected positive total goals"
    assert len(overview["top_scorers"]) > 0, "Expected top scorers"
    assert len(overview["top_assisters"]) > 0, "Expected top assisters"
    assert len(overview["team_goal_distribution"]) == 12, "Expected 12 team goal summaries"
    print(f"  -> PASSED: Unique Players={overview['total_unique_players']}, Teams={overview['total_teams']}, Total Goals={overview['total_goals']}, Avg Rating={overview['average_player_rating']}")
    print(f"     Top Scorer: {overview['top_scorers'][0]['player_name']} ({overview['top_scorers'][0]['goals']} goals)")

    # 3. GET /api/players (Pagination & Default)
    print("\n[TEST 3] GET /api/players (default pagination)")
    r = requests.get(f"{BASE_URL}/api/players", timeout=10)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    players_data = r.json()
    assert players_data["total"] > 0, "No players found"
    assert len(players_data["items"]) == 20, f"Expected 20 items per page, got {len(players_data['items'])}"
    assert players_data["page"] == 1
    sample_player = players_data["items"][0]
    sample_player_id = sample_player["player_id"]
    sample_team_id = sample_player["team_id"]
    print(f"  -> PASSED: Total={players_data['total']}, Total Pages={players_data['total_pages']}, Sample Player={sample_player['player_name']} (Rating: {sample_player['rating']})")

    # 4. GET /api/players (Search & Filtering)
    print("\n[TEST 4] GET /api/players (search & filters)")
    r = requests.get(
        f"{BASE_URL}/api/players",
        params={
            "search": "Tonni",
            "min_minutes": 500,
            "sort_by": "goals_per90",
            "sort_order": "desc",
            "page": 1,
            "page_size": 10,
        },
        timeout=10,
    )
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    search_data = r.json()
    assert search_data["total"] >= 1, "Expected search result for Tonni"
    assert "Tonni" in search_data["items"][0]["player_name"]
    print(f"  -> PASSED: Found {search_data['total']} player(s) matching 'Tonni'. Top match: {search_data['items'][0]['player_name']}")

    # 5. GET /api/players/{player_id} (Valid Player)
    print(f"\n[TEST 5] GET /api/players/{sample_player_id} (valid player)")
    r = requests.get(f"{BASE_URL}/api/players/{sample_player_id}", timeout=10)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    p_detail = r.json()
    assert p_detail["player_id"] == sample_player_id
    assert p_detail["scouting_features"] is not None
    assert p_detail["season_totals"] is not None
    assert p_detail["per90_metrics"] is not None
    print(f"  -> PASSED: Loaded full profile for {p_detail['player_name']} ({p_detail['team_name']})")

    # 6. GET /api/players/999999999 (Missing Player -> 404)
    print("\n[TEST 6] GET /api/players/999999999 (missing player -> 404)")
    r = requests.get(f"{BASE_URL}/api/players/999999999", timeout=10)
    assert r.status_code == 404, f"Expected 404, got {r.status_code}"
    print("  -> PASSED: Returned HTTP 404 as expected.")

    # 7. GET /api/teams (Standings, Points, Tie-breakers)
    print("\n[TEST 7] GET /api/teams (standings & calculations)")
    r = requests.get(f"{BASE_URL}/api/teams", timeout=10)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    teams = r.json()
    assert len(teams) == 12, f"Expected 12 teams, got {len(teams)}"
    for idx, t in enumerate(teams, start=1):
        assert t["rank"] == idx, f"Rank mismatch: expected {idx}, got {t['rank']}"
        expected_points = (t["wins"] * 3) + t["draws"]
        assert t["points"] == expected_points, f"Points calculation error for {t['team_name']}"
    print(f"  -> PASSED: 12 teams correctly ranked. Champion/Leader: {teams[0]['team_name']} with {teams[0]['points']} pts")

    # 8. GET /api/teams/{team_id} (Valid Team)
    print(f"\n[TEST 8] GET /api/teams/{sample_team_id} (valid team)")
    r = requests.get(f"{BASE_URL}/api/teams/{sample_team_id}", timeout=10)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    team_detail = r.json()
    assert team_detail["team"]["team_id"] == sample_team_id
    assert team_detail["squad_size"] > 0
    print(f"  -> PASSED: Loaded {team_detail['team']['team_name']} (Squad Size: {team_detail['squad_size']}, Rank: #{team_detail['team']['rank']})")

    # 9. GET /api/teams/999999999 (Missing Team -> 404)
    print("\n[TEST 9] GET /api/teams/999999999 (missing team -> 404)")
    r = requests.get(f"{BASE_URL}/api/teams/999999999", timeout=10)
    assert r.status_code == 404, f"Expected 404, got {r.status_code}"
    print("  -> PASSED: Returned HTTP 404 as expected.")

    # 10. GET /api/scouting/compare?player_ids=ID1,ID2 (Valid Comparison)
    print("\n[TEST 10] GET /api/scouting/compare (valid comparison)")
    # Pick first 2 players from players_data
    p1_id = players_data["items"][0]["player_id"]
    p2_id = players_data["items"][1]["player_id"]
    r = requests.get(f"{BASE_URL}/api/scouting/compare", params={"player_ids": f"{p1_id},{p2_id}"}, timeout=10)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    comp_data = r.json()
    assert comp_data["player1"]["player_id"] == p1_id
    assert comp_data["player2"]["player_id"] == p2_id
    assert len(comp_data["comparison_metrics"]) >= 15, "Expected comprehensive metric comparison list"
    print(f"  -> PASSED: Compared {comp_data['player1']['player_name']} vs {comp_data['player2']['player_name']} across {len(comp_data['comparison_metrics'])} metrics")

    # 11. GET /api/scouting/compare (Error cases: identical IDs, malformed, missing player)
    print("\n[TEST 11] GET /api/scouting/compare (validation & error handling)")
    # Identical IDs
    r = requests.get(f"{BASE_URL}/api/scouting/compare", params={"player_ids": f"{p1_id},{p1_id}"}, timeout=10)
    assert r.status_code == 400, f"Expected 400 for identical IDs, got {r.status_code}"
    # Malformed single ID
    r = requests.get(f"{BASE_URL}/api/scouting/compare", params={"player_ids": f"{p1_id}"}, timeout=10)
    assert r.status_code == 400, f"Expected 400 for single ID, got {r.status_code}"
    # Non-existent player ID
    r = requests.get(f"{BASE_URL}/api/scouting/compare", params={"player_ids": f"{p1_id},999999999"}, timeout=10)
    assert r.status_code == 404, f"Expected 404 for missing player, got {r.status_code}"
    print("  -> PASSED: Correctly handled identical IDs (400), malformed parameter (400), and non-existent player (404).")

    # 12. GET /api/scouting/top-performers (Documented Categories)
    print("\n[TEST 12] GET /api/scouting/top-performers (transparent rankings)")
    r = requests.get(f"{BASE_URL}/api/scouting/top-performers", timeout=10)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    top_performers = r.json()
    assert len(top_performers) == 4, f"Expected 4 distinct ranking categories, got {len(top_performers)}"
    for cat in top_performers:
        assert cat["category"], "Missing category name"
        assert cat["formula"], "Missing ranking formula"
        assert len(cat["players"]) > 0, f"Empty player list for {cat['category']}"
        print(f"     - [{cat['category']}]: Leader = {cat['players'][0]['player_name']} (Formula: {cat['formula']})")
    print("  -> PASSED: All 4 top performer leaderboards populated with transparent formulas.")

    print("\n" + "=" * 80)
    print("ALL 12 INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 80)


if __name__ == "__main__":
    test_suite()
