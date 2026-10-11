import os
import sys
import requests
from dotenv import load_dotenv

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

load_dotenv()

token = os.getenv("SPORTMONKS_API_TOKEN")

if not token:
    raise ValueError("SPORTMONKS_API_TOKEN not found")

fixture_id = 19425572

url = f"https://api.sportmonks.com/v3/football/fixtures/{fixture_id}"

response = requests.get(
    url,
    params={
        "api_token": token,
        "include": "xGFixture"
    },
    timeout=30
)

print("Status:", response.status_code)

if response.ok:
    fixture = response.json().get("data", {})

    xg_data = fixture.get("xgfixture", [])

    print("✅ xG request successful!")
    print("xG records:", len(xg_data))

    for item in xg_data:
        metric_type = item.get("type", {})
        value = item.get("data", {}).get("value")

        print(
            metric_type.get("code"),
            "->",
            metric_type.get("name"),
            "=",
            value,
            "| Location:",
            item.get("location")
        )

else:
    print("❌ Request failed:")
    print(response.text)