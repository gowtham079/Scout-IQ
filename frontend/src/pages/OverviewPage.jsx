import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Goal,
  Award,
  Shield,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Flame,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// Custom Tooltip for Recharts styled with ScoutIQ retro-pixel theme
function ChartTooltip({ active, payload, label, unit = '' }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--color-bg-surface-elevated)',
        border: '1px solid var(--border-color-pixel)',
        padding: '12px 16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.7)',
        fontFamily: 'var(--font-body)',
      }}>
        <div style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '11px',
          color: 'var(--color-primary)',
          marginBottom: '8px',
          letterSpacing: '0.04em',
        }}>
          {label}
        </div>
        {payload.map((item, index) => (
          <div key={`item-${index}`} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            marginTop: '4px',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                backgroundColor: item.color || item.fill,
                display: 'inline-block',
              }} />
              <span style={{ color: 'var(--text-secondary)' }}>{item.name}:</span>
            </span>
            <span style={{ fontWeight: 700, color: item.color || item.fill }}>
              {item.value} {unit}
            </span>
          </div>
        ))}
        {payload[0]?.payload?.team_name && (
          <div style={{
            marginTop: '8px',
            paddingTop: '6px',
            borderTop: '1px solid var(--border-color-subtle)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}>
            Club: {payload[0].payload.team_name}
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getOverview();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to retrieve telemetry from /api/overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <LayoutDashboard size={26} color="var(--color-primary)" />
            <h1 className="pixel-title" style={{ fontSize: '22px' }}>
              EXECUTIVE LEAGUE OVERVIEW
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '720px' }}>
            Live telemetry and macro metrics for Danish Superliga 2025/26. Real-time player totals, seasonal scoring distribution, and offensive leaderboards.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="pixel-btn pixel-btn-outline"
          style={{ fontSize: '10px', padding: '8px 14px' }}
          title="Refresh Overview Telemetry"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> REFRESH DATA
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingSpinner message="SYNCHRONIZING SUPERLIGA TELEMETRY..." />}
      {error && !loading && (
        <ErrorMessage
          title="TELEMETRY OFFLINE"
          message={error}
          onRetry={loadData}
        />
      )}

      {/* Empty State */}
      {!loading && !error && !data && (
        <div className="pixel-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No league telemetry available for this season.</p>
        </div>
      )}

      {/* Real Data View */}
      {!loading && !error && data && (
        <div>
          {/* Key Metric KPI Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '18px',
            marginBottom: '32px',
          }}>
            <div className="pixel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>UNIQUE PLAYERS</span>
                <Users size={18} color="var(--color-secondary)" />
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '26px', color: 'var(--color-primary)' }}>
                {data.total_unique_players}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Active in 2025/26
              </div>
            </div>

            <div className="pixel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL CLUBS</span>
                <Shield size={18} color="var(--color-primary)" />
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '26px', color: 'var(--text-primary)' }}>
                {data.total_teams}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Superliga teams
              </div>
            </div>

            <div className="pixel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL GOALS</span>
                <Goal size={18} color="var(--color-pitch)" />
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '26px', color: 'var(--color-pitch)' }}>
                {data.total_goals}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Across all fixtures
              </div>
            </div>

            <div className="pixel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL ASSISTS</span>
                <Award size={18} color="var(--color-secondary)" />
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '26px', color: 'var(--color-secondary)' }}>
                {data.total_assists}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Registered assists
              </div>
            </div>

            <div className="pixel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>AVG RATING</span>
                <Trophy size={18} color="var(--color-primary)" />
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '26px', color: 'var(--color-primary)' }}>
                {data.average_player_rating}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                League benchmark
              </div>
            </div>
          </div>

          {/* Charts Row: Top Scorers (Bar Chart) & Goals For vs Against (Grouped Bar Chart) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}>
            {/* Chart 1: Top Goalscorers */}
            <div className="pixel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flame size={18} color="var(--color-primary)" />
                  <h3 className="pixel-title" style={{ fontSize: '12px', color: 'var(--color-primary)' }}>
                    TOP 10 GOALSCORERS
                  </h3>
                </div>
                <span className="pixel-badge" style={{ fontSize: '9px' }}>GOALS SCORED</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Absolute goal volume leaders across the Danish Superliga season.
              </p>

              {data.top_scorers && data.top_scorers.length > 0 ? (
                <div style={{ width: '100%', height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.top_scorers}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 75, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-subtle)" horizontal={false} />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="player_name"
                        stroke="var(--text-secondary)"
                        fontSize={11}
                        tickLine={false}
                        width={90}
                      />
                      <Tooltip content={<ChartTooltip unit="goals" />} />
                      <Bar dataKey="goals" name="Goals" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No scorer data available.</p>
              )}
            </div>

            {/* Chart 2: Goals For vs Goals Against per Team */}
            <div className="pixel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} color="var(--color-secondary)" />
                  <h3 className="pixel-title" style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                    GOALS FOR VS. AGAINST
                  </h3>
                </div>
                <span className="pixel-badge" style={{ color: 'var(--color-secondary)', fontSize: '9px' }}>12 CLUBS</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Offensive output vs defensive concession distribution across all teams.
              </p>

              {data.team_goal_distribution && data.team_goal_distribution.length > 0 ? (
                <div style={{ width: '100%', height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.team_goal_distribution}
                      margin={{ top: 10, right: 20, left: -10, bottom: 35 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-subtle)" vertical={false} />
                      <XAxis
                        dataKey="team_name"
                        stroke="var(--text-muted)"
                        fontSize={10}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        tickLine={false}
                      />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                      <Bar dataKey="goals_for" name="Goals For" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="goals_against" name="Goals Against" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No team goal distribution available.</p>
              )}
            </div>
          </div>

          {/* Table / Leaderboard: Top Assist Providers */}
          <div className="pixel-card" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--color-primary)" />
                <h3 className="pixel-title" style={{ fontSize: '13px', color: 'var(--color-primary)' }}>
                  TOP ASSIST PROVIDERS (CHANCE CREATION)
                </h3>
              </div>
              <span className="pixel-badge">TOP 10 PLAYMAKERS</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Primary offensive architects registered with the highest assist volume in the competition.
            </p>

            {data.top_assisters && data.top_assisters.length > 0 ? (
              <div className="pixel-table-container">
                <table className="pixel-table">
                  <thead>
                    <tr>
                      <th style={{ width: '48px' }}>#</th>
                      <th>PLAYER</th>
                      <th>CLUB</th>
                      <th>MATCHES</th>
                      <th>MINUTES</th>
                      <th>ASSISTS</th>
                      <th>GOALS</th>
                      <th>RATING</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_assisters.map((player, idx) => (
                      <tr key={player.player_id}>
                        <td style={{
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '10px',
                          color: idx < 3 ? 'var(--color-primary)' : 'var(--text-muted)',
                        }}>
                          #{idx + 1}
                        </td>
                        <td style={{ fontWeight: 600 }}>{player.player_name}</td>
                        <td style={{ color: 'var(--color-secondary)' }}>{player.team_name}</td>
                        <td>{player.appearances}</td>
                        <td>{Math.round(player.minutes_played)}</td>
                        <td style={{
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '12px',
                          color: 'var(--color-primary)',
                          fontWeight: 700,
                        }}>
                          {player.assists}
                        </td>
                        <td>{player.goals}</td>
                        <td style={{ color: 'var(--color-pitch)', fontWeight: 600 }}>
                          {player.average_rating || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No assist provider records found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
