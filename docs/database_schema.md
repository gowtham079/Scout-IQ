# ScoutIQ — MySQL Database Schema

## 1. Database Purpose

The ScoutIQ database stores normalized football data collected from the Sportmonks Football API.

The database is designed to support:

- Historical football analysis
- Player performance analysis
- Team analysis
- Player comparison
- Player similarity
- Player archetype clustering
- Recruitment search
- Tactical-fit analysis
- Machine learning feature generation
- AI-powered scouting

---

## 2. Database Architecture

The MVP database contains the following core entities:

```text
competitions
      |
    seasons
      |
     teams
      |
   fixtures
   /   |   \
scores events lineups
              |
      player_match_stats
              |
         stat_types

teams
  |
team_match_stats
  |
team_stat_types
```

---

## 3. Table Definitions

### 3.1 `competitions`
Stores competition and league metadata.

| Column | Type | Nullable | Key | Notes |
|:---|:---|:---|:---|:---|
| `competition_id` | BIGINT | NOT NULL | PRI | Sportmonks league identifier |
| `name` | VARCHAR(150) | NOT NULL | | Competition name (e.g. "Superliga") |
| `short_code` | VARCHAR(30) | NULL | | League short code |
| `sport_id` | BIGINT | NULL | | Sport identifier (1 = Football) |
| `country_id` | BIGINT | NULL | | Country identifier (e.g. 320 = Denmark) |
| `active` | TINYINT(1) | NULL | | Whether competition is currently active |

---

### 3.2 `seasons`
Stores season-level metadata tied to a competition.

| Column | Type | Nullable | Key | Notes |
|:---|:---|:---|:---|:---|
| `season_id` | BIGINT | NOT NULL | PRI | Sportmonks season identifier |
| `competition_id` | BIGINT | NOT NULL | FK | References `competitions(competition_id)` |
| `name` | VARCHAR(50) | NOT NULL | | Season label (e.g. "2025/2026") |
| `starting_at` | DATE | NULL | | Season start date |
| `ending_at` | DATE | NULL | | Season end date |

---

### 3.3 `teams`
Stores club and team master records.

| Column | Type | Nullable | Key | Notes |
|:---|:---|:---|:---|:---|
| `team_id` | BIGINT | NOT NULL | PRI | Sportmonks team identifier |
| `name` | VARCHAR(150) | NOT NULL | | Official team name |
| `short_code` | VARCHAR(20) | NULL | | Team short code (e.g. "FCM", "ODE") |
| `country_id` | BIGINT | NULL | | Country identifier |
| `venue_id` | BIGINT | NULL | | Home venue identifier |

---

### 3.4 `team_seasons`
Associates teams with seasons in which they participate.

| Column | Type | Nullable | Key | Notes |
|:---|:---|:---|:---|:---|
| `team_season_id` | BIGINT | NOT NULL | PRI | Auto-increment primary key |
| `team_id` | BIGINT | NOT NULL | FK | References `teams(team_id)` |
| `season_id` | BIGINT | NOT NULL | FK | References `seasons(season_id)` |

---

### 3.5 `fixtures`
Stores match fixtures, dates, stage/round info, and stadium/venue references.

| Column | Type | Nullable | Key | Notes |
|:---|:---|:---|:---|:---|
| `fixture_id` | BIGINT | NOT NULL | PRI | Sportmonks fixture identifier |
| `season_id` | BIGINT | NOT NULL | FK | References `seasons(season_id)` |
| `home_team_id` | BIGINT | NOT NULL | FK | References `teams(team_id)` |
| `away_team_id` | BIGINT | NOT NULL | FK | References `teams(team_id)` |
| `venue_id` | BIGINT | NULL | | Sportmonks venue/stadium identifier |
| `starting_at` | DATETIME | NOT NULL | | Match kickoff timestamp |
| `stage_name` | VARCHAR(100) | NULL | | Competition stage (e.g. "Regular Season") |
| `round_number` | INT | NULL | | Round number (e.g. 1..22) |
| `status` | VARCHAR(50) | NULL | | Match status or result summary |

---

### 3.6 `fixture_scores`
Stores period-by-period and final match scores per team.

| Column | Type | Nullable | Key | Notes |
|:---|:---|:---|:---|:---|
| `score_id` | BIGINT | NOT NULL | PRI | Auto-increment score record ID |
| `fixture_id` | BIGINT | NOT NULL | FK | References `fixtures(fixture_id)` |
| `team_id` | BIGINT | NOT NULL | FK | References `teams(team_id)` |
| `score_type` | VARCHAR(50) | NOT NULL | | 'CURRENT', '1ST_HALF', '2ND_HALF', etc. |
| `goals` | INT | NOT NULL | | Number of goals scored |

---

### 3.7 `players`
Player master records.

| Column | Type | Nullable | Key | Notes |
|:---|:---|:---|:---|:---|
| `player_id` | BIGINT | NOT NULL | PRI | Sportmonks player identifier |
| `name` | VARCHAR(150) | NOT NULL | | Full player name |
| `nationality` | VARCHAR(100) | NULL | | Player nationality |
| `height_cm` | DECIMAL(5,2) | NULL | | Height in centimeters |
| `image_url` | TEXT | NULL | | Profile image URL |

---

### 3.8 `lineups`
Starting lineups and substitutions per fixture.

| Column | Type | Nullable | Key | Notes |
|:---|:---|:---|:---|:---|
| `lineup_id` | BIGINT | NOT NULL | PRI | Auto-increment lineup ID |
| `fixture_id` | BIGINT | NOT NULL | FK | References `fixtures(fixture_id)` |
| `player_id` | BIGINT | NOT NULL | FK | References `players(player_id)` |
| `team_id` | BIGINT | NOT NULL | FK | References `teams(team_id)` |
| `position_id` | INT | NULL | | Sportmonks position identifier |
| `formation_position` | INT | NULL | | Numerical formation slot |
| `formation_field` | VARCHAR(30) | NULL | | Field coordinates/label |
| `jersey_number` | INT | NULL | | Shirt number |
| `lineup_type_id` | INT | NULL | | Starter / bench lineup type |
| `is_captain` | TINYINT(1) | NULL | | 1 if team captain, else 0 |

---

### 3.9 `match_events`
In-match events such as goals, cards, and substitutions.

| Column | Type | Nullable | Key | Notes |
|:---|:---|:---|:---|:---|
| `event_id` | BIGINT | NOT NULL | PRI | Sportmonks event identifier |
| `fixture_id` | BIGINT | NOT NULL | FK | References `fixtures(fixture_id)` |
| `player_id` | BIGINT | NULL | FK | Associated player (if applicable) |
| `team_id` | BIGINT | NULL | FK | Associated team |
| `event_type` | VARCHAR(100) | NOT NULL | | Event type (e.g. goal, card, sub) |
| `minute` | INT | NULL | | Match minute |
| `extra_minute` | INT | NULL | | Stoppage time minute |
| `raw_event_data` | JSON | NULL | | Raw event JSON payload |

---

### 3.10 `stat_types`
Catalog of player-level match statistic definitions.

| Column | Type | Nullable | Key | Notes |
|:---|:---|:---|:---|:---|
| `stat_type_id` | INT | NOT NULL | PRI | Sportmonks stat type ID |
| `code` | VARCHAR(100) | NOT NULL | UNI | Unique metric code (e.g. "key-passes") |
| `name` | VARCHAR(150) | NOT NULL | | Human-readable metric name |
| `category` | VARCHAR(50) | NULL | | Metric category |
| `data_type` | VARCHAR(30) | NULL | | Data type representation |

---

### 3.11 `player_match_stats`
Granular performance metrics per player per match.

| Column | Type | Nullable | Key | Notes |
|:---|:---|:---|:---|:---|
| `player_stat_id` | BIGINT | NOT NULL | PRI | Auto-increment primary key |
| `fixture_id` | BIGINT | NOT NULL | FK | References `fixtures(fixture_id)` |
| `player_id` | BIGINT | NOT NULL | FK | References `players(player_id)` |
| `team_id` | BIGINT | NOT NULL | FK | References `teams(team_id)` |
| `stat_type_id` | INT | NOT NULL | FK | References `stat_types(stat_type_id)` |
| `numeric_value` | DECIMAL(12,4) | NULL | | Metric value |
| `text_value` | VARCHAR(255) | NULL | | Textual metric value |

---

### 3.12 `team_stat_types`
Catalog of team-level match statistic definitions.

| Column | Type | Nullable | Key | Notes |
|:---|:---|:---|:---|:---|
| `team_stat_type_id` | INT | NOT NULL | PRI | Sportmonks team stat type ID |
| `code` | VARCHAR(100) | NOT NULL | UNI | Unique code |
| `name` | VARCHAR(150) | NOT NULL | | Metric name |
| `data_type` | VARCHAR(30) | NULL | | Representation type |

---

### 3.13 `team_match_stats`
Granular performance metrics per team per match.

| Column | Type | Nullable | Key | Notes |
|:---|:---|:---|:---|:---|
| `team_stat_id` | BIGINT | NOT NULL | PRI | Auto-increment primary key |
| `fixture_id` | BIGINT | NOT NULL | FK | References `fixtures(fixture_id)` |
| `team_id` | BIGINT | NOT NULL | FK | References `teams(team_id)` |
| `team_stat_type_id` | INT | NOT NULL | FK | References `team_stat_types(team_stat_type_id)` |
| `numeric_value` | DECIMAL(12,4) | NULL | | Metric value |
| `text_value` | VARCHAR(255) | NULL | | Textual metric value |