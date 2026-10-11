-- ====================================================================
-- ScoutIQ Analytical Layer: View 1
-- File: sql/analytics/01_player_match_summary.sql
-- View: vw_player_match_summary
-- Grain: One row per player per fixture
-- Description: Aggregates individual match-level player statistics into
--              a clean, wide summary record per fixture appearance.
-- ====================================================================

CREATE OR REPLACE VIEW vw_player_match_summary AS
SELECT
    l.fixture_id,
    l.player_id,
    l.team_id,
    COALESCE(MAX(CASE WHEN st.code = 'minutes-played' THEN pms.numeric_value END), 0) AS minutes_played,
    MAX(CASE WHEN st.code = 'rating' THEN pms.numeric_value END) AS rating,
    COALESCE(MAX(CASE WHEN st.code = 'goals' THEN pms.numeric_value END), 0) AS goals,
    COALESCE(MAX(CASE WHEN st.code = 'assists' THEN pms.numeric_value END), 0) AS assists,
    COALESCE(MAX(CASE WHEN st.code = 'shots-total' THEN pms.numeric_value END), 0) AS shots_total,
    COALESCE(MAX(CASE WHEN st.code = 'shots-on-target' THEN pms.numeric_value END), 0) AS shots_on_target,
    COALESCE(MAX(CASE WHEN st.code = 'passes' THEN pms.numeric_value END), 0) AS passes,
    COALESCE(MAX(CASE WHEN st.code = 'accurate-passes' THEN pms.numeric_value END), 0) AS accurate_passes,
    MAX(CASE WHEN st.code = 'accurate-passes-percentage' THEN pms.numeric_value END) AS accurate_passes_percentage,
    COALESCE(MAX(CASE WHEN st.code = 'key-passes' THEN pms.numeric_value END), 0) AS key_passes,
    COALESCE(MAX(CASE WHEN st.code = 'successful-dribbles' THEN pms.numeric_value END), 0) AS successful_dribbles,
    COALESCE(MAX(CASE WHEN st.code = 'tackles' THEN pms.numeric_value END), 0) AS tackles,
    COALESCE(MAX(CASE WHEN st.code = 'tackles-won' THEN pms.numeric_value END), 0) AS tackles_won,
    COALESCE(MAX(CASE WHEN st.code = 'interceptions' THEN pms.numeric_value END), 0) AS interceptions,
    COALESCE(MAX(CASE WHEN st.code = 'clearances' THEN pms.numeric_value END), 0) AS clearances,
    COALESCE(MAX(CASE WHEN st.code = 'duels-won' THEN pms.numeric_value END), 0) AS duels_won,
    COALESCE(MAX(CASE WHEN st.code = 'duels-lost' THEN pms.numeric_value END), 0) AS duels_lost,
    COALESCE(MAX(CASE WHEN st.code = 'touches' THEN pms.numeric_value END), 0) AS touches,
    COALESCE(MAX(CASE WHEN st.code = 'possession-lost' THEN pms.numeric_value END), 0) AS possession_lost
FROM lineups l
LEFT JOIN player_match_stats pms 
    ON pms.fixture_id = l.fixture_id 
    AND pms.player_id = l.player_id 
    AND pms.team_id = l.team_id
LEFT JOIN stat_types st 
    ON st.stat_type_id = pms.stat_type_id
GROUP BY
    l.fixture_id,
    l.player_id,
    l.team_id;
