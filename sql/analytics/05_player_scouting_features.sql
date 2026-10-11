-- ====================================================================
-- ScoutIQ Analytical Layer: View 5
-- File: sql/analytics/05_player_scouting_features.sql
-- View: vw_player_scouting_features
-- Grain: One row per player per season (and team)
-- Description: Core analytical feature store for scouting, recruitment,
--              similarity analysis, and squad evaluation in ScoutIQ.
-- ====================================================================

CREATE OR REPLACE VIEW vw_player_scouting_features AS
SELECT
    sp.player_id,
    p.name AS player_name,
    sp.team_id,
    t.name AS team_name,
    sp.season_id,
    sp.minutes_played,
    sp.appearances,
    sp.average_rating AS rating,
    -- Per-90 Normalized Metrics
    p90.goals_per90,
    p90.assists_per90,
    p90.shots_per90,
    p90.key_passes_per90,
    p90.passes_per90,
    p90.accurate_passes_per90,
    p90.successful_dribbles_per90,
    p90.tackles_per90,
    p90.interceptions_per90,
    p90.clearances_per90,
    p90.duels_won_per90,
    p90.touches_per90,
    -- Performance & Efficiency Percentages (clamped to max 100.0% against provider tagging anomalies)
    CASE 
        WHEN sp.passes > 0 THEN LEAST(100.0, ROUND((sp.accurate_passes / sp.passes) * 100.0, 2))
        ELSE NULL 
    END AS pass_accuracy_percentage,
    CASE 
        WHEN sp.tackles > 0 THEN LEAST(100.0, ROUND((sp.tackles_won / sp.tackles) * 100.0, 2))
        ELSE NULL 
    END AS tackle_success_percentage,
    CASE 
        WHEN (sp.duels_won + sp.duels_lost) > 0 THEN LEAST(100.0, ROUND((sp.duels_won / (sp.duels_won + sp.duels_lost)) * 100.0, 2))
        ELSE NULL 
    END AS duel_win_percentage,
    CASE 
        WHEN sp.shots_total > 0 THEN LEAST(100.0, ROUND((sp.shots_on_target / sp.shots_total) * 100.0, 2))
        ELSE NULL 
    END AS shot_accuracy_percentage
FROM vw_player_season_performance sp
JOIN players p ON p.player_id = sp.player_id
JOIN teams t ON t.team_id = sp.team_id
LEFT JOIN vw_player_per90_metrics p90 
    ON p90.player_id = sp.player_id 
    AND p90.season_id = sp.season_id 
    AND p90.team_id = sp.team_id;
