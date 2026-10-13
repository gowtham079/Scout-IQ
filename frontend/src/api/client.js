/**
 * ScoutIQ Centralized API Client
 * Uses relative /api URLs routed through the Vite proxy in development
 * and directly to the FastAPI server in production.
 */

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || '/api'
).replace(/\/+$/, '');

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

export const api = {
  /**
   * Check backend operational status and MySQL connectivity.
   */
  getHealth: () => request('/health'),

  /**
   * Fetch Danish Superliga league overview KPIs and distributions.
   */
  getOverview: (seasonId = 25536) => request(`/overview?season_id=${seasonId}`),

  /**
   * Search, filter, and paginate player scouting features.
   * Supports options (e.g. AbortController signal).
   */
  getPlayers: (params = {}, options = {}) => {
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
  getPlayerDetail: (playerId) => request(`/players/${playerId}`),

  /**
   * Retrieve official team standings and calculated point records.
   */
  getTeams: (seasonId = 25536) => request(`/teams?season_id=${seasonId}`),

  /**
   * Retrieve single team details and squad contributors.
   */
  getTeamDetail: (teamId, seasonId = 25536) => request(`/teams/${teamId}?season_id=${seasonId}`),

  /**
   * Head-to-head comparison of two players across all normalized metrics.
   */
  comparePlayers: (playerId1, playerId2) => request(`/scouting/compare?player_ids=${playerId1},${playerId2}`),

  /**
   * Retrieve top performers across the four documented tactical categories.
   */
  getTopPerformers: (seasonId = 25536) => request(`/scouting/top-performers?season_id=${seasonId}`),
};
