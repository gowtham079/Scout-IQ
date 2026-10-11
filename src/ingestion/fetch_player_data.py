import json
import sys
import time
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
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.api.sportmonks import (
    SportmonksClient,
    SportmonksError,
    SportmonksRateLimitError,
)

FIXTURES_FILE = PROJECT_ROOT / "data" / "processed" / "fixtures.json"
RAW_PLAYER_DIR = PROJECT_ROOT / "data" / "raw" / "player"

# Tested and verified supported includes for fixture analytics
INCLUDES = (
    "participants;"
    "scores;"
    "events.type;"
    "lineups.details.type;"
    "lineups.player;"
    "statistics.type"
)


def load_fixture_ids() -> List[int]:
    """Load ordered fixture IDs from data/processed/fixtures.json."""
    if not FIXTURES_FILE.exists():
        raise FileNotFoundError(f"Processed fixtures file not found: {FIXTURES_FILE}")
    with open(FIXTURES_FILE, "r", encoding="utf-8") as f:
        fixtures = json.load(f)
    return [int(f["fixture_id"]) for f in fixtures]


def is_valid_raw_fixture(filepath: Path) -> bool:
    """Check if the raw fixture file exists and contains valid JSON with 'data'."""
    if not filepath.exists() or filepath.stat().st_size == 0:
        return False
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return isinstance(data, dict) and "data" in data and bool(data["data"])
    except Exception:
        return False


def save_raw_fixture(fixture_data: Dict[str, Any], filepath: Path) -> None:
    """Save a single fixture's raw payload to a JSON file."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    payload = {"data": fixture_data}
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)


def fetch_player_data(batch_size: int = 10, delay_seconds: float = 0.5) -> Dict[str, int]:
    """
    Ingest player and match analytics data for all fixtures.
    Supports resuming, batching via multi-fixture endpoint, and rate limit protection.
    """
    RAW_PLAYER_DIR.mkdir(parents=True, exist_ok=True)
    fixture_ids = load_fixture_ids()

    client = SportmonksClient()

    pending_ids: List[int] = []
    skipped_count = 0

    for fid in fixture_ids:
        filepath = RAW_PLAYER_DIR / f"fixture_{fid}.json"
        if is_valid_raw_fixture(filepath):
            skipped_count += 1
        else:
            pending_ids.append(fid)

    print(f"Total fixtures: {len(fixture_ids)}")
    print(f"Already cached / skipped: {skipped_count}")
    print(f"Pending to fetch: {len(pending_ids)}")

    processed_count = 0
    failed_count = 0
    created_count = 0

    if not pending_ids:
        return {
            "processed": len(fixture_ids),
            "skipped": skipped_count,
            "failed": 0,
            "created": 0,
        }

    # Process pending in batches
    for i in range(0, len(pending_ids), batch_size):
        chunk = pending_ids[i : i + batch_size]
        chunk_str = ",".join(str(cid) for cid in chunk)
        print(f"Fetching batch {i // batch_size + 1}/{(len(pending_ids) + batch_size - 1) // batch_size} ({len(chunk)} fixtures)...")

        try:
            if len(chunk) == 1:
                res = client.get_fixture(chunk[0], include=INCLUDES)
                fixture_items = [res.get("data", {})] if res.get("data") else []
            else:
                res = client.get(f"fixtures/multi/{chunk_str}", params={"include": INCLUDES})
                fixture_items = res.get("data", [])

            # Map returned fixtures by id
            returned_by_id = {item.get("id"): item for item in fixture_items if isinstance(item, dict) and item.get("id")}

            for fid in chunk:
                item = returned_by_id.get(fid)
                if item:
                    save_path = RAW_PLAYER_DIR / f"fixture_{fid}.json"
                    save_raw_fixture(item, save_path)
                    created_count += 1
                    processed_count += 1
                else:
                    print(f"Warning: Fixture {fid} was not returned in batch response.")
                    failed_count += 1

            # Check rate limit remaining if provided
            rate_limit = res.get("rate_limit", {})
            remaining = rate_limit.get("remaining")
            if remaining is not None and remaining <= 2:
                print(f"Warning: Rate limit nearly exhausted ({remaining} calls remaining). Stopping safely.")
                break

            time.sleep(delay_seconds)

        except SportmonksRateLimitError as err:
            print(f"Rate limit exceeded (HTTP 429): {err}. Stopping safely to allow quota reset.", file=sys.stderr)
            failed_count += len(chunk)
            break
        except SportmonksError as err:
            print(f"API Error fetching batch: {err}", file=sys.stderr)
            failed_count += len(chunk)
            break
        except Exception as err:
            print(f"Unexpected error fetching batch: {err}", file=sys.stderr)
            failed_count += len(chunk)
            break

    total_processed = skipped_count + processed_count

    return {
        "processed": total_processed,
        "skipped": skipped_count,
        "failed": failed_count,
        "created": created_count,
    }


def main() -> None:
    results = fetch_player_data(batch_size=10, delay_seconds=0.5)

    print("\nScoutIQ — Player Data Ingestion\n")
    print(f"Fixtures processed: {results['processed']}")
    print(f"Fixtures skipped: {results['skipped']}")
    print(f"Fixtures failed: {results['failed']}")
    print(f"Raw files created: {results['created']}")


if __name__ == "__main__":
    main()
