import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShortlist } from '../context/ShortlistContext';
import {
  BookmarkCheck,
  Trash2,
  GitCompare,
  Eye,
  Users,
  Trophy,
  Info,
  Search,
  ExternalLink,
  Shield,
  Sparkles,
} from 'lucide-react';

export default function ShortlistPage() {
  const { shortlist, removeFromShortlist, clearShortlist, count } = useShortlist();
  const [filterQuery, setFilterQuery] = useState('');

  const filteredShortlist = shortlist.filter((p) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      (p.player_name && p.player_name.toLowerCase().includes(q)) ||
      (p.team_name && p.team_name.toLowerCase().includes(q))
    );
  });

  // Calculate quick summary metrics
  const validRatings = shortlist.filter((p) => p.rating !== null && !isNaN(p.rating));
  const avgRating = validRatings.length > 0
    ? (validRatings.reduce((sum, p) => sum + Number(p.rating), 0) / validRatings.length).toFixed(2)
    : '—';
  const uniqueClubs = new Set(shortlist.map((p) => p.team_name)).size;

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
            <BookmarkCheck size={26} color="var(--color-primary)" />
            <h1 className="pixel-title" style={{ fontSize: '22px' }}>
              RECRUITMENT SHORTLIST
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '780px' }}>
            Personal recruitment watch list. Manage target scouting candidates and cross-examine performance dossiers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link
            to="/rankings"
            className="pixel-btn pixel-btn-outline"
            style={{ fontSize: '10px', padding: '8px 14px', textDecoration: 'none' }}
          >
            <Trophy size={13} /> SCOUTING LEADERBOARDS
          </Link>
          <Link
            to="/players"
            className="pixel-btn pixel-btn-primary"
            style={{ fontSize: '10px', padding: '8px 14px', textDecoration: 'none' }}
          >
            <Users size={13} /> BROWSE PLAYERS
          </Link>
        </div>
      </div>

      {/* Local Storage Privacy & Architecture Alert */}
      <div style={{
        background: 'rgba(6, 182, 212, 0.08)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: 'var(--radius-sm)',
        padding: '14px 18px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
      }}>
        <Info size={18} color="var(--color-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--color-secondary)' }}>Local Browser Persistence: </strong>
          Your recruitment shortlist is saved client-side in your current browser's <code>localStorage</code>.
          No credentials or personal identifiers are stored. Please note that data is local to this specific browser and device, and is not synchronized across external networks.
        </div>
      </div>

      {/* Summary KPI Strip */}
      {count > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}>
          <div className="pixel-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>SAVED CANDIDATES</div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '24px', color: 'var(--color-primary)', marginTop: '4px' }}>
              {count} {count === 1 ? 'PLAYER' : 'PLAYERS'}
            </div>
          </div>
          <div className="pixel-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>AVG SQUAD RATING</div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '24px', color: 'var(--color-pitch)', marginTop: '4px' }}>
              {avgRating}
            </div>
          </div>
          <div className="pixel-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>CLUBS REPRESENTED</div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '24px', color: 'var(--color-secondary)', marginTop: '4px' }}>
              {uniqueClubs} OF 12
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {count === 0 ? (
        /* Empty State */
        <div className="pixel-card" style={{ textAlign: 'center', padding: '60px 24px', marginTop: '16px' }}>
          <BookmarkCheck size={48} color="var(--border-color-subtle)" style={{ marginBottom: '16px' }} />
          <h2 className="pixel-title" style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            RECRUITMENT SHORTLIST IS EMPTY
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 24px auto', fontSize: '13px' }}>
            You haven't added any players to your recruitment shortlist yet. Browse tactical leaderboards or the player directory to bookmark scouting prospects.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <Link
              to="/rankings"
              className="pixel-btn pixel-btn-primary"
              style={{ fontSize: '11px', padding: '10px 18px', textDecoration: 'none' }}
            >
              <Trophy size={14} /> EXPLORE LEADERBOARDS
            </Link>
            <Link
              to="/players"
              className="pixel-btn pixel-btn-outline"
              style={{ fontSize: '11px', padding: '10px 18px', textDecoration: 'none' }}
            >
              <Users size={14} /> SCOUT PLAYER DIRECTORY
            </Link>
          </div>
        </div>
      ) : (
        /* Populated Shortlist Table */
        <div className="pixel-card">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
          }}>
            {/* Search filter inside shortlist */}
            <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter saved targets..."
                style={{
                  width: '100%',
                  background: 'var(--color-bg-surface-elevated)',
                  border: '1px solid var(--border-color-pixel)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px 8px 36px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Clear All action */}
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your entire recruitment shortlist?')) {
                  clearShortlist();
                }
              }}
              className="pixel-btn pixel-btn-outline"
              style={{
                fontSize: '10px',
                padding: '6px 12px',
                color: 'var(--color-danger)',
                borderColor: 'var(--color-danger)',
              }}
            >
              <Trash2 size={12} /> CLEAR SHORTLIST
            </button>
          </div>

          <div className="pixel-table-container">
            <table className="pixel-table">
              <thead>
                <tr>
                  <th>PLAYER</th>
                  <th>CLUB</th>
                  <th>APPS</th>
                  <th>MINS</th>
                  <th>RATING</th>
                  <th>G / 90</th>
                  <th>A / 90</th>
                  <th>KEY PASS / 90</th>
                  <th>TACKLES / 90</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredShortlist.map((player) => (
                  <tr key={player.player_id}>
                    <td>
                      <Link
                        to={`/players/${player.player_id}`}
                        style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}
                      >
                        {player.player_name}
                      </Link>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--border-color-pixel)',
                        color: 'var(--color-secondary)',
                        fontSize: '12px',
                        borderRadius: '3px',
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
                      {player.goals_per90 !== null && player.goals_per90 !== undefined ? player.goals_per90 : '—'}
                    </td>
                    <td style={{ color: player.assists_per90 > 0.3 ? 'var(--color-secondary)' : 'inherit', fontWeight: player.assists_per90 > 0.3 ? 600 : 400 }}>
                      {player.assists_per90 !== null && player.assists_per90 !== undefined ? player.assists_per90 : '—'}
                    </td>
                    <td>
                      {player.key_passes_per90 !== null && player.key_passes_per90 !== undefined ? player.key_passes_per90 : '—'}
                    </td>
                    <td>
                      {player.tackles_per90 !== null && player.tackles_per90 !== undefined ? player.tackles_per90 : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link
                          to={`/players/${player.player_id}`}
                          className="pixel-btn pixel-btn-outline"
                          style={{ padding: '4px 8px', fontSize: '9px', textDecoration: 'none' }}
                          title="View Player Profile"
                        >
                          <Eye size={12} />
                        </Link>
                        <Link
                          to={`/compare?player_ids=${player.player_id}`}
                          className="pixel-btn pixel-btn-outline"
                          style={{ padding: '4px 8px', fontSize: '9px', textDecoration: 'none' }}
                          title="Compare with another player"
                        >
                          <GitCompare size={12} />
                        </Link>
                        <button
                          onClick={() => removeFromShortlist(player.player_id)}
                          className="pixel-btn pixel-btn-outline"
                          style={{
                            padding: '4px 8px',
                            fontSize: '9px',
                            color: 'var(--color-danger)',
                            borderColor: 'var(--color-danger)',
                          }}
                          title="Remove from Shortlist"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
