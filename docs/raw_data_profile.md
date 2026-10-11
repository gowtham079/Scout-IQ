# ScoutIQ — Raw Data Profile Report

## Overview

This profiling report inspects the raw JSON responses fetched from the Sportmonks Football API v3 stored in `data/raw/`:
- `superliga_271.json` (Competition)
- `season_25536.json` (Season)
- `teams_season_25536.json` (Teams)
- `schedule_season_25536.json` (Stages, Rounds, Fixtures, Scores)

---

## A. Competition Profile (`superliga_271.json`)

- **Top-Level Keys:** `data, subscription, rate_limit, timezone`
- **Data Object Type:** `dict` (Single object containing league metadata)
- **Available League Fields (12):**
  `id, sport_id, country_id, name, active, short_code, image_path, type, sub_type, last_played_at, category, has_jerseys`
- **Key Values:**
  - `id`: 271
  - `name`: "Superliga"
  - `short_code`: "DNK SL"
  - `sport_id`: 1
  - `country_id`: 320
  - `active`: True

---

## B. Season Profile (`season_25536.json`)

- **Top-Level Keys:** `data, subscription, rate_limit, timezone`
- **Data Object Type:** `dict`
- **Available Season Fields (12):**
  `id, sport_id, league_id, tie_breaker_rule_id, name, finished, pending, is_current, starting_at, ending_at, standings_recalculated_at, games_in_current_week`
- **Key Values:**
  - `id`: 25536
  - `league_id`: 271
  - `name`: "2025/2026"
  - `starting_at`: "2025-07-18"
  - `ending_at`: "2026-05-17"
  - `finished`: True
  - `is_current`: False

---

## C. Teams Profile (`teams_season_25536.json`)

- **Top-Level Keys:** `data, subscription, rate_limit, timezone`
- **Number of Teams:** 12
- **Available Fields per Team (12):**
  `id, sport_id, country_id, venue_id, gender, name, short_code, image_path, founded, type, placeholder, last_played_at`
- **Missing / Null Team Fields:**
  - `short_code`: 2 of 12 teams are NULL (e.g. Vejle Boldklub and Fredericia lack short_code)
- **Sample Team Record (Viborg FF):**
```json
{
  "id": 2447,
  "sport_id": 1,
  "country_id": 320,
  "venue_id": 1467,
  "gender": "male",
  "name": "Viborg FF",
  "short_code": "VFF",
  "image_path": "https://cdn.sportmonks.com/images/soccer/teams/15/2447.png",
  "founded": 1896,
  "type": "domestic",
  "placeholder": false,
  "last_played_at": "2026-09-20 16:00:00"
}
```

---

## D. Schedule Profile (`schedule_season_25536.json`)

- **Top-Level Keys:** `data, subscription, rate_limit, timezone`
- **Number of Stages:** 4
- **Total Fixtures:** 192
- **Stage Breakdown:**

| Stage ID | Stage Name | Rounds Count | Fixtures Count |
|:---|:---|:---|:---|
| 77476856 | Regular Season | 22 | 132 |
| 77480927 | Championship Round | 10 | 30 |
| 77480926 | Relegation Round | 10 | 30 |
| 77482081 | Conference League Play-offs - Final | 0 | 0 |

- **Fields in One Stage Object (15):**
  `id, sport_id, league_id, season_id, type_id, name, sort_order, finished, is_current, starting_at, ending_at, games_in_current_week, tie_breaker_rule_id, rounds, aggregates`
- **Fields in One Round Object (12):**
  `id, sport_id, league_id, season_id, stage_id, name, finished, is_current, starting_at, ending_at, games_in_current_week, fixtures`
- **Fields in One Fixture Object (22):**
  `id, sport_id, league_id, season_id, stage_id, group_id, aggregate_id, round_id, state_id, venue_id, name, starting_at, result_info, leg, details, length, placeholder, has_odds, has_premium_odds, starting_at_timestamp, participants, scores`

---

## E. Match & Fixture Core Attribute Check

| Required Attribute | Present in Raw Fixture? | Details & Mapping Source |
|:---|:---|:---|
| `fixture_id` | YES | Present as `fixture.id` (100% complete) |
| `starting_at` | YES | Present as `fixture.starting_at` (ISO timestamp) |
| `participants` | YES | Array of 2 team objects in each fixture |
| `home_team` | YES | Identified by `participant.meta.location == 'home'` (192/192) |
| `away_team` | YES | Identified by `participant.meta.location == 'away'` (192/192) |
| `scores` | YES | Array of score breakdowns (CURRENT, 1ST_HALF, 2ND_HALF) |
| `status` | YES | Available via `fixture.state_id` (5 = FT) & `fixture.result_info` |
| `stage` | YES | Present via `fixture.stage_id` and parent `stage.name` |
| `round` | YES | Present via `fixture.round_id` and `round.name` (1..22, etc.) |
| `venue` | YES | Present as `fixture.venue_id` (100% non-null) |
| `league` | YES | Present as `fixture.league_id` (271) |
| `season` | YES | Present as `fixture.season_id` (25536) |

---

## F. Integrity and Duplicate Analysis

- **Total Fixture Records:** 192
- **Unique Fixture IDs:** 192
- **Duplicate Fixture IDs Found:** 0

---

## G. Missing / Null Values Summary

- **Fixtures:**
  - `starting_at` NULL count: 0
  - `venue_id` NULL count: 0
  - `round_id` NULL count: 0
  - `state_id` NULL count: 0
  - `result_info` NULL count: 0
- **Teams:**
  - `short_code` NULL count: 2 of 12 (Vejle Boldklub, Fredericia)
  - `venue_id` NULL count: 0
  - `country_id` NULL count: 0

---

## Transformation Requirements

To load the raw data into the ScoutIQ MySQL database, transformation logic will extract and map the following fields from the nested JSON files:

### 1. `competitions` Table
Source: `data/raw/superliga_271.json` -> `data`

| MySQL Column | Type | Target Source Field | Extraction Logic / Notes |
|:---|:---|:---|:---|
| `competition_id` | BIGINT PK | `data.id` | Cast to integer (271) |
| `name` | VARCHAR(150) | `data.name` | "Superliga" |
| `short_code` | VARCHAR(30) | `data.short_code` | "DNK SL" (nullable) |
| `sport_id` | BIGINT | `data.sport_id` | 1 (Football) |
| `country_id` | BIGINT | `data.country_id` | 320 (Denmark) |
| `active` | TINYINT(1) | `data.active` | 1 if True, 0 if False |

### 2. `seasons` Table
Source: `data/raw/season_25536.json` -> `data`

| MySQL Column | Type | Target Source Field | Extraction Logic / Notes |
|:---|:---|:---|:---|
| `season_id` | BIGINT PK | `data.id` | Cast to integer (25536) |
| `competition_id` | BIGINT FK | `data.league_id` | Foreign key referencing `competitions.competition_id` |
| `name` | VARCHAR(50) | `data.name` | "2025/2026" |
| `starting_at` | DATE | `data.starting_at` | Parse "YYYY-MM-DD" |
| `ending_at` | DATE | `data.ending_at` | Parse "YYYY-MM-DD" |

### 3. `teams` Table
Source: `data/raw/teams_season_25536.json` -> `data[]`

| MySQL Column | Type | Target Source Field | Extraction Logic / Notes |
|:---|:---|:---|:---|
| `team_id` | BIGINT PK | `item.id` | Unique team ID |
| `name` | VARCHAR(150) | `item.name` | Full team name |
| `short_code` | VARCHAR(20) | `item.short_code` | NULL if missing (2 teams have None) |
| `country_id` | BIGINT | `item.country_id` | 320 |
| `venue_id` | BIGINT | `item.venue_id` | Venue ID |

### 4. `team_seasons` Table
Source: `data/raw/teams_season_25536.json` -> `data[]` and Season context

| MySQL Column | Type | Target Source Field | Extraction Logic / Notes |
|:---|:---|:---|:---|
| `team_season_id` | BIGINT PK | AUTO_INCREMENT | Auto-generated by MySQL |
| `team_id` | BIGINT FK | `item.id` | Foreign key referencing `teams.team_id` |
| `season_id` | BIGINT FK | Constant `25536` | Foreign key referencing `seasons.season_id` |

### 5. `fixtures` Table
Source: `data/raw/schedule_season_25536.json` -> `data[stage].rounds[round].fixtures[]`

| MySQL Column | Type | Target Source Field | Extraction Logic / Notes |
|:---|:---|:---|:---|
| `fixture_id` | BIGINT PK | `fixture.id` | Match identifier (192 unique IDs) |
| `season_id` | BIGINT FK | `fixture.season_id` | 25536 |
| `home_team_id` | BIGINT FK | `fixture.participants` | Filter participant with `meta.location == 'home'`, take `id` |
| `away_team_id` | BIGINT FK | `fixture.participants` | Filter participant with `meta.location == 'away'`, take `id` |
| `starting_at` | DATETIME | `fixture.starting_at` | Match kick-off datetime |
| `stage_name` | VARCHAR(100) | `stage.name` | Parent stage name (e.g. "Regular Season", "Championship Round") |
| `round_number` | INT | `round.name` | Cast string `round.name` (e.g. "1", "2") to integer |
| `status` | VARCHAR(50) | `fixture.state_id` / `result_info` | Map state_id (5 -> 'FT') or normalize status string |

### 6. `fixture_scores` Table
Source: `data/raw/schedule_season_25536.json` -> `fixture.scores[]`

| MySQL Column | Type | Target Source Field | Extraction Logic / Notes |
|:---|:---|:---|:---|
| `score_id` | BIGINT PK | AUTO_INCREMENT / `score.id` | Use AUTO_INCREMENT or Sportmonks score ID |
| `fixture_id` | BIGINT FK | `fixture.id` or `score.fixture_id` | References `fixtures.fixture_id` |
| `team_id` | BIGINT FK | `score.participant_id` | References `teams.team_id` |
| `score_type` | VARCHAR(50) | `score.description` | 'CURRENT', '1ST_HALF', '2ND_HALF', etc. |
| `goals` | INT | `score.score.goals` | Extract integer value from nested `score.score.goals` |
