/**
 * ScoutIQ Centralized API Client
 *
 * Supports two operational modes:
 * 1. Live API Mode (default): Communicates with the FastAPI backend over HTTP.
 * 2. Static Demo Mode (VITE_STATIC_DEMO=true): Operates 100% in-browser using
 *    pre-computed real analytical datasets from `/data/` without any running backend.
 */

export const IS_STATIC_DEMO =
  (typeof import.meta !== 'undefined' && (
    import.meta.env?.VITE_STATIC_DEMO === 'true' ||
    import.meta.env?.VITE_STATIC_DEMO === true
  )) ||
  (typeof process !== 'undefined' && (
    process.env?.VITE_STATIC_DEMO === 'true' ||
    process.env?.VITE_STATIC_DEMO === true
  )) ||
  false;

const API_BASE = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '/api'
).replace(/\/+$/, '');

const DATA_BASE = `${(
  (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
).replace(/\/+$/, '')}/data`;

/**
 * In-memory dataset cache for static demo mode.
 * Prevents duplicate network downloads across route transitions.
 */
const staticCache = {
  overview: null,
  teams: null,
  team_details: null,
  players: null,
  player_details: null,
  rankings: null,
};

/**
 * Fetch and memoize static JSON datasets.
 */
async function fetchStatic(key, filename) {
  if (staticCache[key]) {
    return staticCache[key];
  }
  const url = `${DATA_BASE}/${filename}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load static dataset [${filename}]: HTTP ${response.status}`);
    }
    const data = await response.json();
    staticCache[key] = data;
    return data;
  } catch (err) {
    console.error(`[Static Demo Error] Loading ${filename} failed:`, err);
    throw err;
  }
}

/**
 * 18 Canonical Comparison Metrics matching backend/app/services/scouting_service.py
 */
const COMPARISON_METRIC_CONFIGS = [
  ['rating', 'Match Rating'],
  ['minutes_played', 'Minutes Played'],
  ['appearances', 'Appearances'],
  ['goals_per90', 'Goals / 90'],
  ['assists_per90', 'Assists / 90'],
  ['shots_per90', 'Shots / 90'],
  ['key_passes_per90', 'Key Passes / 90'],
  ['passes_per90', 'Passes / 90'],
  ['pass_accuracy_percentage', 'Pass Accuracy %'],
  ['successful_dribbles_per90', 'Successful Dribbles / 90'],
  ['tackles_per90', 'Tackles / 90'],
  ['tackle_success_percentage', 'Tackle Success %'],
  ['interceptions_per90', 'Interceptions / 90'],
  ['clearances_per90', 'Clearances / 90'],
  ['duels_won_per90', 'Duels Won / 90'],
  ['duel_win_percentage', 'Duel Win %'],
  ['shot_accuracy_percentage', 'Shot Accuracy %'],
  ['touches_per90', 'Touches / 90'],
];

// ============================================================================
// STATIC DEMO ENGINE IMPLEMENTATION
// ============================================================================

async function getHealthStatic() {
  return {
    status: 'healthy',
    demo_mode: true,
    database: {
      status: 'static_cache',
      database: 'Static Portfolio Engine (Real 2025/26 Superliga Data)',
    },
  };
}

async function getOverviewStatic() {
  return fetchStatic('overview', 'overview.json');
}

async function getTeamsStatic() {
  return fetchStatic('teams', 'teams.json');
}

async function getTeamDetailStatic(teamId) {
  const detailsMap = await fetchStatic('team_details', 'team_details.json');
  const detail = detailsMap[String(teamId)];
  if (!detail) {
    const error = new Error(`Team with ID ${teamId} was not found in the database.`);
    error.status = 404;
    throw error;
  }
  return detail;
}

async function getPlayersStatic(params = {}, options = {}) {
  if (options.signal?.aborted) {
    const abortErr = new Error('The user aborted a request.');
    abortErr.name = 'AbortError';
    throw abortErr;
  }

  const data = await fetchStatic('players', 'players.json');
  let list = Array.isArray(data) ? data : data.items || [];

  // 1. Text search on player_name
  if (params.search && typeof params.search === 'string') {
    const q = params.search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => (p.player_name || '').toLowerCase().includes(q));
    }
  }

  // 2. Filter by team_id
  if (params.team_id !== undefined && params.team_id !== null && params.team_id !== '') {
    const tid = Number(params.team_id);
    if (!isNaN(tid)) {
      list = list.filter((p) => Number(p.team_id) === tid);
    }
  }

  // 3. Filter by min_minutes
  if (params.min_minutes !== undefined && params.min_minutes !== null && params.min_minutes !== '') {
    const mins = Number(params.min_minutes);
    if (!isNaN(mins) && mins > 0) {
      list = list.filter((p) => Number(p.minutes_played || 0) >= mins);
    }
  }

  // 4. Filter by min_rating
  if (params.min_rating !== undefined && params.min_rating !== null && params.min_rating !== '') {
    const rating = Number(params.min_rating);
    if (!isNaN(rating) && rating > 0) {
      list = list.filter((p) => p.rating !== null && p.rating !== undefined && Number(p.rating) >= rating);
    }
  }

  // 5. Sorting
  const sortBy = params.sort_by || 'rating';
  const sortOrder = (params.sort_order || 'desc').toLowerCase();
  const isAsc = sortOrder === 'asc';

  list = list.slice().sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];

    const aIsNull = valA === null || valA === undefined;
    const bIsNull = valB === null || valB === undefined;

    if (aIsNull && bIsNull) return 0;
    // Follow SQL ordering: nulls last in DESC, nulls first in ASC
    if (aIsNull) return isAsc ? -1 : 1;
    if (bIsNull) return isAsc ? 1 : -1;

    if (typeof valA === 'string' && typeof valB === 'string') {
      const cmp = valA.localeCompare(valB);
      if (cmp !== 0) return isAsc ? cmp : -cmp;
    } else {
      const numA = Number(valA);
      const numB = Number(valB);
      if (numA !== numB) {
        return isAsc ? numA - numB : numB - numA;
      }
    }

    // Tie-breaker: player_name ASC
    return (a.player_name || '').localeCompare(b.player_name || '');
  });

  // 6. Pagination
  const total = list.length;
  const pageSize = Math.max(1, Math.min(100, Number(params.page_size) || 20));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * pageSize;
  const items = list.slice(offset, offset + pageSize);

  return {
    items,
    total,
    page,
    page_size: pageSize,
    total_pages: totalPages,
  };
}

async function getPlayerDetailStatic(playerId) {
  const detailsMap = await fetchStatic('player_details', 'player_details.json');
  const detail = detailsMap[String(playerId)];
  if (!detail) {
    const error = new Error(`Player with ID ${playerId} was not found in the scouting database.`);
    error.status = 404;
    throw error;
  }
  return detail;
}

async function comparePlayersStatic(playerId1, playerId2) {
  const p1Id = Number(playerId1);
  const p2Id = Number(playerId2);

  if (isNaN(p1Id) || isNaN(p2Id)) {
    const error = new Error('Player IDs must be valid integer numbers.');
    error.status = 400;
    throw error;
  }

  if (p1Id === p2Id) {
    const error = new Error('Please specify two different player IDs for comparison.');
    error.status = 400;
    throw error;
  }

  const detailsMap = await fetchStatic('player_details', 'player_details.json');
  const p1Detail = detailsMap[String(p1Id)];
  const p2Detail = detailsMap[String(p2Id)];

  let p1Item = p1Detail?.scouting_features;
  let p2Item = p2Detail?.scouting_features;

  if (!p1Item || !p2Item) {
    const playersData = await fetchStatic('players', 'players.json');
    const items = Array.isArray(playersData) ? playersData : playersData.items || [];
    if (!p1Item) {
      p1Item = items.find((p) => Number(p.player_id) === p1Id);
    }
    if (!p2Item) {
      p2Item = items.find((p) => Number(p.player_id) === p2Id);
    }
  }

  if (!p1Item || !p2Item) {
    const error = new Error(`One or both players (IDs: ${playerId1}, ${playerId2}) could not be found in the database.`);
    error.status = 404;
    throw error;
  }

  const metricComparisons = COMPARISON_METRIC_CONFIGS.map(([key, label]) => {
    const rawVal1 = p1Item[key];
    const rawVal2 = p2Item[key];

    const val1 = rawVal1 !== null && rawVal1 !== undefined ? Number(rawVal1) : null;
    const val2 = rawVal2 !== null && rawVal2 !== undefined ? Number(rawVal2) : null;

    let diff = null;
    let leader = null;

    if (val1 !== null && val2 !== null) {
      diff = Number((val1 - val2).toFixed(2));
      if (val1 > val2) {
        leader = p1Id;
      } else if (val2 > val1) {
        leader = p2Id;
      }
    }

    return {
      metric: key,
      label,
      player1_value: val1,
      player2_value: val2,
      difference: diff,
      leader_player_id: leader,
    };
  });

  return {
    player1: p1Item,
    player2: p2Item,
    comparison_metrics: metricComparisons,
  };
}

async function getTopPerformersStatic() {
  return fetchStatic('rankings', 'rankings.json');
}

// ============================================================================
// LIVE API REQUEST HANDLER
// ============================================================================

/**
 * Generic JSON request handler with comprehensive error processing.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.detail) {
          errorMessage = typeof errorBody.detail === 'string'
            ? errorBody.detail
            : JSON.stringify(errorBody.detail);
        }
      } catch {
        // Fall back to HTTP status message
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error(`[API Client Error] Request to ${url} failed:`, err);
    }
    throw err;
  }
}

// ============================================================================
// PUBLIC SCOUTIQ API CLIENT
// ============================================================================

export const api = {
  /**
   * Check backend operational status or static demo readiness.
   */
  getHealth: () => {
    if (IS_STATIC_DEMO) {
      return getHealthStatic();
    }
    return request('/health');
  },

  /**
   * Fetch Danish Superliga league overview KPIs and distributions.
   */
  getOverview: (seasonId = 25536) => {
    if (IS_STATIC_DEMO) {
      return getOverviewStatic();
    }
    return request(`/overview?season_id=${seasonId}`);
  },

  /**
   * Search, filter, and paginate player scouting features.
   * Supports options (e.g. AbortController signal).
   */
  getPlayers: (params = {}, options = {}) => {
    if (IS_STATIC_DEMO) {
      return getPlayersStatic(params, options);
    }
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.team_id) query.append('team_id', params.team_id);
    if (params.min_minutes !== undefined && params.min_minutes !== null) query.append('min_minutes', params.min_minutes);
    if (params.min_rating !== undefined && params.min_rating !== null) query.append('min_rating', params.min_rating);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);

    const queryString = query.toString();
    return request(`/players${queryString ? `?${queryString}` : ''}`, options);
  },

  /**
   * Retrieve exhaustive player profile, season totals, and per-90 metrics.
   */
  getPlayerDetail: (playerId) => {
    if (IS_STATIC_DEMO) {
      return getPlayerDetailStatic(playerId);
    }
    return request(`/players/${playerId}`);
  },

  /**
   * Retrieve official team standings and calculated point records.
   */
  getTeams: (seasonId = 25536) => {
    if (IS_STATIC_DEMO) {
      return getTeamsStatic();
    }
    return request(`/teams?season_id=${seasonId}`);
  },

  /**
   * Retrieve single team details and squad contributors.
   */
  getTeamDetail: (teamId, seasonId = 25536) => {
    if (IS_STATIC_DEMO) {
      return getTeamDetailStatic(teamId);
    }
    return request(`/teams/${teamId}?season_id=${seasonId}`);
  },

  /**
   * Head-to-head comparison of two players across all normalized metrics.
   */
  comparePlayers: (playerId1, playerId2) => {
    if (IS_STATIC_DEMO) {
      return comparePlayersStatic(playerId1, playerId2);
    }
    return request(`/scouting/compare?player_ids=${playerId1},${playerId2}`);
  },

  /**
   * Retrieve top performers across the four documented tactical categories.
   */
  getTopPerformers: (seasonId = 25536) => {
    if (IS_STATIC_DEMO) {
      return getTopPerformersStatic();
    }
    return request(`/scouting/top-performers?season_id=${seasonId}`);
  },
};
