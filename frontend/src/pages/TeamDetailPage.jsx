import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  ArrowLeft,
  Shield,
  Trophy,
  Users,
  Goal,
  Award,
  Sparkles,
  Flame,
  Activity,
  AlertCircle,
  Eye,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function TeamDetailPage() {
  const { id } = useParams();
  const [teamDetail, setTeamDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTeamDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTeamDetail(id);
      setTeamDetail(res);
    } catch (err) {
      if (err.status === 404 || err.message?.includes('404')) {
        setError(`Club ID #${id} was not found in the Danish Superliga database.`);
      } else {
        setError(err.message || 'Failed to retrieve team profile from database.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamDetail();
  }, [id]);

  const team = teamDetail?.team;

  return (
    <div>
      {/* Top Navigation */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          to="/teams"
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
          <ArrowLeft size={16} /> BACK TO LEAGUE STANDINGS
        </Link>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingSpinner message="LOADING CLUB PROFILE & SQUAD ANALYTICS..." />}
      {error && !loading && (
        <ErrorMessage
          title="CLUB DOSSIER UNAVAILABLE"
          message={error}
          onRetry={loadTeamDetail}
        />
      )}

      {/* Team Content */}
      {!loading && !error && teamDetail && team && (
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
                  <span className="pixel-badge" style={{ color: 'var(--color-primary)' }}>
                    DANISH SUPERLIGA 2025/26
                  </span>
                  <span className="pixel-badge" style={{ color: 'var(--color-secondary)' }}>
                    CLUB ID: #{team.team_id}
                  </span>
                </div>

                <h1 className="pixel-title" style={{ fontSize: '26px', marginTop: '6px' }}>
                  {team.team_name}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                  League Standing: Position #{team.rank} of 12 clubs • Calculated Points: {team.points} pts
                </p>
              </div>

              {/* Standings Rank Box */}
              <div style={{
                background: 'var(--color-bg-surface-elevated)',
                border: '2px solid var(--border-color-pixel)',
                padding: '16px 24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-pixel)',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  LEAGUE POSITION
                </div>
                <div style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '28px',
                  color: team.rank <= 3 ? 'var(--color-primary)' : 'var(--text-primary)',
                  marginTop: '4px',
                }}>
                  #{team.rank}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-pitch)', fontWeight: 600, marginTop: '2px' }}>
                  {team.points} POINTS
                </div>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-color-subtle)',
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MATCHES</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {team.matches}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>W / D / L</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: 'var(--text-primary)', marginTop: '4px' }}>
                  <span style={{ color: 'var(--color-pitch)' }}>{team.wins}</span>-
                  <span style={{ color: 'var(--color-primary)' }}>{team.draws}</span>-
                  <span style={{ color: 'var(--color-danger)' }}>{team.losses}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GOALS (FOR / AG)</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {team.goals_for} / {team.goals_against}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GOAL DIFFERENCE</div>
                <div style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '16px',
                  color: team.goal_difference > 0 ? 'var(--color-pitch)' : team.goal_difference < 0 ? 'var(--color-danger)' : 'var(--text-primary)',
                  marginTop: '4px',
                }}>
                  {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AVG POSSESSION</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: 'var(--color-secondary)', marginTop: '4px' }}>
                  {team.average_possession !== null ? `${team.average_possession}%` : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SQUAD SIZE</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {teamDetail.squad_size} players
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SQUAD AVG RATING</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: 'var(--color-primary)', marginTop: '4px' }}>
                  {teamDetail.squad_average_rating || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Discipline & Corners Card */}
          <div className="pixel-card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              fontSize: '13px',
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Corners Taken: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{team.corners !== null ? team.corners : '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Yellow Cards: </span>
                <strong style={{ color: 'var(--color-primary)' }}>{team.yellowcards !== null ? team.yellowcards : '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Red Cards: </span>
                <strong style={{ color: 'var(--color-danger)' }}>{team.redcards !== null ? team.redcards : '0'}</strong>
              </div>
            </div>
          </div>

          {/* Squad Leaders Row: Top Scorers & Top Playmakers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}>
            {/* Top Scorers */}
            <div className="pixel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flame size={18} color="var(--color-pitch)" />
                  <h3 className="pixel-title" style={{ fontSize: '12px', color: 'var(--color-pitch)' }}>
                    SQUAD GOALSCORERS
                  </h3>
                </div>
                <span className="pixel-badge" style={{ fontSize: '9px' }}>TOP 5</span>
              </div>

              {teamDetail.top_scorers && teamDetail.top_scorers.length > 0 ? (
                <div className="pixel-table-container">
                  <table className="pixel-table">
                    <thead>
                      <tr>
                        <th>PLAYER</th>
                        <th>APPS</th>
                        <th>MINS</th>
                        <th>GOALS</th>
                        <th>ASSISTS</th>
                        <th>RATING</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamDetail.top_scorers.map((p) => (
                        <tr key={p.player_id}>
                          <td>
                            <Link
                              to={`/players/${p.player_id}`}
                              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}
                            >
                              {p.player_name}
                            </Link>
                          </td>
                          <td>{p.appearances}</td>
                          <td>{Math.round(p.minutes_played)}</td>
                          <td style={{ fontFamily: 'var(--font-pixel)', fontSize: '12px', color: 'var(--color-pitch)', fontWeight: 700 }}>
                            {p.goals}
                          </td>
                          <td>{p.assists}</td>
                          <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                            {p.average_rating || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No scorer records found for this club.</p>
              )}
            </div>

            {/* Top Playmakers */}
            <div className="pixel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--color-secondary)" />
                  <h3 className="pixel-title" style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                    CHANCE CREATORS & PLAYMAKERS
                  </h3>
                </div>
                <span className="pixel-badge" style={{ fontSize: '9px' }}>TOP 5</span>
              </div>

              {teamDetail.key_playmakers && teamDetail.key_playmakers.length > 0 ? (
                <div className="pixel-table-container">
                  <table className="pixel-table">
                    <thead>
                      <tr>
                        <th>PLAYER</th>
                        <th>APPS</th>
                        <th>MINS</th>
                        <th>KEY PASS/90</th>
                        <th>A/90</th>
                        <th>PASS %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamDetail.key_playmakers.map((p) => (
                        <tr key={p.player_id}>
                          <td>
                            <Link
                              to={`/players/${p.player_id}`}
                              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}
                            >
                              {p.player_name}
                            </Link>
                          </td>
                          <td>{p.appearances}</td>
                          <td>{Math.round(p.minutes_played)}</td>
                          <td style={{ fontFamily: 'var(--font-pixel)', fontSize: '12px', color: 'var(--color-secondary)', fontWeight: 700 }}>
                            {p.key_passes_per90}
                          </td>
                          <td>{p.assists_per90}</td>
                          <td>{p.pass_accuracy_percentage !== null ? `${p.pass_accuracy_percentage}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No playmaker records found for this club.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
