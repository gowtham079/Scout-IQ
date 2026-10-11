# ScoutIQ — Football Analytics & Recruitment

ScoutIQ is a football analytics and scouting platform built to analyze player performance, team statistics, and recruitment metrics.

## Tech Stack

- Python
- Pandas and NumPy
- Sportmonks Football API
- MySQL
- SQL
- Power BI

## Project Features

- Football data ingestion using a REST API
- Data cleaning and transformation
- MySQL database and ETL pipeline
- SQL analytics views for player and team performance
- Player scouting metrics and per-90 statistics
- Interactive Power BI dashboards
- Team performance and league standings analysis

## Repository Structure

- `src/` — Python ingestion, transformation, and loading code
- `sql/` — SQL analytics and validation queries
- `docs/` — Data dictionary, schema, and profiling documentation
- `Dashboard Images/` — Power BI dashboard screenshots
- `ScoutIQ_Football_Analytics.pbix` — Power BI dashboard

## Data Scope

The project analyzes the 2025/2026 Danish Superliga season using data collected through the Sportmonks Football API.

Generated JSON datasets and environment secrets are excluded from version control.

## Setup

1. Clone this repository.
2. Create and activate a Python virtual environment.
3. Install the required Python packages.
4. Configure your local `.env` file with your Sportmonks API token and database settings.
5. Run the ingestion, loading, and analytics scripts as required.

Never commit API tokens or database passwords.