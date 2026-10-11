import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

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

SQL_DIR = PROJECT_ROOT / "sql" / "analytics"

VIEW_FILES = [
    ("vw_player_match_summary", SQL_DIR / "01_player_match_summary.sql"),
    ("vw_player_season_performance", SQL_DIR / "02_player_season_performance.sql"),
    ("vw_player_per90_metrics", SQL_DIR / "03_player_per90_metrics.sql"),
    ("vw_team_season_performance", SQL_DIR / "04_team_season_performance.sql"),
    ("vw_player_scouting_features", SQL_DIR / "05_player_scouting_features.sql"),
]

VALIDATION_FILE = SQL_DIR / "06_analytics_validation.sql"


def execute_sql_file(cursor, filepath: Path) -> None:
    """Execute SQL statements from a file."""
    if not filepath.exists():
        raise FileNotFoundError(f"SQL file not found: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        sql = f.read()

    # Split commands by semicolon while respecting comments and whitespace
    statements = [stmt.strip() for stmt in sql.split(";") if stmt.strip()]
    for stmt in statements:
        # Filter out comment-only blocks
        lines = [line for line in stmt.splitlines() if not line.strip().startswith("--")]
        clean_stmt = "\n".join(lines).strip()
        if clean_stmt:
            cursor.execute(clean_stmt)


def build_views() -> Dict[str, int]:
    """Connect to MySQL, execute view creation DDL, and verify counts."""
    connection = None
    cursor = None
    view_counts = {}

    try:
        connection = get_connection()
        cursor = connection.cursor()

        print("Creating ScoutIQ Analytical Views...")
        for view_name, sql_path in VIEW_FILES:
            execute_sql_file(cursor, sql_path)
            print(f"  [CREATED] {view_name} (from {sql_path.name})")

        connection.commit()

        print("\nVerifying View Row Counts:")
        for view_name, _ in VIEW_FILES:
            cursor.execute(f"SELECT COUNT(*) FROM {view_name};")
            count = cursor.fetchone()[0]
            view_counts[view_name] = count
            print(f"  - {view_name:<30}: {count:>6} rows")

        return view_counts

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


def run_validations() -> List[Tuple[str, int]]:
    """Run data quality check queries from 06_analytics_validation.sql."""
    connection = None
    cursor = None
    results = []

    try:
        connection = get_connection()
        cursor = connection.cursor()

        with open(VALIDATION_FILE, "r", encoding="utf-8") as f:
            sql = f.read()

        statements = [stmt.strip() for stmt in sql.split(";") if stmt.strip()]
        for stmt in statements:
            lines = [line for line in stmt.splitlines() if not line.strip().startswith("--")]
            clean_stmt = "\n".join(lines).strip()
            if clean_stmt:
                cursor.execute(clean_stmt)
                rows = cursor.fetchall()
                # Determine check title from comment or first row
                check_title = lines[0] if lines else "Validation Check"
                results.append((clean_stmt[:50] + "...", len(rows)))

        return results

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


def sample_views() -> None:
    """Print 5 representative sample rows from the primary analytical views."""
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        # 1. Sample from vw_player_season_performance
        print("\n" + "=" * 80)
        print("SAMPLE: vw_player_season_performance (Top 5 Goal Scorers)")
        print("=" * 80)
        cursor.execute("""
            SELECT 
                p.name AS player_name,
                t.name AS team_name,
                sp.appearances,
                sp.minutes_played,
                sp.goals,
                sp.assists,
                sp.shots_total,
                sp.average_rating
            FROM vw_player_season_performance sp
            JOIN players p ON p.player_id = sp.player_id
            JOIN teams t ON t.team_id = sp.team_id
            ORDER BY sp.goals DESC, sp.assists DESC
            LIMIT 5;
        """)
        rows = cursor.fetchall()
        print(f"{'Player':<22} {'Team':<18} {'Apps':<6} {'Mins':<6} {'G':<4} {'A':<4} {'Shots':<6} {'Rating':<6}")
        print("-" * 80)
        for r in rows:
            print(f"{r[0]:<22} {r[1]:<18} {r[2]:<6} {r[3]:<6} {r[4]:<4} {r[5]:<4} {r[6]:<6} {str(r[7]):<6}")

        # 2. Sample from vw_player_per90_metrics
        print("\n" + "=" * 80)
        print("SAMPLE: vw_player_per90_metrics (Top 5 Goals/90, min 500 mins)")
        print("=" * 80)
        cursor.execute("""
            SELECT 
                p.name AS player_name,
                p90.minutes_played,
                p90.goals_per90,
                p90.assists_per90,
                p90.shots_per90,
                p90.key_passes_per90,
                p90.tackles_per90
            FROM vw_player_per90_metrics p90
            JOIN players p ON p.player_id = p90.player_id
            WHERE p90.minutes_played >= 500
            ORDER BY p90.goals_per90 DESC
            LIMIT 5;
        """)
        rows = cursor.fetchall()
        print(f"{'Player':<22} {'Mins':<6} {'G/90':<8} {'A/90':<8} {'Shots/90':<10} {'KP/90':<8} {'Tkl/90':<8}")
        print("-" * 80)
        for r in rows:
            print(f"{r[0]:<22} {r[1]:<6} {str(r[2]):<8} {str(r[3]):<8} {str(r[4]):<10} {str(r[5]):<8} {str(r[6]):<8}")

        # 3. Sample from vw_team_season_performance
        print("\n" + "=" * 80)
        print("SAMPLE: vw_team_season_performance (League Standings Top 5)")
        print("=" * 80)
        cursor.execute("""
            SELECT 
                t.name AS team_name,
                tsp.matches,
                tsp.wins,
                tsp.draws,
                tsp.losses,
                tsp.goals_for,
                tsp.goals_against,
                tsp.goal_difference,
                tsp.average_possession,
                (tsp.wins * 3 + tsp.draws) AS points
            FROM vw_team_season_performance tsp
            JOIN teams t ON t.team_id = tsp.team_id
            ORDER BY points DESC, tsp.goal_difference DESC
            LIMIT 5;
        """)
        rows = cursor.fetchall()
        print(f"{'Team':<18} {'P':<4} {'W':<4} {'D':<4} {'L':<4} {'GF':<4} {'GA':<4} {'GD':<5} {'Poss%':<8} {'Pts':<4}")
        print("-" * 80)
        for r in rows:
            print(f"{r[0]:<18} {r[1]:<4} {r[2]:<4} {r[3]:<4} {r[4]:<4} {r[5]:<4} {r[6]:<4} {r[7]:<5} {str(r[8]):<8} {r[9]:<4}")

        # 4. Sample from vw_player_scouting_features
        print("\n" + "=" * 90)
        print("SAMPLE: vw_player_scouting_features (Top Rated Players, min 900 mins)")
        print("=" * 90)
        cursor.execute("""
            SELECT 
                player_name,
                team_name,
                minutes_played,
                rating,
                goals_per90,
                assists_per90,
                pass_accuracy_percentage,
                tackle_success_percentage,
                duel_win_percentage
            FROM vw_player_scouting_features
            WHERE minutes_played >= 900
            ORDER BY rating DESC
            LIMIT 5;
        """)
        rows = cursor.fetchall()
        print(f"{'Player':<20} {'Team':<16} {'Mins':<6} {'Rating':<7} {'G/90':<6} {'A/90':<6} {'Pass%':<8} {'Tkl%':<8} {'Duel%':<8}")
        print("-" * 90)
        for r in rows:
            print(f"{r[0]:<20} {r[1]:<16} {r[2]:<6} {str(r[3]):<7} {str(r[4]):<6} {str(r[5]):<6} {str(r[6]):<8} {str(r[7]):<8} {str(r[8]):<8}")

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


def main() -> None:
    print("=" * 80)
    print("ScoutIQ — Analytical Views Build & Verification")
    print("=" * 80)
    build_views()

    print("\n" + "=" * 80)
    print("Running Data Quality Checks (06_analytics_validation.sql)...")
    print("=" * 80)
    val_results = run_validations()
    all_clean = True
    for i, (q, anomaly_count) in enumerate(val_results, start=1):
        status = "PASSED (0 anomalies)" if anomaly_count == 0 else f"NOTE: {anomaly_count} matching rows"
        print(f"  Check {i}: {status}")
        if anomaly_count > 0:
            all_clean = False

    if all_clean:
        print("\nAll analytical data quality validations PASSED with 0 anomalies.")
    else:
        print("\nQuality checks completed. See details above.")

    sample_views()
    print("\n" + "=" * 80)
    print("ScoutIQ Analytics Layer build complete.")
    print("=" * 80)


if __name__ == "__main__":
    main()
