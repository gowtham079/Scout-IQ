-- ====================================================================
-- ScoutIQ Analytical Layer: View 2
-- File: sql/analytics/02_player_season_performance.sql
-- View: vw_player_season_performance
-- Grain: One row per player per season (and team)
-- Description: Aggregates match summary data to seasonal totals and
--              averages for each player.
-- ====================================================================

CREATE OR REPLACE VIEW vw_player_season_performance AS
SELECT
    m.player_id,
    f.season_id,
    m.team_id,
    COUNT(CASE WHEN m.minutes_played > 0 THEN 1 END) AS appearances,
    SUM(m.minutes_played) AS minutes_played,
    SUM(m.goals) AS goals,
    SUM(m.assists) AS assists,
    SUM(m.shots_total) AS shots_total,
    SUM(m.shots_on_target) AS shots_on_target,
    SUM(m.passes) AS passes,
    SUM(m.accurate_passes) AS accurate_passes,
    SUM(m.key_passes) AS key_passes,
    SUM(m.successful_dribbles) AS successful_dribbles,
    SUM(m.tackles) AS tackles,
    SUM(m.tackles_won) AS tackles_won,
    SUM(m.interceptions) AS interceptions,
    SUM(m.clearances) AS clearances,
    SUM(m.duels_won) AS duels_won,
    SUM(m.duels_lost) AS duels_lost,
    SUM(m.touches) AS touches,
    SUM(m.possession_lost) AS possession_lost,
    ROUND(AVG(m.rating), 2) AS average_rating
FROM vw_player_match_summary m
JOIN fixtures f ON f.fixture_id = m.fixture_id
GROUP BY
    m.player_id,
    f.season_id,
    m.team_id;
