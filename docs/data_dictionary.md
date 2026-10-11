# ScoutIQ — Data Dictionary

## 1. Purpose

This document defines the football data that ScoutIQ will ingest, store, transform, and analyze.

The current MVP is based on data successfully verified through the Sportmonks Football API.

---

# 2. Data Sources

| Source | Purpose | Status |
|---|---|---|
| Sportmonks Football API | Primary football data source | Active |
| Transfermarkt | Future market-value/reference data | Future |
| API-Football | Potential secondary source | Future |

---

# 3. Confirmed Sportmonks Coverage

The current API tests successfully confirmed:

- Football API authentication
- League access
- Historical season access
- Team access
- Season schedules
- Fixture records
- Match events
- Lineups
- Player-level fixture statistics
- Team-level match statistics

For the tested 2025/26 Superliga season:

- 12 teams were returned
- 192 fixtures were found

---

# 4. Player Master Data

| Field | Description | Type | Priority | Source |
|---|---|---|---|---|
| player_id | Unique identifier for a player | Integer | Critical | Sportmonks |
| player_name | Player's name | String | Critical | Sportmonks |
| team_id | Current/fixture team identifier | Integer | Critical | Sportmonks |
| position_id | Sportmonks position identifier | Integer | Critical | Sportmonks |
| jersey_number | Shirt number | Integer | Useful | Sportmonks |
| formation_position | Position in lineup/formation | Integer | Useful | Sportmonks |
| formation_field | Formation location | String | Useful | Sportmonks |
| player_image | Player image URL | String | Optional | Sportmonks |

---

# 5. Team Master Data

| Field | Description | Type | Priority | Source |
|---|---|---|---|---|
| team_id | Unique team identifier | Integer | Critical | Sportmonks |
| team_name | Official team name | String | Critical | Sportmonks |
| short_code | Team abbreviation | String | Useful | Sportmonks |
| venue_id | Home venue identifier | Integer | Optional | Sportmonks |
| league_id | Competition identifier | Integer | Critical | Sportmonks |
| season_id | Season identifier | Integer | Critical | Sportmonks |

---

# 6. Competition and Season Data

| Field | Description | Type | Priority | Source |
|---|---|---|---|---|
| league_id | Unique competition identifier | Integer | Critical | Sportmonks |
| league_name | Competition name | String | Critical | Sportmonks |
| season_id | Unique season identifier | Integer | Critical | Sportmonks |
| season_name | Season label such as 2025/2026 | String | Critical | Sportmonks |
| stage_id | Competition stage | Integer | Useful | Sportmonks |
| round_id | Competition round | Integer | Useful | Sportmonks |

---

# 7. Match / Fixture Data

| Field | Description | Type | Priority | Source |
|---|---|---|---|---|
| fixture_id | Unique match identifier | Integer | Critical | Sportmonks |
| starting_at | Match start date/time | Datetime | Critical | Sportmonks |
| home_team_id | Home team identifier | Integer | Critical | Sportmonks |
| away_team_id | Away team identifier | Integer | Critical | Sportmonks |
| home_score | Final/home score | Integer | Critical | Sportmonks |
| away_score | Final/away score | Integer | Critical | Sportmonks |
| stage | Competition stage | String | Useful | Sportmonks |
| round | Competition round | Integer | Useful | Sportmonks |

---

# 8. Match Events

Match events will be stored separately from player statistics.

Potential event categories include:

- Goals
- Cards
- Substitutions
- Other recorded fixture events

| Field | Description | Type | Priority |
|---|---|---|---|
| event_id | Unique event identifier | Integer | Critical |
| fixture_id | Match containing the event | Integer | Critical |
| player_id | Player associated with event where applicable | Integer | Useful |
| team_id | Team associated with event | Integer | Useful |
| event_type | Type of event | String | Critical |
| minute | Match minute | Integer | Critical |
| extra_minute | Additional time | Integer | Useful |

---

# 9. Player Match Statistics

The current Sportmonks test returned 62 unique statistic types.

## 9.1 Core Performance Metrics

| Code | Metric |
|---|---|
| minutes-played | Minutes Played |
| cumulative-minutes-played | Cumulative Minutes Played |
| goals | Goals |
| assists | Assists |
| rating | Rating |
| shots-total | Shots Total |
| shots-on-target | Shots On Target |
| shots-off-target | Shots Off Target |
| key-passes | Key Passes |
| big-chances-created | Big Chances Created |
| big-chances-missed | Big Chances Missed |
| offsides | Offsides |

---

## 9.2 Passing Metrics

| Code | Metric |
|---|---|
| passes | Passes |
| accurate-passes | Accurate Passes |
| accurate-passes-percentage | Accurate Passes Percentage |
| backward-passes | Backward Passes |
| passes-in-final-third | Passes In Final Third |
| long-balls | Long Balls |
| long-balls-won | Long Balls Won |
| long-balls-won-percentage | Long Balls Won Percentage |
| accurate-crosses | Accurate Crosses |
| total-crosses | Total Crosses |
| successful-crosses-percentage | Successful Crosses Percentage |

---

## 9.3 Dribbling and Ball Progression

| Code | Metric |
|---|---|
| dribble-attempts | Dribble Attempts |
| successful-dribbles | Successful Dribbles |
| dribbled-past | Dribbled Past |
| dispossessed | Dispossessed |
| touches | Touches |
| possession-lost | Possession Lost |

---

## 9.4 Defensive Metrics

| Code | Metric |
|---|---|
| tackles | Tackles |
| tackles-won | Tackles Won |
| tackles-won-percentage | Tackles Won Percentage |
| interceptions | Interceptions |
| clearances | Clearances |
| clearance-offline | Clearance Offline |
| blocked-shots | Blocked Shots |
| duels-won | Duels Won |
| duels-lost | Duels Lost |
| duels-won-percentage | Duels Won Percentage |
| total-duels | Total Duels |
| aerials | Aerials |
| aeriels-won | Aerials Won |
| aeriels-lost | Aerials Lost |
| aerials-won-percentage | Aerials Won Percentage |
| last-man-tackle | Last Man Tackle |
| ball-recovery | Ball Recovery |

---

## 9.5 Discipline and Errors

| Code | Metric |
|---|---|
| yellowcards | Yellowcards |
| fouls | Fouls |
| fouls-drawn | Fouls Drawn |
| penalties-committed | Penalties Committed |
| error-lead-to-goal | Error Lead To Goal |
| error-lead-to-shot | Error Lead To Shot |

---

## 9.6 Goalkeeper Metrics

| Code | Metric |
|---|---|
| saves | Saves |
| saves-insidebox | Saves Insidebox |
| goalkeeper-goals-conceded | Goalkeeper Goals Conceded |
| goals-conceded | Goals Conceded |
| good-high-claim | Good High Claim |
| punches | Punches |

---

## 9.7 Penalty Metrics

| Code | Metric |
|---|---|
| penalties-scored | Penalties Scored |
| penalties-won | Penalties Won |
| penalties-committed | Penalties Committed |

---

## 9.8 Lineup / Context Fields

| Code | Metric |
|---|---|
| captain | Captain |

These are contextual/categorical fields rather than normal performance metrics.

---

# 10. Team Match Statistics

The tested fixture returned:

| Code | Metric | Priority |
|---|---|---|
| goals | Goals | Critical |
| assists | Assists | Useful |
| corners | Corners | Useful |
| ball-possession | Ball Possession % | Critical |
| yellowcards | Yellowcards | Useful |
| successful-dribbles-percentage | Successful Dribbles Percentage | Useful |

---

# 11. Derived Analytics Fields

These fields will be calculated internally by ScoutIQ.

| Derived Field | Calculation / Purpose |
|---|---|
| goals_per_90 | Goals / 90-minute blocks |
| assists_per_90 | Assists / 90-minute blocks |
| shots_per_90 | Shots / 90-minute blocks |
| shots_on_target_per_90 | Shots on target / 90-minute blocks |
| key_passes_per_90 | Key passes / 90-minute blocks |
| tackles_per_90 | Tackles / 90-minute blocks |
| interceptions_per_90 | Interceptions / 90-minute blocks |
| clearances_per_90 | Clearances / 90-minute blocks |
| duels_won_per_90 | Duels won / 90-minute blocks |
| successful_dribbles_per_90 | Successful dribbles / 90-minute blocks |
| possession_lost_per_90 | Possession lost / 90-minute blocks |
| attacking_score | Position-specific attacking metric combination |
| defensive_score | Position-specific defensive metric combination |
| passing_score | Passing metric combination |
| overall_performance_score | ScoutIQ composite performance score |
| percentile_rank | Position-relative percentile |
| player_similarity_score | Similarity to another player |
| tactical_fit_score | Compatibility with club playing style |
| predicted_market_value | ML-generated valuation estimate |
| valuation_gap | Predicted value minus reference value |
| recruitment_risk_score | ML-derived recruitment risk indicator |

---

# 12. Advanced / Future Data

The following are NOT dependencies for the first MVP.

| Data | Status |
|---|---|
| Expected Goals (xG) | Not available through current tested Sportmonks xgfixture access |
| Expected Possession Value (EPV) | Future / advanced |
| Optical tracking coordinates | Future / proprietary |
| Player wages | Future |
| Detailed injury history | Future |
| Transfer rumours | Future |
| Expected lineups | Future |
| Advanced physical tracking | Future |

---

# 13. ScoutIQ MVP Data Priority

## Tier 1 — Mandatory

- player_id
- player_name
- team_id
- position_id
- league_id
- season_id
- fixture_id
- starting_at
- home_team_id
- away_team_id
- home_score
- away_score
- minutes-played
- goals
- assists
- rating
- passes
- accurate-passes
- accurate-passes-percentage
- shots-total
- shots-on-target
- key-passes
- tackles
- interceptions
- clearances
- duels-won
- duels-lost
- touches
- possession-lost

## Tier 2 — Important

- successful-dribbles
- dribble-attempts
- big-chances-created
- big-chances-missed
- aerials-won
- aerials-lost
- tackles-won
- ball-recovery
- long-balls
- passes-in-final-third
- fouls
- fouls-drawn
- yellowcards
- blocked-shots

## Tier 3 — Position Specific

Goalkeeper:
- saves
- saves-insidebox
- goalkeeper-goals-conceded
- good-high-claim
- punches

Defender:
- clearances
- interceptions
- tackles
- aerials-won
- last-man-tackle

Midfielder:
- passes
- accurate-passes
- key-passes
- passes-in-final-third
- ball-recovery
- tackles
- interceptions

Forward:
- goals
- assists
- shots-total
- shots-on-target
- big-chances-created
- successful-dribbles

---

# 14. Data Quality Rules

ScoutIQ must validate:

- IDs must not be null
- Minutes must be >= 0
- Goals must be >= 0
- Assists must be >= 0
- Shots must be >= 0
- Percentages must be between 0 and 100
- Duplicate fixture IDs must be rejected
- Duplicate player/fixture records must be rejected
- Team IDs must match known teams
- Season IDs must match known seasons

---

# 15. Current Data Strategy

ScoutIQ will initially use Sportmonks as the primary football data source.

Advanced metrics that are unavailable on the current plan will remain optional modules and will not block the MVP.

The MVP will first focus on:

1. Player performance analytics
2. Team analytics
3. Player comparison
4. Player similarity
5. Player archetypes
6. Recruitment search
7. Tactical-fit scoring
8. ML-based valuation experimentation
9. AI-assisted scouting explanations