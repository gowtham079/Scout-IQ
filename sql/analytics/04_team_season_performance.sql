-- ====================================================================
-- ScoutIQ Analytical Layer: View 4
-- File: sql/analytics/04_team_season_performance.sql
-- View: vw_team_season_performance
-- Grain: One row per team per season
-- Description: Aggregates team match results (wins, draws, losses, GD)
--              and match-level team metrics (possession, corners, cards)
--              without double-counting home and away appearances.
-- ====================================================================

CREATE OR REPLACE VIEW vw_team_season_performance AS
WITH team_fixtures AS (
    -- Home team fixtures
    SELECT 
        f.fixture_id,
        f.season_id,
        f.home_team_id AS team_id,
        f.away_team_id AS opponent_id,
        h_score.goals AS goals_for,
        a_score.goals AS goals_against
    FROM fixtures f
    JOIN fixture_scores h_score 
        ON h_score.fixture_id = f.fixture_id 
        AND h_score.team_id = f.home_team_id 
        AND h_score.score_type = 'CURRENT'
    JOIN fixture_scores a_score 
        ON a_score.fixture_id = f.fixture_id 
        AND a_score.team_id = f.away_team_id 
        AND a_score.score_type = 'CURRENT'
    UNION ALL
    -- Away team fixtures
    SELECT 
        f.fixture_id,
        f.season_id,
        f.away_team_id AS team_id,
        f.home_team_id AS opponent_id,
        a_score.goals AS goals_for,
        h_score.goals AS goals_against
    FROM fixtures f
    JOIN fixture_scores h_score 
        ON h_score.fixture_id = f.fixture_id 
        AND h_score.team_id = f.home_team_id 
        AND h_score.score_type = 'CURRENT'
    JOIN fixture_scores a_score 
        ON a_score.fixture_id = f.fixture_id 
        AND a_score.team_id = f.away_team_id 
        AND a_score.score_type = 'CURRENT'
),
team_fixture_stats AS (
    SELECT
        tms.fixture_id,
        tms.team_id,
        MAX(CASE WHEN tst.code = 'ball-possession' THEN tms.numeric_value END) AS possession,
        SUM(CASE WHEN tst.code = 'corners' THEN tms.numeric_value ELSE 0 END) AS corners,
        SUM(CASE WHEN tst.code = 'yellowcards' THEN tms.numeric_value ELSE 0 END) AS yellowcards,
        SUM(CASE WHEN tst.code = 'redcards' THEN tms.numeric_value ELSE 0 END) AS redcards
    FROM team_match_stats tms
    JOIN team_stat_types tst ON tst.team_stat_type_id = tms.team_stat_type_id
    GROUP BY tms.fixture_id, tms.team_id
)
SELECT
    tf.team_id,
    tf.season_id,
    COUNT(tf.fixture_id) AS matches,
    SUM(CASE WHEN tf.goals_for > tf.goals_against THEN 1 ELSE 0 END) AS wins,
    SUM(CASE WHEN tf.goals_for = tf.goals_against THEN 1 ELSE 0 END) AS draws,
    SUM(CASE WHEN tf.goals_for < tf.goals_against THEN 1 ELSE 0 END) AS losses,
    SUM(tf.goals_for) AS goals_for,
    SUM(tf.goals_against) AS goals_against,
    SUM(tf.goals_for) - SUM(tf.goals_against) AS goal_difference,
    ROUND(AVG(tfs.possession), 2) AS average_possession,
    COALESCE(SUM(tfs.corners), 0) AS corners,
    COALESCE(SUM(tfs.yellowcards), 0) AS yellowcards,
    COALESCE(SUM(tfs.redcards), 0) AS redcards
FROM team_fixtures tf
LEFT JOIN team_fixture_stats tfs 
    ON tfs.fixture_id = tf.fixture_id 
    AND tfs.team_id = tf.team_id
GROUP BY
    tf.team_id,
    tf.season_id;
