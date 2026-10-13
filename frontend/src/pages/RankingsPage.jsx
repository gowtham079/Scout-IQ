import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useShortlist } from '../context/ShortlistContext';
import {
  Trophy,
  Target,
  Sparkles,
  ShieldAlert,
  Award,
  BookmarkCheck,
  BookmarkPlus,
  ArrowRight,
  Info,
  Clock,
  Flame,
  Activity,
  Check,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function RankingsPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');

  const { isShortlisted, toggleShortlist, count: shortlistCount } = useShortlist();

  const loadRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTopPerformers();
      setCategories(res);
    } catch (err) {
      setError(err.message || 'Failed to connect to /api/scouting/top-performers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, []);

  const getCategoryTheme = (name) => {
    switch (name) {
      case 'Clinical Finishers':
        return {
          icon: Target,
          color: 'var(--color-pitch)',
          badgeText: 'GOAL PRODUCTION',
          primaryMetricLabel: 'Goals / 90',
          metricKey: 'goals_per90',
        };
      case 'Creative Playmakers':
        return {
          icon: Sparkles,
          color: 'var(--color-secondary)',
          badgeText: 'CHANCE CREATION',
          primaryMetricLabel: 'Contributions / 90',
          metricKey: 'shot_contributions_per90',
        };
      case 'Defensive Disruptors':
        return {
          icon: ShieldAlert,
          color: 'var(--color-danger)',
          badgeText: 'BALL WINNING',
          primaryMetricLabel: 'Def. Actions / 90',
          metricKey: 'defensive_actions_per90',
        };
      case 'Elite Performers':
      default:
        return {
          icon: Award,
          color: 'var(--color-primary)',
          badgeText: 'OVERALL RATING',
          primaryMetricLabel: 'Match Rating',
          metricKey: 'rating',
        };
    }
  };

  const filteredCategories = activeCategoryFilter === 'ALL'
    ? categories
    : categories.filter((c) => c.category === activeCategoryFilter);

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Trophy size={26} color="var(--color-primary)" />
            <h1 className="pixel-title" style={{ fontSize: '22px' }}>
              TRANSPARENT SCOUTING LEADERBOARDS
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '780px' }}>
            Documented ranking criteria and statistical formulas with strict pitch-time qualification thresholds. All metrics derived from verified 2025/26 Superliga telemetry.
          </p>
        </div>

        {/* Shortlist Quick Access Banner Button */}
        <Link
          to="/shortlist"
          className="pixel-btn pixel-btn-primary"
          style={{
            fontSize: '11px',
            padding: '8px 16px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <BookmarkCheck size={14} />
          RECRUITMENT SHORTLIST
          {shortlistCount > 0 && (
            <span style={{
              background: 'var(--color-bg-base)',
              color: 'var(--color-primary)',
              borderRadius: '999px',
              padding: '1px 7px',
              fontSize: '10px',
              fontWeight: 800,
            }}>
              {shortlistCount}
            </span>
          )}
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '28px',
      }}>
        {['ALL', 'Clinical Finishers', 'Creative Playmakers', 'Defensive Disruptors', 'Elite Performers'].map((catName) => (
          <button
            key={catName}
            onClick={() => setActiveCategoryFilter(catName)}
            className={`pixel-btn ${activeCategoryFilter === catName ? 'pixel-btn-primary' : 'pixel-btn-outline'}`}
            style={{ fontSize: '10px', padding: '6px 14px' }}
          >
            {catName === 'ALL' ? 'ALL 4 CATEGORIES' : catName.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingSpinner message="CALCULATING TACTICAL LEADERBOARDS & ELIGIBILITY THRESHOLDS..." />}
      {error && !loading && (
        <ErrorMessage
          title="LEADERBOARDS UNAVAILABLE"
          message={error}
          onRetry={loadRankings}
        />
      )}

      {/* Categories Grid */}
      {!loading && !error && filteredCategories.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeCategoryFilter === 'ALL' ? 'repeat(auto-fit, minmax(480px, 1fr))' : '1fr',
          gap: '24px',
          marginBottom: '32px',
        }}>
          {filteredCategories.map((cat) => {
            const theme = getCategoryTheme(cat.category);
            const Icon = theme.icon;

            return (
              <div key={cat.category} className="pixel-card">
                {/* Category Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      padding: '8px',
                      background: 'var(--color-bg-surface-elevated)',
                      border: '1px solid var(--border-color-pixel)',
                    }}>
                      <Icon size={22} color={theme.color} />
                    </div>
                    <div>
                      <h3 className="pixel-title" style={{ fontSize: '14px', color: theme.color }}>
                        {cat.category}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {cat.description}
                      </div>
                    </div>
                  </div>
                  <span className="pixel-badge" style={{ color: theme.color, fontSize: '9px' }}>
                    {theme.badgeText}
                  </span>
                </div>

                {/* Mathematical Criteria & Playing-Time Formula Strip */}
                <div style={{
                  background: 'var(--color-bg-surface-elevated)',
                  border: '1px solid var(--border-color-pixel)',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>FORMULA:</span>
                    <code style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                      {cat.formula}
                    </code>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={12} color="var(--color-secondary)" />
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>ELIGIBILITY:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {cat.criteria}
                    </span>
                  </div>
                </div>

                {/* Leaderboard Table */}
                <div className="pixel-table-container">
                  <table className="pixel-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>PLAYER</th>
                        <th>CLUB</th>
                        <th>MINS</th>
                        <th style={{ color: theme.color }}>{theme.primaryMetricLabel}</th>
                        <th>RATING</th>
                        <th style={{ textAlign: 'right' }}>SHORTLIST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.players.map((p, idx) => {
                        const shortlisted = isShortlisted(p.player_id);

                        return (
                          <tr key={p.player_id}>
                            {/* Rank */}
                            <td style={{
                              fontFamily: 'var(--font-pixel)',
                              fontSize: '11px',
                              color: idx === 0 ? 'var(--color-primary)' : idx < 3 ? 'var(--text-primary)' : 'var(--text-muted)',
                              fontWeight: idx < 3 ? 700 : 400,
                            }}>
                              #{idx + 1}
                            </td>

                            {/* Player Name */}
                            <td>
                              <Link
                                to={`/players/${p.player_id}`}
                                style={{
                                  color: 'var(--text-primary)',
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                }}
                              >
                                {p.player_name}
                              </Link>
                            </td>

                            {/* Club */}
                            <td>
                              <span style={{
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                              }}>
                                {p.team_name}
                              </span>
                            </td>

                            {/* Minutes */}
                            <td>
                              <span style={{ fontSize: '12px' }}>
                                {Math.round(p.minutes_played)}m
                              </span>
                            </td>

                            {/* Primary Metric */}
                            <td style={{
                              fontFamily: 'var(--font-pixel)',
                              fontSize: '12px',
                              color: theme.color,
                              fontWeight: 700,
                            }}>
                              {p[theme.metricKey] !== undefined && p[theme.metricKey] !== null
                                ? p[theme.metricKey]
                                : '—'}
                            </td>

                            {/* Rating */}
                            <td>
                              <span style={{
                                color: p.rating >= 7.2 ? 'var(--color-primary)' : 'var(--text-secondary)',
                                fontWeight: 600,
                                fontSize: '12px',
                              }}>
                                {p.rating || '—'}
                              </span>
                            </td>

                            {/* Shortlist Action */}
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => toggleShortlist(p)}
                                className={`pixel-btn ${shortlisted ? 'pixel-btn-primary' : 'pixel-btn-outline'}`}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '9px',
                                }}
                                title={shortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                              >
                                {shortlisted ? (
                                  <>
                                    <Check size={11} /> SAVED
                                  </>
                                ) : (
                                  <>
                                    <BookmarkPlus size={11} /> SHORTLIST
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
