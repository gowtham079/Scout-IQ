import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import requests
from dotenv import load_dotenv

# Ensure UTF-8 output encoding for consoles that default to cp1252 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Locate and load the .env file from the project root
_BASE_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_PATH = _BASE_DIR / ".env"

if _ENV_PATH.exists():
    load_dotenv(dotenv_path=_ENV_PATH)
else:
    load_dotenv()


class SportmonksError(Exception):
    """Base exception for Sportmonks API errors."""
    pass


class SportmonksAuthError(SportmonksError):
    """Raised for authentication or authorization failures (HTTP 401 / 403)."""
    pass


class SportmonksRateLimitError(SportmonksError):
    """Raised when the API rate limit is exceeded (HTTP 429)."""
    pass


class SportmonksRequestError(SportmonksError):
    """Raised for general HTTP errors or network/connection failures."""
    pass


def _sanitize_message(message: str, secret: str = "") -> str:
    """
    Remove or mask the API token and query parameters from error strings.
    """
    if not message:
        return ""
    sanitized = str(message)
    if secret:
        sanitized = sanitized.replace(secret, "***")
    sanitized = re.sub(r"api_token=[^& \t\r\n]+", "api_token=***", sanitized)
    return sanitized


class SportmonksClient:
    """
    Reusable client for Sportmonks Football API v3.
    """

    BASE_URL = "https://api.sportmonks.com/v3/football"

    def __init__(
        self,
        api_token: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: int = 30,
    ) -> None:
        token = api_token or os.getenv("SPORTMONKS_API_TOKEN")
        if not token:
            raise ValueError(
                "SPORTMONKS_API_TOKEN is missing. Provide it via parameter or environment variable."
            )

        self._api_token = token
        self.base_url = (base_url or self.BASE_URL).rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()

    def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generic GET request to the Sportmonks Football API.

        - Adds api_token query parameter automatically
        - Enforces request timeout
        - Calls raise_for_status() and handles HTTP/network errors cleanly
        - Masks the API token in all error messages
        """
        clean_endpoint = endpoint.strip("/")

        if endpoint.startswith("http://") or endpoint.startswith("https://"):
            url = endpoint
        elif clean_endpoint.startswith("my/"):
            # Sportmonks account/subscription endpoints live under v3/my/
            url = f"https://api.sportmonks.com/v3/{clean_endpoint}"
        else:
            url = f"{self.base_url}/{clean_endpoint}"

        request_params = dict(params) if params else {}
        request_params["api_token"] = self._api_token

        try:
            response = self.session.get(url, params=request_params, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as http_err:
            status = response.status_code
            safe_url = _sanitize_message(response.url, self._api_token)

            detail = ""
            try:
                error_body = response.json()
                detail = error_body.get("message", "")
            except Exception:
                detail = _sanitize_message(response.text[:200], self._api_token)

            detail_suffix = f" - {detail}" if detail else ""

            if status == 401:
                raise SportmonksAuthError(
                    f"HTTP 401 Unauthorized: Invalid or missing API token for {safe_url}{detail_suffix}"
                ) from None
            elif status == 403:
                raise SportmonksAuthError(
                    f"HTTP 403 Forbidden: Access denied or subscription tier insufficient for {safe_url}{detail_suffix}"
                ) from None
            elif status == 429:
                raise SportmonksRateLimitError(
                    f"HTTP 429 Too Many Requests: Rate limit exceeded for {safe_url}{detail_suffix}"
                ) from None
            else:
                raise SportmonksRequestError(
                    f"HTTP {status} Error: Request failed for {safe_url}{detail_suffix}"
                ) from None
        except requests.exceptions.RequestException as req_err:
            clean_err = _sanitize_message(str(req_err), self._api_token)
            raise SportmonksRequestError(
                f"Network or connection error during request: {clean_err}"
            ) from None

    def get_my_leagues(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Retrieve leagues included in the user's active subscription.
        """
        return self.get("my/leagues", params=params)

    def get_seasons(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Retrieve available seasons.
        """
        return self.get("seasons", params=params)

    def get_teams_by_season(
        self, season_id: Union[int, str], params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Retrieve all teams participating in a specific season.
        """
        return self.get(f"teams/seasons/{season_id}", params=params)

    def get_schedule_by_season(
        self, season_id: Union[int, str], params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Retrieve the match schedule for a specific season.
        """
        return self.get(f"schedules/seasons/{season_id}", params=params)

    def get_fixture(
        self,
        fixture_id: Union[int, str],
        include: Optional[Union[str, List[str]]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Retrieve fixture details by ID with optional includes
        (e.g., lineups, statistics.type, participants, scores, events).
        """
        request_params = dict(params) if params else {}

        if include:
            if isinstance(include, (list, tuple, set)):
                request_params["include"] = ";".join(str(item) for item in include)
            else:
                request_params["include"] = str(include)

        return self.get(f"fixtures/{fixture_id}", params=request_params)

    def close(self) -> None:
        """Close the underlying requests Session."""
        self.session.close()

    def __enter__(self) -> "SportmonksClient":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()


if __name__ == "__main__":
    print("Testing SportmonksClient.get_my_leagues()...")
    try:
        client = SportmonksClient()
        response_data = client.get_my_leagues()
        leagues = response_data.get("data", [])
        print(f"Success! Retrieved {len(leagues)} leagues.")
        for item in leagues[:5]:
            print(f"- ID: {item.get('id')}, Name: {item.get('name')}")
    except Exception as error:
        print(f"Request failed: {error}")
