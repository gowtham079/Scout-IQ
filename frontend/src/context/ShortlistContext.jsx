import React, { createContext, useContext, useState, useEffect } from 'react';

const SHORTLIST_STORAGE_KEY = 'scoutiq_recruitment_shortlist';

const ShortlistContext = createContext(null);

export function ShortlistProvider({ children }) {
  const [shortlist, setShortlist] = useState(() => {
    try {
      const stored = localStorage.getItem(SHORTLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Validate structure and sanitize items
          return parsed.filter(item => item && (item.player_id !== undefined && item.player_id !== null));
        }
      }
    } catch (err) {
      console.warn('[ScoutIQ Shortlist] Failed to parse local shortlist:', err);
    }
    return [];
  });

  // Sync state changes with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(shortlist));
    } catch (err) {
      console.error('[ScoutIQ Shortlist] Failed to persist shortlist to localStorage:', err);
    }
  }, [shortlist]);

  // Check if player ID is in shortlist
  const isShortlisted = (playerId) => {
    if (playerId === undefined || playerId === null) return false;
    return shortlist.some(p => Number(p.player_id) === Number(playerId));
  };

  // Add player to shortlist (prevents duplicate entries)
  const addToShortlist = (player) => {
    if (!player || player.player_id === undefined || player.player_id === null) return false;

    const pid = Number(player.player_id);
    if (shortlist.some(p => Number(p.player_id) === pid)) {
      return false; // Already present
    }

    const newEntry = {
      player_id: pid,
      player_name: player.player_name || 'Unknown Player',
      team_name: player.team_name || 'Unknown Club',
      minutes_played: Number(player.minutes_played) || 0,
      appearances: Number(player.appearances) || 0,
      rating: player.rating !== undefined && player.rating !== null ? Number(player.rating) : (player.average_rating !== undefined ? Number(player.average_rating) : null),
      goals_per90: player.goals_per90 !== undefined && player.goals_per90 !== null ? Number(player.goals_per90) : null,
      assists_per90: player.assists_per90 !== undefined && player.assists_per90 !== null ? Number(player.assists_per90) : null,
      key_passes_per90: player.key_passes_per90 !== undefined && player.key_passes_per90 !== null ? Number(player.key_passes_per90) : null,
      tackles_per90: player.tackles_per90 !== undefined && player.tackles_per90 !== null ? Number(player.tackles_per90) : null,
      notes: '',
      saved_at: new Date().toISOString(),
    };

    setShortlist(prev => [newEntry, ...prev]);
    return true;
  };

  // Remove player from shortlist
  const removeFromShortlist = (playerId) => {
    if (playerId === undefined || playerId === null) return;
    const pid = Number(playerId);
    setShortlist(prev => prev.filter(p => Number(p.player_id) !== pid));
  };

  // Toggle player presence
  const toggleShortlist = (player) => {
    if (!player) return;
    const pid = Number(player.player_id);
    if (isShortlisted(pid)) {
      removeFromShortlist(pid);
      return false;
    } else {
      addToShortlist(player);
      return true;
    }
  };

  // Clear all entries
  const clearShortlist = () => {
    setShortlist([]);
  };

  return (
    <ShortlistContext.Provider
      value={{
        shortlist,
        isShortlisted,
        addToShortlist,
        removeFromShortlist,
        toggleShortlist,
        clearShortlist,
        count: shortlist.length,
      }}
    >
      {children}
    </ShortlistContext.Provider>
  );
}

export function useShortlist() {
  const context = useContext(ShortlistContext);
  if (!context) {
    throw new Error('useShortlist must be used within a ShortlistProvider');
  }
  return context;
}
