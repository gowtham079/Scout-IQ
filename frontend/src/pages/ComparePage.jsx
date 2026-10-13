import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import {
  GitCompare,
  ArrowLeftRight,
  TrendingUp,
  BarChart2,
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

// Custom Tooltip for Comparison Chart
function ComparisonTooltip({ active, payload, label, player1Name, player2Name }) {
  if (active && payload && payload.length >= 2) {
    const val1 = payload[0].value;
    const val2 = payload[1].value;
    const diff = typeof val1 === 'number' && typeof val2 === 'number' ? (val1 - val2).toFixed(2) : null;

    return (
      <div style={{
        background: 'var(--color-bg-surface-elevated)',
        border: '1px solid var(--border-color-pixel)',
        padding: '12px 16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.8)',
      }}>
        <div style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '10px',
          color: 'var(--text-primary)',
          marginBottom: '8px',
        }}>
          {label}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-primary)', marginBottom: '4px' }}>
          <strong>{player1Name}:</strong> {val1}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-secondary)', marginBottom: '6px' }}>
          <strong>{player2Name}:</strong> {val2}
        </div>
        {diff !== null && (
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-color-subtle)',
            paddingTop: '4px',
          }}>
            Delta: {diff > 0 ? `+${diff}` : diff}
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected Player IDs initialized from searchParams if present
  const [playerAId, setPlayerAId] = useState(() => {
    const paramIds = searchParams.get('player_ids');
    if (paramIds) {
      const parts = paramIds.split(',').map(s => s.trim()).filter(Boolean);
      return parts[0] || '';
    }
    return '';
  });

  const [playerBId, setPlayerBId] = useState(() => {
    const paramIds = searchParams.get('player_ids');
    if (paramIds) {
      const parts = paramIds.split(',').map(s => s.trim()).filter(Boolean);
      return parts[1] || '';
    }
    return '';
  });

  // Available Players for Dropdown / Search
  const [playerOptions, setPlayerOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Comparison Telemetry State
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load candidate players on mount to populate dropdown options
  useEffect(() => {
    let active = true;

    async function loadCandidatePlayers() {
      try {
        setOptionsLoading(true);
        const res = await api.getPlayers({ page: 1, page_size: 100, sort_by: 'rating', sort_order: 'desc' });
        if (!active) return;

        if (res && res.items) {
          setPlayerOptions(res.items);

          // If no player IDs were in URL, default to top 2 rated players
          setPlayerAId(prevA => {
            if (prevA) return prevA;
            return res.items.length >= 1 ? String(res.items[0].player_id) : '';
          });

          setPlayerBId(prevB => {
            if (prevB) return prevB;
            return res.items.length >= 2 ? String(res.items[1].player_id) : '';
          });
        }
      } catch (err) {
        console.warn('Failed to load candidate players list:', err);
      } finally {
        if (active) {
          setOptionsLoading(false);
        }
      }
    }

    loadCandidatePlayers();

    return () => {
      active = false;
    };
  }, []);

  // Synchronize state with URL search params when external navigation occurs (e.g. Back/Forward)
  useEffect(() => {
    const paramIds = searchParams.get('player_ids');
    if (!paramIds) return;

    const parts = paramIds.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      if (parts[0] !== playerAId) setPlayerAId(parts[0]);
      if (parts[1] !== playerBId) setPlayerBId(parts[1]);
    } else if (parts.length === 1) {
      if (parts[0] !== playerAId) setPlayerAId(parts[0]);
    }
  }, [searchParams, playerAId, playerBId]);

  // Synchronize URL search params when player selections change
  useEffect(() => {
    if (playerAId && playerBId && playerAId !== playerBId) {
      const currentParam = searchParams.get('player_ids');
      const nextParam = `${playerAId},${playerBId}`;
      if (currentParam !== nextParam) {
        setSearchParams({ player_ids: nextParam }, { replace: true });
      }
    }
  }, [playerAId, playerBId, searchParams, setSearchParams]);

  // Fetch comparison telemetry when both IDs are set and distinct
  useEffect(() => {
    if (!playerAId || !playerBId) return;

    if (playerAId === playerBId) {
      setError('Please choose two distinct players to run head-to-head comparison.');
      setComparisonData(null);
      return;
    }

    let active = true;

    async function fetchComparison() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.comparePlayers(playerAId, playerBId);
        if (active) {
          setComparisonData(res);
        }
      } catch (err) {
        if (active) {
          if (err.status === 404) {
            setError(`One or both player IDs (${playerAId}, ${playerBId}) were not found in the database.`);
          } else {
            setError(err.message || 'Failed to retrieve player comparison data.');
          }
          setComparisonData(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchComparison();

    return () => {
      active = false;
    };
  }, [playerAId, playerBId]);

  // Swap Player A and Player B
  const handleSwap = () => {
    if (playerAId && playerBId) {
      const temp = playerAId;
      setPlayerAId(playerBId);
      setPlayerBId(temp);
    }
  };

  // Prepare chart data comparing key per-90 metrics
  const chartMetricsKeys = [
    'goals_per90',
    'assists_per90',
    'shots_per90',
    'key_passes_per90',
    'successful_dribbles_per90',
    'tackles_per90',
    'interceptions_per90',
    'clearances_per90',
    'duels_won_per90',
  ];

  const chartData = comparisonData?.comparison_metrics
    ? comparisonData.comparison_metrics
        .filter(m => chartMetricsKeys.includes(m.metric))
        .map(m => ({
          metricLabel: m.label,
          [comparisonData.player1.player_name]: m.player1_value !== null ? m.player1_value : 0,
          [comparisonData.player2.player_name]: m.player2_value !== null ? m.player2_value : 0,
        }))
    : [];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <GitCompare size={26} color="var(--color-primary)" />
          <h1 className="pixel-title" style={{ fontSize: '22px' }}>
            HEAD-TO-HEAD SCOUTING COMPARISON
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '780px' }}>
          Benchmark two players side-by-side across all 18 normalized per-90 metrics, action rates, and tactical efficiencies from Danish Superliga 2025/26.
        </p>
      </div>

      {/* Interactive Player Selectors Bar */}
      <div className="pixel-card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '16px',
          alignItems: 'center',
        }}>
          {/* Player A Selector */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontFamily: 'var(--font-pixel)',
              color: 'var(--color-primary)',
              marginBottom: '8px',
            }}>
              PLAYER A (PRIMARY)
            </label>
            <select
              value={playerAId}
              onChange={(e) => setPlayerAId(e.target.value)}
              disabled={optionsLoading}
              style={{
                width: '100%',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-primary)',
                color: 'var(--text-primary)',
                padding: '10px 12px',
                fontSize: '14px',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
              }}
            >
              {playerOptions.map((p) => (
                <option key={`a-${p.player_id}`} value={p.player_id}>
                  {p.player_name} ({p.team_name} • Rating: {p.rating || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '20px' }}>
            <button
              onClick={handleSwap}
              className="pixel-btn pixel-btn-outline"
              style={{ padding: '10px', fontSize: '11px' }}
              title="Swap Player A and Player B"
            >
              <ArrowLeftRight size={16} />
            </button>
          </div>

          {/* Player B Selector */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontFamily: 'var(--font-pixel)',
              color: 'var(--color-secondary)',
              marginBottom: '8px',
            }}>
              PLAYER B (BENCHMARK)
            </label>
            <select
              value={playerBId}
              onChange={(e) => setPlayerBId(e.target.value)}
              disabled={optionsLoading}
              style={{
                width: '100%',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-secondary)',
                color: 'var(--text-primary)',
                padding: '10px 12px',
                fontSize: '14px',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
              }}
            >
              {playerOptions.map((p) => (
                <option key={`b-${p.player_id}`} value={p.player_id}>
                  {p.player_name} ({p.team_name} • Rating: {p.rating || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingSpinner message="CALCULATING HEAD-TO-HEAD STATISTICAL DELTAS..." />}
      {error && !loading && (
        <ErrorMessage
          title="COMPARISON TELEMETRY ERROR"
          message={error}
          onRetry={() => {
            setError(null);
            if (playerAId && playerBId && playerAId !== playerBId) {
              setSearchParams({ player_ids: `${playerAId},${playerBId}` });
            }
          }}
        />
      )}

      {/* Active Comparison Presentation */}
      {!loading && !error && comparisonData && (
        <div>
          {/* Player Summary Cards Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            marginBottom: '28px',
          }}>
            {/* Player A Card */}
            <div className="pixel-card" style={{ borderColor: 'var(--color-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="pixel-badge" style={{ color: 'var(--color-primary)' }}>
                    PLAYER A
                  </span>
                  <h2 className="pixel-title" style={{ fontSize: '18px', margin: '8px 0 4px 0' }}>
                    {comparisonData.player1.player_name}
                  </h2>
                  <p style={{ color: 'var(--color-secondary)', fontSize: '13px' }}>
                    {comparisonData.player1.team_name}
                  </p>
                </div>
                <div style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--border-color-pixel)',
                  padding: '8px 14px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RATING</div>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '20px', color: 'var(--color-primary)', marginTop: '2px' }}>
                    {comparisonData.player1.rating || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '16px',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-color-subtle)',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}>
                <div>Appearances: <strong style={{ color: 'var(--text-primary)' }}>{comparisonData.player1.appearances}</strong></div>
                <div>Minutes: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(comparisonData.player1.minutes_played)}m</strong></div>
                <div>Goals: <strong style={{ color: 'var(--color-pitch)' }}>{comparisonData.player1.goals_per90}/90</strong></div>
              </div>
            </div>

            {/* Player B Card */}
            <div className="pixel-card" style={{ borderColor: 'var(--color-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="pixel-badge" style={{ color: 'var(--color-secondary)' }}>
                    PLAYER B
                  </span>
                  <h2 className="pixel-title" style={{ fontSize: '18px', margin: '8px 0 4px 0' }}>
                    {comparisonData.player2.player_name}
                  </h2>
                  <p style={{ color: 'var(--color-secondary)', fontSize: '13px' }}>
                    {comparisonData.player2.team_name}
                  </p>
                </div>
                <div style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--border-color-pixel)',
                  padding: '8px 14px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RATING</div>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '20px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                    {comparisonData.player2.rating || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '16px',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-color-subtle)',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}>
                <div>Appearances: <strong style={{ color: 'var(--text-primary)' }}>{comparisonData.player2.appearances}</strong></div>
                <div>Minutes: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(comparisonData.player2.minutes_played)}m</strong></div>
                <div>Goals: <strong style={{ color: 'var(--color-pitch)' }}>{comparisonData.player2.goals_per90}/90</strong></div>
              </div>
            </div>
          </div>

          {/* Section 1: Recharts Grouped Comparison Visualizer */}
          <div className="pixel-card" style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={18} color="var(--color-primary)" />
                <h3 className="pixel-title" style={{ fontSize: '13px', color: 'var(--color-primary)' }}>
                  NORMALIZED PER-90 STATISTICAL COMPARISON
                </h3>
              </div>
              <span className="pixel-badge" style={{ fontSize: '9px' }}>RATES / 90 MINS</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Comparing key offensive, creative, and defensive metrics normalized per 90 pitch minutes.
            </p>

            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 360 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 45 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-subtle)" vertical={false} />
                    <XAxis
                      dataKey="metricLabel"
                      stroke="var(--text-muted)"
                      fontSize={11}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                      tickLine={false}
                    />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip
                      content={
                        <ComparisonTooltip
                          player1Name={comparisonData.player1.player_name}
                          player2Name={comparisonData.player2.player_name}
                        />
                      }
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    <Bar
                      dataKey={comparisonData.player1.player_name}
                      fill="var(--color-primary)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey={comparisonData.player2.player_name}
                      fill="var(--color-secondary)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No chart metrics available.</p>
            )}
          </div>

          {/* Section 2: Detailed Comparison Table (18 Metrics) */}
          <div className="pixel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--color-secondary)" />
                <h3 className="pixel-title" style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>
                  COMPREHENSIVE METRIC MATRIX ({comparisonData.comparison_metrics.length} METRICS)
                </h3>
              </div>
              <span className="pixel-badge">EXACT TELEMETRY</span>
            </div>

            <div className="pixel-table-container">
              <table className="pixel-table">
                <thead>
                  <tr>
                    <th>METRIC</th>
                    <th style={{ color: 'var(--color-primary)' }}>{comparisonData.player1.player_name}</th>
                    <th style={{ color: 'var(--color-secondary)' }}>{comparisonData.player2.player_name}</th>
                    <th>NUMERICAL DELTA</th>
                    <th style={{ textAlign: 'right' }}>CATEGORY LEADER</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.comparison_metrics.map((m) => {
                    const isP1Leader = m.leader_player_id === comparisonData.player1.player_id;
                    const isP2Leader = m.leader_player_id === comparisonData.player2.player_id;

                    return (
                      <tr key={m.metric}>
                        <td style={{ fontWeight: 600 }}>{m.label}</td>
                        <td style={{
                          color: isP1Leader ? 'var(--color-primary)' : 'inherit',
                          fontWeight: isP1Leader ? 700 : 400,
                        }}>
                          {m.player1_value !== null ? m.player1_value : 'N/A'}
                        </td>
                        <td style={{
                          color: isP2Leader ? 'var(--color-secondary)' : 'inherit',
                          fontWeight: isP2Leader ? 700 : 400,
                        }}>
                          {m.player2_value !== null ? m.player2_value : 'N/A'}
                        </td>
                        <td style={{
                          color: m.difference !== null ? (m.difference > 0 ? 'var(--color-pitch)' : m.difference < 0 ? 'var(--color-danger)' : 'inherit') : 'var(--text-muted)',
                        }}>
                          {m.difference !== null ? (m.difference > 0 ? `+${m.difference}` : m.difference) : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isP1Leader ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              background: 'rgba(250, 204, 21, 0.1)',
                              border: '1px solid var(--color-primary)',
                              color: 'var(--color-primary)',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '3px',
                            }}>
                              {comparisonData.player1.player_name}
                            </span>
                          ) : isP2Leader ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              background: 'rgba(6, 182, 212, 0.1)',
                              border: '1px solid var(--color-secondary)',
                              color: 'var(--color-secondary)',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '3px',
                            }}>
                              {comparisonData.player2.player_name}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Tied / Equal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{
              marginTop: '16px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}>
              Note: Higher metrics denote volume or execution rates. Per-90 statistics should always be contextualized against total minutes played to ensure sample reliability.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
