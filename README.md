# ⚽ ScoutIQ — Football Analytics & Recruitment Intelligence

**An end-to-end football analytics platform for player scouting, performance analysis, and data-driven recruitment.**

ScoutIQ transforms football match data into actionable insights using Python, SQL, MySQL, and Power BI. It combines data ingestion, transformation, database management, analytical SQL views, and interactive dashboards to explore player performance and team statistics.

---

## 📌 Project Overview

Football recruitment requires more than comparing goals and assists. Scouts need to evaluate player contributions, playing time, passing efficiency, defensive actions, and team performance.

ScoutIQ addresses this challenge by building a data pipeline that collects football data through the Sportmonks Football API, stores structured data in MySQL, calculates analytical metrics using SQL, and presents insights through Power BI dashboards.

### Project Scope

- **Competition:** Danish Superliga
- **Season:** 2025/2026
- **Matches processed:** 192
- **Teams:** 12
- **Players:** 412 unique players
- **Player match statistics:** Approximately 154,739 records
- **Statistic types:** 69

*Figures reflect the collected dataset and project validation results.*

---

## 🎯 Project Objectives

- Build an end-to-end football data analytics pipeline.
- Automate football data collection through a REST API.
- Clean, transform, and organize data for analysis.
- Store relational football data in MySQL.
- Develop reusable SQL views for player and team performance.
- Calculate player performance metrics, including per-90 statistics.
- Build interactive Power BI dashboards for scouting and performance analysis.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Python | Data ingestion, transformation, and pipeline automation |
| Pandas & NumPy | Data analysis and manipulation |
| Sportmonks Football API | Football match, player, team, and statistical data |
| MySQL | Relational database and data storage |
| SQL | Analytical queries, metrics, and validation |
| Power BI | Interactive dashboards and visual analytics |
| Git & GitHub | Version control and project management |

---

## 🏗️ Data Pipeline Architecture

```text
Sportmonks Football API
          |
          v
Python Data Ingestion
          |
          v
Raw JSON Data
          |
          v
Data Cleaning & Transformation
          |
          v
MySQL Database
          |
          v
SQL Analytical Views
          |
          v
Power BI Dashboards
          |
          v
Player Scouting & Team Performance Insights
```

### Pipeline Stages

**1. Data Ingestion**

Collected football data from the Sportmonks Football API using Python and HTTP requests.

**2. Data Transformation**

Processed and cleaned football data to prepare structured records for database loading and analysis.

**3. Database Loading**

Designed a relational MySQL database to store competitions, seasons, teams, fixtures, players, lineups, match events, and statistical records.

**4. SQL Analytics**

Created analytical views to summarize player match performance, season statistics, per-90 metrics, team performance, and scouting features.

**5. Data Visualization**

Connected the MySQL analytical views to Power BI to develop interactive dashboards for exploring player and team performance.

---

## 📊 Power BI Dashboards

ScoutIQ includes three dashboard pages.

### 1. ScoutIQ Overview

Provides a high-level summary of player and team performance.

**Key insights:**
- Total goals and assists
- Number of players analyzed
- Average player rating
- Top players by goals per 90 minutes
- Goals scored versus goals conceded by team

### 2. Player Scouting

Enables comparison of player performance using statistical indicators.

**Metrics include:**
- Minutes played
- Player ratings
- Goals and assists per 90 minutes
- Passes per 90 minutes
- Pass accuracy
- Tackles per 90 minutes
- Duel-win percentage

Player and playing-time filters support more focused comparisons.

### 3. Team Performance

Analyzes team-level performance across the competition.

**Metrics include:**
- Goals scored and conceded
- Wins, draws, and losses
- Goal difference
- Average possession
- League standings and points

---

## 🖼️ Dashboard Screenshots

Screenshots are available in the [`Dashboard Images`](./Dashboard%20Images/) folder.

### ScoutIQ Overview

![ScoutIQ Overview](./Dashboard%20Images/Screenshot%202026-10-11%20130426.png)

### Player Scouting

![Player Scouting](./Dashboard%20Images/Screenshot%202026-10-11%20130502.png)

### Team Performance

![Team Performance](./Dashboard%20Images/Screenshot%202026-10-11%20130517.png)

---

## 🗄️ Database & SQL Analytics

The project uses MySQL to store and organize football data in relational tables.

### Core Data Entities

- Competitions and seasons
- Teams and team-season participation
- Fixtures and fixture scores
- Players and lineups
- Player match statistics
- Match events
- Team match statistics
- Statistical type definitions

### Analytical SQL Views

| SQL File | Purpose |
|---|---|
| `01_player_match_summary.sql` | Player performance at match level |
| `02_player_season_performance.sql` | Aggregated player-season performance |
| `03_player_per90_metrics.sql` | Normalized performance metrics |
| `04_team_season_performance.sql` | Team-season performance analysis |
| `05_player_scouting_features.sql` | Features for player comparison and scouting |
| `06_analytics_validation.sql` | Data-quality validation checks |

Additional named views provide player and team names for Power BI reporting.

---

## ✅ Data Quality & Validation

Validation checks were implemented to improve analytical reliability.

Checks include:

- Duplicate player-season records
- Negative playing-time values
- Impossible percentage values
- Missing player or fixture references
- Missing team references in team statistics
- Duplicate scouting-feature records
- Fixtures without associated player data

The validation results were used to identify data-quality issues before analysis.

---

## 📁 Project Structure

```text
ScoutIQ/
│
├── Dashboard Images/
│   └── Power BI dashboard screenshots
│
├── data/
│   ├── raw/
│   └── processed/
│
├── docs/
│   ├── analytics_dictionary.md
│   ├── data_dictionary.md
│   ├── database_schema.md
│   ├── player_data_profile.md
│   └── raw_data_profile.md
│
├── sql/
│   └── analytics/
│       ├── 01_player_match_summary.sql
│       ├── 02_player_season_performance.sql
│       ├── 03_player_per90_metrics.sql
│       ├── 04_team_season_performance.sql
│       ├── 05_player_scouting_features.sql
│       └── 06_analytics_validation.sql
│
├── src/
│   ├── analytics/
│   ├── api/
│   ├── config/
│   ├── database/
│   ├── ingestion/
│   ├── loaders/
│   └── transformation/
│
├── ScoutIQ_Football_Analytics.pbix
├── test_api.py
├── test_mysql.py
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Install the following:

- Python
- MySQL Server
- Power BI Desktop
- A Sportmonks Football API account and suitable API access

### 1. Clone the Repository

```bash
git clone https://github.com/gowtham079/Scout-IQ.git
cd Scout-IQ
```

### 2. Create a Virtual Environment

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Install Dependencies

Install the Python packages required by the project. If a `requirements.txt` file is added to the repository, use:

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a local `.env` file and configure the API token and database connection settings required by the project.

**Never commit your `.env` file, API tokens, or database passwords to GitHub.**

### 5. Configure MySQL

Create the `scoutiq` database, configure your local database connection, and prepare the required tables before running the ingestion and loading scripts.

Refer to the database schema documentation in `docs/`.

### 6. Run the Pipeline

Run the ingestion, transformation, and loading scripts according to their configuration and dependencies.

The `src/` directory contains the project pipeline code.

### 7. Open the Power BI Dashboard

Open `ScoutIQ_Football_Analytics.pbix` in Power BI Desktop and configure the MySQL connection for your local environment.

**Note:** The generated JSON datasets are excluded from version control. Recreate the required data using the ingestion pipeline and your available API access.

---

## 📚 Documentation

Additional technical documentation is available in the [`docs`](./docs/) directory.

- **Data Dictionary:** Definitions of data fields and their meanings.
- **Database Schema:** Database tables and relationships.
- **Player Data Profile:** Overview of player data and its characteristics.
- **Raw Data Profile:** Profiling of the collected source data.
- **Analytics Dictionary:** Definitions of analytical metrics and views.

---

## 🔍 Limitations

- The current analysis covers one competition and one season.
- Data availability depends on the Sportmonks API subscription and the statistics provided by the source.
- Expected goals (xG) analysis is not included because the required API access was unavailable.
- Player comparisons should account for playing time, role, and team context.
- The project is an analytical portfolio application, not a production recruitment system.

---

## 👨‍💻 Author

**Gowtham S**

MCA Student | Aspiring Data Analyst

**Skills demonstrated:** Python, SQL, MySQL, REST APIs, ETL Pipelines, Data Cleaning, Data Modeling, Data Validation, Power BI, and Data Visualization.

---

## ⭐ Project Goal

ScoutIQ demonstrates how football data can be transformed into structured analytical insights to support player evaluation, team performance analysis, and data-driven scouting decisions.