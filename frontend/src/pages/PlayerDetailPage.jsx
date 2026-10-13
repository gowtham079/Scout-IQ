import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  ArrowLeft,
  GitCompare,
  Percent,
  TrendingUp,
  BookmarkPlus,
  Check,
} from 'lucide-react';
import { useShortlist } from '../context/ShortlistContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

function MetricTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--color-bg-surface-elevated)',
        border: '1px solid var(--border-color-pixel)',
        padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.8)',
      }}>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--color-primary)', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
          Rate / 90: <span style={{ color: 'var(--color-secondary)' }}>{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function PlayerDetailPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPlayer = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPlayerDetail(id);
      setPlayer(res);
    } catch (err) {
      if (err.status === 404 || err.message?.includes('404')) {
        setError(`Player #${id} was not found in the Danish Superliga scouting database.`);
      } else {
        setError(err.message || 'Failed to retrieve player profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayer();
  }, [id]);

  // Prepare chart data for per-90 metrics if available
  const per90ChartData = player?.per90_metrics ? [
    { metric: 'Goals/90', value: player.per90_metrics.goals_per90 },
    { metric: 'Assists/90', value: player.per90_metrics.assists_per90 },
    { metric: 'Shots/90', value: player.per90_metrics.shots_per90 },
    { metric: 'KeyPass/90', value: player.per90_metrics.key_passes_per90 },
    { metric: 'Dribbles/90', value: player.per90_metrics.successful_dribbles_per90 },
    { metric: 'Tackles/90', value: player.per90_metrics.tackles_per90 },
    { metric: 'Intercept/90', value: player.per90_metrics.interceptions_per90 },
    { metric: 'Clears/90', value: player.per90_metrics.clearances_per90 },
    { metric: 'DuelsWon/90', value: player.per90_metrics.duels_won_per90 },
  ] : [];

  const { isShortlisted, toggleShortlist } = useShortlist();
  const shortlisted = player ? isShortlisted(player.player_id) : false;

  return (
    <div>
      {/* Top Navigation Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <Link
          to="/players"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--color-secondary)',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> BACK TO PLAYER DIRECTORY
        </Link>

        {player && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => toggleShortlist(player)}
              className={`pixel-btn ${shortlisted ? 'pixel-btn-primary' : 'pixel-btn-outline'}`}
              style={{ fontSize: '10px', padding: '6px 12px' }}
              title={shortlisted ? 'Remove from Shortlist' : 'Add to Recruitment Shortlist'}
            >
              {shortlisted ? (
                <>
                  <Check size={12} /> IN SHORTLIST
                </>
              ) : (
                <>
                  <BookmarkPlus size={12} /> ADD TO SHORTLIST
                </>
              )}
            </button>
            <Link
              to={`/compare?player_ids=${player.player_id}`}
              className="pixel-btn pixel-btn-outline"
              style={{ fontSize: '10px', padding: '6px 12px', textDecoration: 'none' }}
            >
              <GitCompare size={12} /> COMPARE PLAYER
            </Link>
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingSpinner message="ANALYZING PLAYER DOSSIER..." />}
      {error && !loading && (
        <ErrorMessage
          title="PLAYER DOSSIER UNAVAILABLE"
          message={error}
          onRetry={loadPlayer}
        />
      )}

      {/* Profile Content */}
      {!loading && !error && player && (
        <div>
          {/* Header Card */}
          <div className="pixel-card" style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '20px',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="pixel-badge" style={{ color: 'var(--color-secondary)' }}>
                    {player.team_name}
                  </span>
                  <span className="pixel-badge" style={{ color: 'var(--color-primary)' }}>
                    SUPERLIGA 2025/26
                  </span>
                </div>

                <h1 className="pixel-title" style={{ fontSize: '24px', marginTop: '4px' }}>
                  {player.player_name}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                  ScoutIQ Player ID: #{player.player_id} • Club ID: #{player.team_id}
                </p>
              </div>

              {/* Match Rating Badge */}
              <div style={{
                background: 'var(--color-bg-surface-elevated)',
                border: '2px solid var(--border-color-pixel)',
                padding: '16px 24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-pixel)',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>
                  AVERAGE RATING
                </div>
                <div style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '28px',
                  color: 'var(--color-primary)',
                  marginTop: '6px',
                }}>
                  {player.scouting_features?.rating !== null ? player.scouting_features.rating : '—'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Match benchmark
                </div>
              </div>
            </div>

            {/* Quick KPI strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-color-subtle)',
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>APPEARANCES</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {player.season_totals?.appearances || 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MINUTES PLAYED</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {Math.round(player.season_totals?.minutes_played || 0)}m
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GOALS SCORED</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: 'var(--color-pitch)', marginTop: '4px' }}>
                  {player.season_totals?.goals || 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ASSISTS REGISTERED</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: 'var(--color-secondary)', marginTop: '4px' }}>
                  {player.season_totals?.assists || 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOUCHES RECORDED</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {Math.round(player.season_totals?.touches || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1 & 2: Tactical Percentages + Per-90 Chart */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
            gap: '24px',
            marginBottom: '28px',
          }}>
            {/* Efficiency Percentages */}
            <div className="pixel-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Percent size={18} color="var(--color-secondary)" />
                <h3 className="pixel-title" style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>
                  TACTICAL EFFICIENCY RATIOS
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Completion and success percentages calculated from actual match actions.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Pass Accuracy */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Pass Accuracy</span>
                    <strong style={{ color: 'var(--color-primary)' }}>
                      {player.scouting_features?.pass_accuracy_percentage !== null
                        ? `${player.scouting_features.pass_accuracy_percentage}%`
                        : 'N/A'}
                    </strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--color-bg-surface)', border: '1px solid var(--border-color-pixel)' }}>
                    <div style={{
                      width: `${Math.min(100, player.scouting_features?.pass_accuracy_percentage || 0)}%`,
                      height: '100%',
                      background: 'var(--color-primary)',
                    }} />
                  </div>
                </div>

                {/* Tackle Success */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tackle Success</span>
                    <strong style={{ color: 'var(--color-pitch)' }}>
                      {player.scouting_features?.tackle_success_percentage !== null
                        ? `${player.scouting_features.tackle_success_percentage}%`
                        : 'N/A'}
                    </strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--color-bg-surface)', border: '1px solid var(--border-color-pixel)' }}>
                    <div style={{
                      width: `${Math.min(100, player.scouting_features?.tackle_success_percentage || 0)}%`,
                      height: '100%',
                      background: 'var(--color-pitch)',
                    }} />
                  </div>
                </div>

                {/* Duel Win % */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Duel Win Rate</span>
                    <strong style={{ color: 'var(--color-secondary)' }}>
                      {player.scouting_features?.duel_win_percentage !== null
                        ? `${player.scouting_features.duel_win_percentage}%`
                        : 'N/A'}
                    </strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--color-bg-surface)', border: '1px solid var(--border-color-pixel)' }}>
                    <div style={{
                      width: `${Math.min(100, player.scouting_features?.duel_win_percentage || 0)}%`,
                      height: '100%',
                      background: 'var(--color-secondary)',
                    }} />
                  </div>
                </div>

                {/* Shot Accuracy */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Shot Accuracy</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {player.scouting_features?.shot_accuracy_percentage !== null
                        ? `${player.scouting_features.shot_accuracy_percentage}%`
                        : 'N/A (No shots recorded)'}
                    </strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--color-bg-surface)', border: '1px solid var(--border-color-pixel)' }}>
                    <div style={{
                      width: `${Math.min(100, player.scouting_features?.shot_accuracy_percentage || 0)}%`,
                      height: '100%',
                      background: '#38bdf8',
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Per-90 Normalized Visualizer */}
            <div className="pixel-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <TrendingUp size={18} color="var(--color-primary)" />
                <h3 className="pixel-title" style={{ fontSize: '13px', color: 'var(--color-primary)' }}>
                  PER-90 NORMALIZED ACTIONS
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Offensive, creative, and ball-winning actions normalized per 90 pitch minutes.
              </p>

              {per90ChartData.length > 0 ? (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={per90ChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-subtle)" horizontal={false} />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="metric"
                        stroke="var(--text-secondary)"
                        fontSize={11}
                        tickLine={false}
                        width={85}
                      />
                      <Tooltip content={<MetricTooltip />} />
                      <Bar dataKey="value" name="Rate / 90" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No per-90 metrics available.</p>
              )}
            </div>
          </div>

          {/* Section 3: Season Totals Grid */}
          <div className="pixel-card">
            <h3 className="pixel-title" style={{ fontSize: '13px', color: 'var(--color-primary)', marginBottom: '16px' }}>
              COMPLETE SEASON TOTALS (COUNTING ACTIONS)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Cumulative season match statistics recorded in the 2025/26 Danish Superliga campaign.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}>
              {[
                { label: 'Total Shots', val: player.season_totals?.shots_total },
                { label: 'Shots on Target', val: player.season_totals?.shots_on_target },
                { label: 'Key Passes', val: player.season_totals?.key_passes },
                { label: 'Accurate Passes', val: player.season_totals?.accurate_passes },
                { label: 'Total Passes', val: player.season_totals?.passes },
                { label: 'Dribbles Completed', val: player.season_totals?.successful_dribbles },
                { label: 'Tackles Attempted', val: player.season_totals?.tackles },
                { label: 'Tackles Won', val: player.season_totals?.tackles_won },
                { label: 'Interceptions', val: player.season_totals?.interceptions },
                { label: 'Clearances', val: player.season_totals?.clearances },
                { label: 'Duels Won', val: player.season_totals?.duels_won },
                { label: 'Duels Lost', val: player.season_totals?.duels_lost },
                { label: 'Possession Lost', val: player.season_totals?.possession_lost },
                { label: 'Total Touches', val: player.season_totals?.touches },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '12px 14px',
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--border-color-subtle)',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{stat.label}</div>
                  <div style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    marginTop: '4px',
                  }}>
                    {stat.val !== null && stat.val !== undefined ? stat.val : '0'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
