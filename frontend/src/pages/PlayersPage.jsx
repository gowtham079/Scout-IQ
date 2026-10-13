import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  Shield,
  Activity,
  Award,
  BookmarkPlus,
  Check,
} from 'lucide-react';
import { useShortlist } from '../context/ShortlistContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const SORT_OPTIONS = [
  { value: 'rating', label: 'Average Rating' },
  { value: 'goals_per90', label: 'Goals / 90' },
  { value: 'assists_per90', label: 'Assists / 90' },
  { value: 'minutes_played', label: 'Minutes Played' },
  { value: 'key_passes_per90', label: 'Key Passes / 90' },
  { value: 'passes_per90', label: 'Passes / 90' },
  { value: 'tackles_per90', label: 'Tackles / 90' },
  { value: 'duels_won_per90', label: 'Duels Won / 90' },
  { value: 'successful_dribbles_per90', label: 'Dribbles / 90' },
  { value: 'player_name', label: 'Player Name' },
];

export default function PlayersPage() {
  // Filter and pagination state
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [minMinutes, setMinMinutes] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Data state
  const [playersData, setPlayersData] = useState(null);
  const [teamsList, setTeamsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const { isShortlisted, toggleShortlist } = useShortlist();

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load team list for club filter dropdown
  useEffect(() => {
    async function loadTeams() {
      try {
        const teams = await api.getTeams();
        if (Array.isArray(teams)) {
          setTeamsList(teams);
        }
      } catch (err) {
        console.warn('Could not load teams list for player filter:', err);
      }
    }
    loadTeams();
  }, []);

  // Fetch players with AbortController to prevent outdated search requests from overwriting newer results
  useEffect(() => {
    const controller = new AbortController();

    async function loadPlayers() {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          page_size: pageSize,
          sort_by: sortBy,
          sort_order: sortOrder,
        };

        if (searchTerm) params.search = searchTerm;
        if (selectedTeamId) params.team_id = parseInt(selectedTeamId, 10);
        if (minMinutes !== '') params.min_minutes = parseFloat(minMinutes);
        if (minRating !== '') params.min_rating = parseFloat(minRating);

        const res = await api.getPlayers(params, { signal: controller.signal });
        setPlayersData(res);
      } catch (err) {
        if (err.name === 'AbortError') {
          // Stale request aborted; do not display error
          return;
        }
        setError(err.message || 'Failed to retrieve player directory from database.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPlayers();

    return () => {
      controller.abort();
    };
  }, [searchTerm, selectedTeamId, minMinutes, minRating, sortBy, sortOrder, page, pageSize, retryTrigger]);

  // Handle filter resets
  const handleResetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedTeamId('');
    setMinMinutes('');
    setMinRating('');
    setSortBy('rating');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Users size={26} color="var(--color-primary)" />
          <h1 className="pixel-title" style={{ fontSize: '22px' }}>
            TALENT SCOUTING & DIRECTORY
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '780px' }}>
          Benchmark players across Danish Superliga 2025/26. Filter talent by playing thresholds, official match ratings, and per-90 metrics.
        </p>
      </div>

      {/* Filter & Search Control Panel */}
      <div className="pixel-card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end',
        }}>
          {/* Search by Name */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Search Player
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="e.g. Tonni, Franculino..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--border-color-pixel)',
                  color: 'var(--text-primary)',
                  padding: '10px 12px 10px 36px',
                  fontSize: '14px',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Filter by Club */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Filter Club
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--border-color-pixel)',
                color: 'var(--text-primary)',
                padding: '10px 12px',
                fontSize: '14px',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
              }}
            >
              <option value="">All Clubs (12 Teams)</option>
              {teamsList.map((t) => (
                <option key={t.team_id} value={t.team_id}>
                  {t.team_name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Min Minutes */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Min Minutes
            </label>
            <select
              value={minMinutes}
              onChange={(e) => {
                setMinMinutes(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--border-color-pixel)',
                color: 'var(--text-primary)',
                padding: '10px 12px',
                fontSize: '14px',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
              }}
            >
              <option value="">Any Pitch Time</option>
              <option value="250">250+ Minutes</option>
              <option value="500">500+ Minutes</option>
              <option value="900">900+ Minutes (Sample reliable)</option>
              <option value="1500">1,500+ Minutes (Regular starters)</option>
            </select>
          </div>

          {/* Filter by Min Rating */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Min Rating
            </label>
            <select
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--border-color-pixel)',
                color: 'var(--text-primary)',
                padding: '10px 12px',
                fontSize: '14px',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
              }}
            >
              <option value="">Any Rating</option>
              <option value="6.5">6.50+ Rating</option>
              <option value="7.0">7.00+ Rating</option>
              <option value="7.2">7.20+ Rating (Top Tier)</option>
            </select>
          </div>

          {/* Sort By & Direction */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Sort Metric
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                style={{
                  flex: 1,
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--border-color-pixel)',
                  color: 'var(--text-primary)',
                  padding: '10px 12px',
                  fontSize: '14px',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="pixel-btn pixel-btn-outline"
                style={{ padding: '0 12px', fontSize: '11px' }}
                title={`Order: ${sortOrder.toUpperCase()}`}
              >
                <ArrowUpDown size={14} /> {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>
        </div>

        {/* Reset Filter Button */}
        {(searchTerm || selectedTeamId || minMinutes || minRating || sortBy !== 'rating' || sortOrder !== 'desc') && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleResetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} /> Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingSpinner message="QUERYING SCOUTIQ PLAYER DATABASE..." />}
      {error && !loading && (
        <ErrorMessage
          title="DATABASE QUERY ERROR"
          message={error}
          onRetry={() => setRetryTrigger(c => c + 1)}
        />
      )}

      {/* Results Table & Pagination */}
      {!loading && !error && playersData && (
        <div>
          {/* Metadata bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Found <strong style={{ color: 'var(--color-primary)' }}>{playersData.total}</strong> players matching criteria.
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Page {playersData.page} of {playersData.total_pages}
            </div>
          </div>

          {/* Empty Results State */}
          {playersData.items.length === 0 ? (
            <div className="pixel-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <Users size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <h3 className="pixel-title" style={{ fontSize: '14px', marginBottom: '8px' }}>
                NO PLAYERS FOUND
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px auto' }}>
                No player records match the current filter criteria. Try adjusting the minimum pitch time, rating threshold, or search query.
              </p>
              <button onClick={handleResetFilters} className="pixel-btn">
                <RotateCcw size={12} /> RESET FILTERS
              </button>
            </div>
          ) : (
            <>
              {/* Data Table */}
              <div className="pixel-table-container" style={{ marginBottom: '20px' }}>
                <table className="pixel-table">
                  <thead>
                    <tr>
                      <th>PLAYER</th>
                      <th>CLUB</th>
                      <th>APPS</th>
                      <th>MINS</th>
                      <th>RATING</th>
                      <th>G/90</th>
                      <th>A/90</th>
                      <th>KEY PASS/90</th>
                      <th>PASS %</th>
                      <th>TKL/90</th>
                      <th style={{ textAlign: 'right' }}>PROFILE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playersData.items.map((player) => (
                      <tr key={player.player_id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {player.player_name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ID: #{player.player_id}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            background: 'var(--color-bg-surface)',
                            border: '1px solid var(--border-color-pixel)',
                            color: 'var(--color-secondary)',
                            fontSize: '12px',
                            borderRadius: '3px',
                            fontWeight: 500,
                          }}>
                            {player.team_name}
                          </span>
                        </td>
                        <td>{player.appearances}</td>
                        <td>{Math.round(player.minutes_played)}</td>
                        <td style={{
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '12px',
                          color: player.rating >= 7.2 ? 'var(--color-primary)' : player.rating ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontWeight: 700,
                        }}>
                          {player.rating !== null ? player.rating : '—'}
                        </td>
                        <td style={{ color: player.goals_per90 > 0.4 ? 'var(--color-pitch)' : 'inherit', fontWeight: player.goals_per90 > 0.4 ? 600 : 400 }}>
                          {player.goals_per90}
                        </td>
                        <td style={{ color: player.assists_per90 > 0.3 ? 'var(--color-secondary)' : 'inherit', fontWeight: player.assists_per90 > 0.3 ? 600 : 400 }}>
                          {player.assists_per90}
                        </td>
                        <td>{player.key_passes_per90}</td>
                        <td>
                          {player.pass_accuracy_percentage !== null ? `${player.pass_accuracy_percentage}%` : '—'}
                        </td>
                        <td>{player.tackles_per90}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => toggleShortlist(player)}
                              className={`pixel-btn ${isShortlisted(player.player_id) ? 'pixel-btn-primary' : 'pixel-btn-outline'}`}
                              style={{
                                padding: '6px 8px',
                                fontSize: '9px',
                              }}
                              title={isShortlisted(player.player_id) ? 'Remove from Shortlist' : 'Add to Recruitment Shortlist'}
                            >
                              {isShortlisted(player.player_id) ? <Check size={11} /> : <BookmarkPlus size={11} />}
                            </button>
                            <Link
                              to={`/players/${player.player_id}`}
                              className="pixel-btn pixel-btn-outline"
                              style={{
                                padding: '6px 10px',
                                fontSize: '9px',
                                textDecoration: 'none',
                              }}
                            >
                              <Eye size={12} /> PROFILE
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                padding: '12px 0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value, 10));
                      setPage(1);
                    }}
                    style={{
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--border-color-pixel)',
                      color: 'var(--text-primary)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                    className="pixel-btn pixel-btn-outline"
                    style={{
                      padding: '8px 12px',
                      opacity: page <= 1 ? 0.4 : 1,
                      cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <ChevronLeft size={14} /> PREV
                  </button>

                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--text-secondary)' }}>
                    PAGE {page} OF {playersData.total_pages}
                  </span>

                  <button
                    onClick={() => setPage((prev) => Math.min(playersData.total_pages, prev + 1))}
                    disabled={page >= playersData.total_pages}
                    className="pixel-btn pixel-btn-outline"
                    style={{
                      padding: '8px 12px',
                      opacity: page >= playersData.total_pages ? 0.4 : 1,
                      cursor: page >= playersData.total_pages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    NEXT <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
