# ScoutIQ — Analytics Dictionary & Metrics Specification

## 1. Overview

The ScoutIQ Analytics Layer provides standardized, queryable SQL analytical views built directly upon the normalized MySQL tables. This layer powers recruitment search, squad profiling, player performance benchmarking, and tactical intelligence without modifying underlying core records.

---

## 2. Analytical Views Architecture

```text
                 fixtures / lineups / player_match_stats / stat_types
                                         |
                                         v
                         vw_player_match_summary (Match-level grain)
                                         |
                                         v
                      vw_player_season_performance (Season-level totals)
                                     /       \
                                    /         \
                                   v           v
            vw_player_per90_metrics           vw_player_scouting_features
            (Per-90 Normalization)             (Primary Feature Store)

            fixtures / fixture_scores / team_match_stats
                                         |
                                         v
                      vw_team_season_performance (Team-level totals & standings)
```

---

## 3. View Specifications

### 3.1 `vw_player_match_summary`
- **File:** [`sql/analytics/01_player_match_summary.sql`](file:///d:/ScoutIQ/sql/analytics/01_player_match_summary.sql)
- **Grain:** One row per player per fixture (`fixture_id`, `player_id`, `team_id`)
- **Source Tables:** `lineups`, `player_match_stats`, `stat_types`
- **Purpose:** Pivots granular EAV (Entity-Attribute-Value) match metrics into a wide, structured match summary record.

| Column | Type | Description / Extraction Logic |
|:---|:---|:---|
| `fixture_id` | BIGINT | Fixture identifier |
| `player_id` | BIGINT | Player identifier |
| `team_id` | BIGINT | Team representing in match |
| `minutes_played` | DECIMAL(12,4) | Minutes on pitch (`COALESCE(minutes-played, 0)`) |
| `rating` | DECIMAL(12,4) | Match performance rating (NULL if not rated/played) |
| `goals` | DECIMAL(12,4) | Total goals scored in match |
| `assists` | DECIMAL(12,4) | Total assists registered in match |
| `shots_total` | DECIMAL(12,4) | Total shots attempted |
| `shots_on_target` | DECIMAL(12,4) | Shots on target |
| `passes` | DECIMAL(12,4) | Total passes attempted |
| `accurate_passes` | DECIMAL(12,4) | Completed passes |
| `accurate_passes_percentage` | DECIMAL(12,4) | Official match pass completion percentage |
| `key_passes` | DECIMAL(12,4) | Passes directly leading to a shot |
| `successful_dribbles` | DECIMAL(12,4) | Completed dribbles/take-ons |
| `tackles` | DECIMAL(12,4) | Total tackles attempted |
| `tackles_won` | DECIMAL(12,4) | Tackles where possession was won |
| `interceptions` | DECIMAL(12,4) | Intercepted opposition passes |
| `clearances` | DECIMAL(12,4) | Defensive clearances |
| `duels_won` | DECIMAL(12,4) | Ground and aerial duels won |
| `duels_lost` | DECIMAL(12,4) | Ground and aerial duels lost |
| `touches` | DECIMAL(12,4) | Total ball touches |
| `possession_lost` | DECIMAL(12,4) | Times dispossessed or lost control |

---

### 3.2 `vw_player_season_performance`
- **File:** [`sql/analytics/02_player_season_performance.sql`](file:///d:/ScoutIQ/sql/analytics/02_player_season_performance.sql)
- **Grain:** One row per player per season and team (`player_id`, `season_id`, `team_id`)
- **Source Tables:** `vw_player_match_summary`, `fixtures`
- **Purpose:** Aggregates cumulative counting totals and calculates unweighted seasonal averages.

| Column | Type | Aggregation / Formula |
|:---|:---|:---|
| `appearances` | INT | `COUNT(CASE WHEN minutes_played > 0 THEN 1 END)` |
| `minutes_played` | DECIMAL | `SUM(minutes_played)` |
| `goals` | DECIMAL | `SUM(goals)` |
| `assists` | DECIMAL | `SUM(assists)` |
| `shots_total` | DECIMAL | `SUM(shots_total)` |
| `shots_on_target` | DECIMAL | `SUM(shots_on_target)` |
| `passes` | DECIMAL | `SUM(passes)` |
| `accurate_passes` | DECIMAL | `SUM(accurate_passes)` |
| `key_passes` | DECIMAL | `SUM(key_passes)` |
| `successful_dribbles` | DECIMAL | `SUM(successful_dribbles)` |
| `tackles` | DECIMAL | `SUM(tackles)` |
| `tackles_won` | DECIMAL | `SUM(tackles_won)` |
| `interceptions` | DECIMAL | `SUM(interceptions)` |
| `clearances` | DECIMAL | `SUM(clearances)` |
| `duels_won` | DECIMAL | `SUM(duels_won)` |
| `duels_lost` | DECIMAL | `SUM(duels_lost)` |
| `touches` | DECIMAL | `SUM(touches)` |
| `possession_lost` | DECIMAL | `SUM(possession_lost)` |
| `average_rating` | DECIMAL | `ROUND(AVG(rating), 2)` (ignoring unrated appearances) |

---

### 3.3 `vw_player_per90_metrics`
- **File:** [`sql/analytics/03_player_per90_metrics.sql`](file:///d:/ScoutIQ/sql/analytics/03_player_per90_metrics.sql)
- **Grain:** One row per player per season and team (`player_id`, `season_id`, `team_id`)
- **Source Tables:** `vw_player_season_performance`
- **Purpose:** Normalizes counting statistics across varying playing time to provide fair, per-90-minute comparisons.

#### Per-90 Calculation Standard
For any metric $M$ and total minutes played $T$:
$$\text{Metric per 90} = \begin{cases} \text{ROUND}\left(\frac{M}{T} \times 90.0, 2\right) & \text{if } T > 0 \\ \text{NULL} & \text{if } T = 0 \end{cases}$$

| Metric Column | Source Total | Per-90 Normalization Formula |
|:---|:---|:---|
| `goals_per90` | `goals` | `(goals / minutes_played) * 90.0` |
| `assists_per90` | `assists` | `(assists / minutes_played) * 90.0` |
| `shots_per90` | `shots_total` | `(shots_total / minutes_played) * 90.0` |
| `shots_on_target_per90` | `shots_on_target` | `(shots_on_target / minutes_played) * 90.0` |
| `key_passes_per90` | `key_passes` | `(key_passes / minutes_played) * 90.0` |
| `passes_per90` | `passes` | `(passes / minutes_played) * 90.0` |
| `accurate_passes_per90` | `accurate_passes` | `(accurate_passes / minutes_played) * 90.0` |
| `successful_dribbles_per90` | `successful_dribbles` | `(successful_dribbles / minutes_played) * 90.0` |
| `tackles_per90` | `tackles` | `(tackles / minutes_played) * 90.0` |
| `interceptions_per90` | `interceptions` | `(interceptions / minutes_played) * 90.0` |
| `clearances_per90` | `clearances` | `(clearances / minutes_played) * 90.0` |
| `duels_won_per90` | `duels_won` | `(duels_won / minutes_played) * 90.0` |
| `touches_per90` | `touches` | `(touches / minutes_played) * 90.0` |

---

### 3.4 `vw_team_season_performance`
- **File:** [`sql/analytics/04_team_season_performance.sql`](file:///d:/ScoutIQ/sql/analytics/04_team_season_performance.sql)
- **Grain:** One row per team per season (`team_id`, `season_id`)
- **Source Tables:** `fixtures`, `fixture_scores`, `team_match_stats`, `team_stat_types`
- **Purpose:** Generates comprehensive league table standings, win/draw/loss records, goal difference, possession averages, corners, and card tallies. Avoids home/away double counting by pivoting fixture perspectives.

| Column | Type | Computation |
|:---|:---|:---|
| `matches` | INT | Total fixtures played in season |
| `wins` | INT | Count where `goals_for > goals_against` |
| `draws` | INT | Count where `goals_for = goals_against` |
| `losses` | INT | Count where `goals_for < goals_against` |
| `goals_for` | INT | Total goals scored by team |
| `goals_against` | INT | Total goals conceded by team |
| `goal_difference` | INT | `goals_for - goals_against` |
| `average_possession` | DECIMAL(5,2) | `ROUND(AVG(ball-possession), 2)` |
| `corners` | INT | Total corner kicks won |
| `yellowcards` | INT | Total yellow cards received |
| `redcards` | INT | Total red cards received |

---

### 3.5 `vw_player_scouting_features`
- **File:** [`sql/analytics/05_player_scouting_features.sql`](file:///d:/ScoutIQ/sql/analytics/05_player_scouting_features.sql)
- **Grain:** One row per player per season and team
- **Source Tables:** `vw_player_season_performance`, `vw_player_per90_metrics`, `players`, `teams`
- **Purpose:** Main feature store for scouting, player filtering, archetype clustering, and radar/percentile comparisons.

#### Included Performance Percentages:
- **Pass Accuracy (%):**
  $$\text{pass\_accuracy\_percentage} = \frac{\text{accurate\_passes}}{\text{passes}} \times 100.0$$
- **Tackle Success (%):**
  $$\text{tackle\_success\_percentage} = \frac{\text{tackles\_won}}{\text{tackles}} \times 100.0$$
- **Duel Win (%):**
  $$\text{duel\_win\_percentage} = \frac{\text{duels\_won}}{\text{duels\_won} + \text{duels\_lost}} \times 100.0$$
- **Shot Accuracy (%):**
  $$\text{shot\_accuracy\_percentage} = \frac{\text{shots\_on\_target}}{\text{shots\_total}} \times 100.0$$

---

## 4. Known Data Limitations

1. **Competition Scope:**
   The current ScoutIQ database strictly represents the **Danish Superliga 2025/2026** season (Competition ID 271, Season ID 25536, 12 clubs, 192 fixtures). It does not claim to represent all global football leagues.
2. **xG (Expected Goals) Availability:**
   Expected goals data (`xgfixture`) is **NOT** available because the current Sportmonks subscription tier does not license the xG feature. No artificial or fabricated xG values have been substituted.
3. **Excluded Bench Placeholders:**
   Across the 192 raw fixture match reports, **15 lineup slots** contained youth or emergency reserve bench slots that possessed no Sportmonks `player_id`. These were omitted from normalized player data to maintain foreign key integrity and prevent duplicate null entries.
4. **No Arbitrary Composite Scores:**
   In adherence to principled sports data engineering, no arbitrary "overall FIFA-style score" or subjective player ranking has been added. All metrics reflect objective match events and per-90 rates.
