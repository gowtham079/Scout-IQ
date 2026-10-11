-- ====================================================================
-- ScoutIQ Analytical Layer: View 3
-- File: sql/analytics/03_player_per90_metrics.sql
-- View: vw_player_per90_metrics
-- Grain: One row per player per season (and team)
-- Description: Standardizes player counting metrics to a 90-minute
--              normalized baseline. Protects against zero-minute divisions.
-- ====================================================================

CREATE OR REPLACE VIEW vw_player_per90_metrics AS
SELECT
    player_id,
    season_id,
    team_id,
    minutes_played,
    CASE 
        WHEN minutes_played > 0 THEN ROUND((goals / minutes_played) * 90.0, 2)
        ELSE NULL 
    END AS goals_per90,
    CASE 
        WHEN minutes_played > 0 THEN ROUND((assists / minutes_played) * 90.0, 2)
        ELSE NULL 
    END AS assists_per90,
    CASE 
        WHEN minutes_played > 0 THEN ROUND((shots_total / minutes_played) * 90.0, 2)
        ELSE NULL 
    END AS shots_per90,
    CASE 
        WHEN minutes_played > 0 THEN ROUND((shots_on_target / minutes_played) * 90.0, 2)
        ELSE NULL 
    END AS shots_on_target_per90,
    CASE 
        WHEN minutes_played > 0 THEN ROUND((key_passes / minutes_played) * 90.0, 2)
        ELSE NULL 
    END AS key_passes_per90,
    CASE 
        WHEN minutes_played > 0 THEN ROUND((passes / minutes_played) * 90.0, 2)
        ELSE NULL 
    END AS passes_per90,
    CASE 
        WHEN minutes_played > 0 THEN ROUND((accurate_passes / minutes_played) * 90.0, 2)
        ELSE NULL 
    END AS accurate_passes_per90,
    CASE 
        WHEN minutes_played > 0 THEN ROUND((successful_dribbles / minutes_played) * 90.0, 2)
        ELSE NULL 
    END AS successful_dribbles_per90,
    CASE 
        WHEN minutes_played > 0 THEN ROUND((tackles / minutes_played) * 90.0, 2)
        ELSE NULL 
    END AS tackles_per90,
    CASE 
        WHEN minutes_played > 0 THEN ROUND((interceptions / minutes_played) * 90.0, 2)
        ELSE NULL 
    END AS interceptions_per90,
    CASE 
        WHEN minutes_played > 0 THEN ROUND((clearances / minutes_played) * 90.0, 2)
        ELSE NULL 
    END AS clearances_per90,
    CASE 
        WHEN minutes_played > 0 THEN ROUND((duels_won / minutes_played) * 90.0, 2)
        ELSE NULL 
    END AS duels_won_per90,
    CASE 
        WHEN minutes_played > 0 THEN ROUND((touches / minutes_played) * 90.0, 2)
        ELSE NULL 
    END AS touches_per90
FROM vw_player_season_performance;
