-- ====================================================================
-- ScoutIQ Analytical Layer: Data Quality Validation
-- File: sql/analytics/06_analytics_validation.sql
-- Description: Diagnostic queries to verify integrity, constraints,
--              sensibility, and absence of anomalies in analytical views.
-- ====================================================================

-- 1. Check for duplicate player-season records in performance view
SELECT 
    '1. Duplicate player-season records' AS check_name,
    player_id, 
    season_id, 
    team_id, 
    COUNT(*) AS duplicate_count
FROM vw_player_season_performance
GROUP BY player_id, season_id, team_id
HAVING COUNT(*) > 1;

-- 2. Check for players with zero minutes played across the season
SELECT 
    '2. Players with zero minutes' AS check_name,
    player_id, 
    season_id, 
    team_id, 
    appearances, 
    minutes_played
FROM vw_player_season_performance
WHERE minutes_played = 0;

-- 3. Check for invalid negative minutes
SELECT 
    '3. Players with negative minutes' AS check_name,
    player_id, 
    season_id, 
    team_id, 
    minutes_played
FROM vw_player_season_performance
WHERE minutes_played < 0;

-- 4. Check for impossible percentage values (< 0% or > 100%)
SELECT 
    '4. Impossible percentage values' AS check_name,
    player_id,
    player_name,
    pass_accuracy_percentage,
    tackle_success_percentage,
    duel_win_percentage,
    shot_accuracy_percentage
FROM vw_player_scouting_features
WHERE pass_accuracy_percentage > 100 OR pass_accuracy_percentage < 0
   OR tackle_success_percentage > 100 OR tackle_success_percentage < 0
   OR duel_win_percentage > 100 OR duel_win_percentage < 0
   OR shot_accuracy_percentage > 100 OR shot_accuracy_percentage < 0;

-- 5. Check for fixtures without any lineup/player data
SELECT 
    '5. Fixtures without player data' AS check_name,
    f.fixture_id, 
    f.starting_at, 
    f.stage_name
FROM fixtures f
LEFT JOIN lineups l ON l.fixture_id = f.fixture_id
WHERE l.fixture_id IS NULL;

-- 6. Check for player statistics referencing missing players
SELECT 
    '6. Stats referencing missing players' AS check_name,
    pms.player_stat_id, 
    pms.player_id
FROM player_match_stats pms
LEFT JOIN players p ON p.player_id = pms.player_id
WHERE p.player_id IS NULL;

-- 7. Check for player statistics referencing missing fixtures
SELECT 
    '7. Stats referencing missing fixtures' AS check_name,
    pms.player_stat_id, 
    pms.fixture_id
FROM player_match_stats pms
LEFT JOIN fixtures f ON f.fixture_id = pms.fixture_id
WHERE f.fixture_id IS NULL;

-- 8. Check for team statistics referencing missing teams
SELECT 
    '8. Team stats referencing missing teams' AS check_name,
    tms.team_stat_id, 
    tms.team_id
FROM team_match_stats tms
LEFT JOIN teams t ON t.team_id = tms.team_id
WHERE t.team_id IS NULL;

-- 9. Check for duplicate analytical records in main scouting view
SELECT 
    '9. Duplicate scouting features records' AS check_name,
    player_id, 
    season_id, 
    team_id, 
    COUNT(*) AS duplicate_count
FROM vw_player_scouting_features
GROUP BY player_id, season_id, team_id
HAVING COUNT(*) > 1;
