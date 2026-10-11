# ScoutIQ — Football Intelligence & Scouting Analytics Platform

ScoutIQ is an end-to-end football intelligence and recruitment analytics pipeline built for modern scouting, squad evaluation, and performance benchmarking. Focusing on the **Danish Superliga (2025/26 Season)**, ScoutIQ ingests raw match events and player statistics via the **Sportmonks API v3**, models them into a normalized **MySQL** database, builds standardized **SQL analytical views (per-90 metrics & feature stores)**, and surfaces actionable intelligence through an interactive **Power BI** dashboard suite.

---

## 📊 Dashboard Visualizations

The ScoutIQ Power BI report ([`ScoutIQ_Football_Analytics.pbix`](ScoutIQ_Football_Analytics.pbix)) delivers interactive analytics across executive, club, and player scouting dimensions:

### 1. Executive Season Overview
High-level KPIs, scoring trends, and top offensive performers across the Danish Superliga.
- **Key Metrics:** Total Goals (583), Total Players Analyzed (412), Total Assists (409), League Average Rating (6.76).
- **Goal Dynamics:** Comparison of Goals For vs. Goals Against per team.
- **Top Scorers:** Absolute goal leaderboards (Franculino Gluda Djú, Tonni Adamsen, Jordan Larsson, etc.).
- **Per-90 Efficiency:** Top 10 players ranked by Goals per 90 minutes.

![ScoutIQ Executive Overview](Dashboard%20Images/Screenshot%202026-10-11%20130426.png)

---

### 2. Player Performance & Scouting Analysis
Deep-dive scouting view allowing scouts and analysts to benchmark players with customizable playing-time thresholds.
- **Interactive Filtering:** Dynamic minutes-played slider (e.g., 500 to 2,800 mins) and multi-select player slicers.
- **Player Registry:** Granular player-level table tracking minutes played, club, and overall match ratings.
- **Performance Benchmarks:** Ranked average match rating distribution across qualified talent (featuring Gift Links, Thomas Jørgensen, Sindre Walle Egeli, Dario Osorio, and more).

![Player Performance & Scouting Analysis](Dashboard%20Images/Screenshot%202026-10-11%20130502.png)

---

### 3. Team Performance & Standings Intelligence
Tactical and league standings intelligence breaking down team dominance, efficiency, and game control.
- **Superliga Standings Table:** Complete match records, wins, draws, losses, goals scored, and conceded.
- **Results Distribution:** Clustered win/draw/loss breakdown for all clubs.
- **Goal Difference:** Net goal differential ranking across the league.
- **Possession Analysis:** Average possession share per club (led by FC Nordsjælland, FC København, and FC Midtjylland).

![Team Performance & Standings Intelligence](Dashboard%20Images/Screenshot%202026-10-11%20130517.png)

---

## 🏗️ Architecture & Data Pipeline

```text
       +--------------------------------------------------+
       |             Sportmonks Football API v3           |
       +--------------------------------------------------+
                                |
                                v  (src/ingestion)
       +--------------------------------------------------+
       |        Raw Extraction & Profiling (JSON/Python)  |
       +--------------------------------------------------+
                                |
                                v  (src/loaders)
       +--------------------------------------------------+
       |             MySQL Relational Database            |
       |  (Leagues, Seasons, Teams, Fixtures, Lineups,    |
       |   Player Match Stats, Stat Types, xG)            |
       +--------------------------------------------------+
                                |
                                v  (sql/analytics)
       +--------------------------------------------------+
       |              SQL Analytical Views Layer          |
       |  - vw_player_match_summary (Match grain pivot)   |
       |  - vw_player_season_performance (Season totals)  |
       |  - vw_player_per90_metrics (Per-90 normalization)|
       |  - vw_player_scouting_features (Scouting features|
       |  - vw_team_season_performance (Team standings)   |
       +--------------------------------------------------+
                                |
                                v
       +--------------------------------------------------+
       |               Power BI Dashboards                |
       |       (ScoutIQ_Football_Analytics.pbix)          |
       +--------------------------------------------------+
```

---

## 📁 Repository Structure

```text
ScoutIQ/
├── Dashboard Images/                 # Power BI dashboard screenshots
│   ├── Screenshot 2026-10-11 130426.png  # Executive Overview
│   ├── Screenshot 2026-10-11 130502.png  # Player Scouting & Ratings
│   └── Screenshot 2026-10-11 130517.png  # Team Standings & Possession
├── ScoutIQ_Football_Analytics.pbix  # Interactive Power BI report file
├── docs/                             # Schemas and analytical data dictionaries
│   ├── analytics_dictionary.md       # Analytical view definitions & metrics
│   ├── data_dictionary.md            # Raw and ingested column specifications
│   ├── database_schema.md            # MySQL database schema design
│   ├── player_data_profile.md        # Data profiling for player metrics
│   └── raw_data_profile.md           # Raw API payload profiling
├── sql/
│   └── analytics/                    # Modular analytical views & validation
│       ├── 01_player_match_summary.sql
│       ├── 02_player_season_performance.sql
│       ├── 03_player_per90_metrics.sql
│       ├── 04_team_season_performance.sql
│       ├── 05_player_scouting_features.sql
│       └── 06_analytics_validation.sql
├── src/
│   ├── api/                          # Sportmonks API client & rate limiting
│   ├── config/                       # Settings, environment, and constants
│   ├── database/                     # MySQL connection manager & migrations
│   ├── ingestion/                    # Raw API data extraction modules
│   ├── loaders/                      # Database loaders for core & player stats
│   └── transformation/               # Cleaning and data normalization utilities
├── tests/                            # Unit and integration test suite
├── .env                              # Environment configuration (ignored in git)
├── test_api.py                       # Sportmonks API test script
└── test_mysql.py                     # MySQL connection verification script
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Python 3.10+**
- **MySQL Server 8.0+**
- **Power BI Desktop** (to view/edit `.pbix`)
- **Sportmonks Football API Key**

### 2. Environment Configuration
Create a `.env` file in the project root:

```env
# Sportmonks API
SPORTMONKS_API_TOKEN=your_sportmonks_api_token

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=scoutiq
```

### 3. Verify Connections
Run the verification scripts:
```bash
python test_mysql.py
python test_api.py
```

### 4. Deploy Analytical Views
Execute the SQL scripts in [`sql/analytics/`](sql/analytics/) in numerical order against your MySQL database:
1. `01_player_match_summary.sql`
2. `02_player_season_performance.sql`
3. `03_player_per90_metrics.sql`
4. `04_team_season_performance.sql`
5. `05_player_scouting_features.sql`
6. `06_analytics_validation.sql`

### 5. Open the Power BI Dashboard
Launch [`ScoutIQ_Football_Analytics.pbix`](ScoutIQ_Football_Analytics.pbix) in **Power BI Desktop** to explore the interactive visual analytics.
