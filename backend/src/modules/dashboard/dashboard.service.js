/**
 * Dashboard service layer — SCR-002, SCR-014, SCR-015
 *
 * SCR-002  : Personalized overview (tickets, approvals, assignments, tasks)
 * SCR-014  : Live KPIs — open incidents, SLA breaches, resolution time, mood check-in
 * SCR-015  : Scrolled view — team breakdown, category breakdown, new tickets panel
 */

const {
  getKpis,
  getMoodEntries,
  saveMoodEntry,
  getTeamBreakdown,
  getCategoryBreakdown,
  getNewTickets,
} = require('./dashboard.model');

const VALID_MOODS = ['Great', 'Good', 'Neutral', 'Struggling', 'Overwhelmed'];

// ─── SCR-014: KPI Aggregation ─────────────────────────────────────────────────

/**
 * Return live KPI metrics: open incidents, SLA breaches, average resolution time.
 * Formatted resolution time is appended for UI convenience.
 */
const getDashboardKpis = async () => {
  const kpis = await getKpis();
  const { avgResolutionTimeMinutes } = kpis;
  const hours = Math.floor(avgResolutionTimeMinutes / 60);
  const minutes = avgResolutionTimeMinutes % 60;

  return {
    ...kpis,
    avgResolutionTimeFormatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
  };
};

// ─── SCR-014: Mood Check-in ───────────────────────────────────────────────────

/**
 * Retrieve the mood check-in for the acting agent (scoped by agentId).
 */
const getAgentMood = async (agentId) => {
  const entries = await getMoodEntries(agentId);
  return entries.length > 0 ? entries[0] : null;
};

/**
 * Submit a mood check-in for the acting agent.
 * Validates mood value against the allowed enum.
 */
const submitMood = async (agentId, mood) => {
  if (!mood) {
    const error = new Error('mood is required');
    error.statusCode = 400;
    throw error;
  }

  const matched = VALID_MOODS.find(
    (m) => m.toLowerCase() === mood.trim().toLowerCase()
  );

  if (!matched) {
    const error = new Error(`mood must be one of: ${VALID_MOODS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  return saveMoodEntry(agentId, matched);
};

// ─── SCR-015: Team & Category Breakdown ──────────────────────────────────────

/**
 * Return incidents grouped by support team.
 */
const getIncidentsByTeam = async () => getTeamBreakdown();

/**
 * Return incidents grouped by category.
 */
const getIncidentsByCategory = async () => getCategoryBreakdown();

// ─── SCR-015: New Tickets Panel ───────────────────────────────────────────────

/**
 * Return the latest new tickets, ordered by createdAt descending.
 * Accepts an optional limit (default 10, max 50).
 */
const getNewTicketsPanel = async (query = {}) => {
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const tickets = await getNewTickets(limit);
  return tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

module.exports = {
  VALID_MOODS,
  getDashboardKpis,
  getAgentMood,
  submitMood,
  getIncidentsByTeam,
  getIncidentsByCategory,
  getNewTicketsPanel,
};
