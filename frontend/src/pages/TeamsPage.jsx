import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  Shield,
  Trophy,
  BarChart3,
  TrendingUp,
  Percent,
  ArrowUpDown,
  Eye,
  RefreshCw,
  Flame,
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

// Custom Tooltip for Recharts
function TeamChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--color-bg-surface-elevated)',
        border: '1px solid var(--border-color-pixel)',
        padding: '12px 16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.8)',
      }}>
        <div style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '11px',
          color: 'var(--color-primary)',
          marginBottom: '8px',
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
            marginTop: '3px',
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
              {item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sorting state for table
  const [sortField, setSortField] = useState('rank'); // 'rank', 'points', 'goal_difference', 'goals_for', 'average_possession'
  const [sortAsc, setSortAsc] = useState(true);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTeams();
      setTeams(res);
    } catch (err) {
      setError(err.message || 'Failed to retrieve team standings from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  // Sorted teams copy
  const sortedTeams = [...teams].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === null || valA === undefined) valA = 0;
    if (valB === null || valB === undefined) valB = 0;

    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      // For rank or team name default asc, otherwise default desc
      setSortAsc(field === 'rank' || field === 'team_name');
    }
  };

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
            <Shield size={26} color="var(--color-primary)" />
            <h1 className="pixel-title" style={{ fontSize: '22px' }}>
              TEAM ANALYTICS & STANDINGS
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '780px' }}>
            League table, points progression, goal dynamics, and possession control across all 12 Danish Superliga clubs in 2025/26.
          </p>
        </div>

        <button
          onClick={loadTeams}
          disabled={loading}
          className="pixel-btn pixel-btn-outline"
          style={{ fontSize: '10px', padding: '8px 14px' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> REFRESH STANDINGS
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingSpinner message="CALCULATING SUPERLIGA STANDINGS & CLUB ANALYTICS..." />}
      {error && !loading && (
        <ErrorMessage
          title="STANDINGS TELEMETRY OFFLINE"
          message={error}
          onRetry={loadTeams}
        />
      )}

      {/* Main Content */}
      {!loading && !error && teams.length > 0 && (
        <div>
          {/* Section A: Interactive Standings Table */}
          <div className="pixel-card" style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
            }}>
              <div>
                <h3 className="pixel-title" style={{ fontSize: '13px', color: 'var(--color-primary)' }}>
                  SCOUTIQ AGGREGATED STANDINGS — 2025/26
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Sorted by Points &rarr; Goal Difference &rarr; Goals Scored &rarr; Club Name. Click column headers to reorder.
                </div>
              </div>
              <span className="pixel-badge">12 SUPERLIGA CLUBS</span>
            </div>

            <div className="pixel-table-container">
              <table className="pixel-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px', cursor: 'pointer' }} onClick={() => handleSort('rank')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        # <ArrowUpDown size={10} />
                      </span>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('team_name')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        CLUB <ArrowUpDown size={10} />
                      </span>
                    </th>
                    <th>P</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('wins')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        W <ArrowUpDown size={10} />
                      </span>
                    </th>
                    <th>D</th>
                    <th>L</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('goals_for')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        GF <ArrowUpDown size={10} />
                      </span>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('goals_against')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        GA <ArrowUpDown size={10} />
                      </span>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('goal_difference')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        GD <ArrowUpDown size={10} />
                      </span>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('average_possession')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        POSS % <ArrowUpDown size={10} />
                      </span>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('points')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}>
                        PTS <ArrowUpDown size={10} />
                      </span>
                    </th>
                    <th style={{ textAlign: 'right' }}>PROFILE</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeams.map((t) => (
                    <tr key={t.team_id}>
                      <td style={{
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '11px',
                        color: t.rank <= 3 ? 'var(--color-primary)' : 'inherit',
                        fontWeight: t.rank <= 3 ? 700 : 400,
                      }}>
                        {t.rank}
                      </td>
                      <td>
                        <Link
                          to={`/teams/${t.team_id}`}
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                          }}
                        >
                          {t.team_name}
                        </Link>
                      </td>
                      <td>{t.matches}</td>
                      <td style={{ color: 'var(--color-pitch)', fontWeight: 600 }}>{t.wins}</td>
                      <td style={{ color: 'var(--color-primary)' }}>{t.draws}</td>
                      <td style={{ color: 'var(--color-danger)' }}>{t.losses}</td>
                      <td>{t.goals_for}</td>
                      <td>{t.goals_against}</td>
                      <td style={{
                        fontWeight: 600,
                        color: t.goal_difference > 0 ? 'var(--color-pitch)' : t.goal_difference < 0 ? 'var(--color-danger)' : 'inherit',
                      }}>
                        {t.goal_difference > 0 ? `+${t.goal_difference}` : t.goal_difference}
                      </td>
                      <td style={{ color: 'var(--color-secondary)' }}>
                        {t.average_possession !== null ? `${t.average_possession}%` : '—'}
                      </td>
                      <td style={{
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '13px',
                        color: 'var(--color-primary)',
                        fontWeight: 800,
                      }}>
                        {t.points}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/teams/${t.team_id}`}
                          className="pixel-btn pixel-btn-outline"
                          style={{
                            padding: '4px 8px',
                            fontSize: '9px',
                            textDecoration: 'none',
                          }}
                        >
                          <Eye size={12} /> DOSSIER
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Recharts Team Performance Visualizations */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}>
            {/* Chart 1: Goals Scored vs Goals Conceded */}
            <div className="pixel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} color="var(--color-secondary)" />
                  <h3 className="pixel-title" style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                    GOALS SCORED VS CONCEDED
                  </h3>
                </div>
                <span className="pixel-badge" style={{ fontSize: '9px' }}>GF / GA</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Offensive output (cyan) versus defensive record (crimson) across 32 rounds.
              </p>

              <div style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={teams}
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
                    <Tooltip content={<TeamChartTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    <Bar dataKey="goals_for" name="Goals Scored" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="goals_against" name="Goals Conceded" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Match Results Breakdown (Stacked Wins / Draws / Losses) */}
            <div className="pixel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={18} color="var(--color-primary)" />
                  <h3 className="pixel-title" style={{ fontSize: '12px', color: 'var(--color-primary)' }}>
                    MATCH OUTCOMES DISTRIBUTION
                  </h3>
                </div>
                <span className="pixel-badge" style={{ fontSize: '9px' }}>W / D / L</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Total 32 matches split by wins (green), draws (yellow), and losses (crimson).
              </p>

              <div style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={teams}
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
                    <Tooltip content={<TeamChartTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    <Bar dataKey="wins" name="Wins" fill="var(--color-pitch)" stackId="a" />
                    <Bar dataKey="draws" name="Draws" fill="var(--color-primary)" stackId="a" />
                    <Bar dataKey="losses" name="Losses" fill="var(--color-danger)" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Average Possession (%) Comparison */}
            <div className="pixel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Percent size={18} color="var(--color-secondary)" />
                  <h3 className="pixel-title" style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                    BALL CONTROL & POSSESSION SHARE
                  </h3>
                </div>
                <span className="pixel-badge" style={{ color: 'var(--color-secondary)', fontSize: '9px' }}>AVG %</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Average possession percentage per club across the 2025/26 campaign.
              </p>

              <div style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...teams].sort((a, b) => (b.average_possession || 0) - (a.average_possession || 0))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 75, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-subtle)" horizontal={false} />
                    <XAxis type="number" domain={[30, 65]} stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="team_name"
                      stroke="var(--text-secondary)"
                      fontSize={11}
                      tickLine={false}
                      width={85}
                    />
                    <Tooltip content={<TeamChartTooltip />} />
                    <Bar dataKey="average_possession" name="Avg Possession %" fill="var(--color-secondary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
