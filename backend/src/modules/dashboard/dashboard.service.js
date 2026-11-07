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
  getAgentSummaryData,
  getWorkloadBreakdown,
} = require('./dashboard.model');

const { getTickets } = require('../my-work/my-work.model');

const VALID_MOODS = ['Great', 'Good', 'Neutral', 'Struggling', 'Overwhelmed'];

// ─── SCR-014: KPI Aggregation ─────────────────────────────────────────────────

/**
 * Return live KPI metrics: open incidents, SLA breaches, average resolution time.
 * Formatted resolution time is appended for UI convenience.
 */
const getDashboardKpis = async (organisationId = null) => {
  const kpis = await getKpis(organisationId);
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

  // BI-6 FIX: Guard typeof before calling .trim() — a number or object payload
  // crashes with a TypeError instead of returning a 400 validation error.
  if (typeof mood !== 'string') {
    const error = new Error('mood must be a string');
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
 * BI-7 FIX: Sort the full collection first, then slice \u2014 the model no longer
 * pre-slices, so we always get the true N most-recent tickets.
 */
const getNewTicketsPanel = async (query = {}, organisationId = null) => {
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const tickets = await getNewTickets(organisationId);
  return tickets
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
};

// ─── SCR-002: Personalized Dashboard Summary ────────────────────────────────

/**
 * Return a personalized overview for the acting agent (SCR-002).
 * Aggregates:
 *   - Ticket counts per status (from my-work model — single source of truth)
 *   - Pending approvals count
 *   - Assignments count
 *   - Tasks count
 */
const getAgentSummary = async (agentId, organisationId = null) => {
  // Pull all tickets owned by this agent from the my-work model
  const allTickets = await getTickets({ assignedAgentId: agentId, organisationId });

  const ticketCounts = {
    active: allTickets.filter((t) => t.status === 'Active').length,
    pending: allTickets.filter((t) => t.status === 'Pending').length,
    actioned: allTickets.filter((t) => t.status === 'Actioned').length,
    onHold: allTickets.filter((t) => t.status === 'On Hold').length,
    total: allTickets.length,
  };

  // Pull personalized approvals / assignments / tasks
  const { approvals, assignments, tasks } = await getAgentSummaryData(agentId);

  return {
    tickets: ticketCounts,
    approvals,
    assignments,
    tasks,
  };
};

// ─── Workload KPIs: Tickets by Priority + Team Distribution ──────────────────

/**
 * Return workload distribution data used by dashboard visualisations (SCR-015):
 *   - ticketsByPriority: counts for the donut chart (Critical / High / Medium / Low)
 *   - ticketsByTeam    : counts per team for the bar chart
 *   - unassignedTickets: total active tickets with no assigned agent
 *   - pendingApprovals : org-wide pending approval count
 *   - avgResponseTimeMinutes: avg time-to-first-response (from timeRecord proxy)
 *
 * Falls back to computed mock data in test / offline mode.
 */
const getWorkloadKpis = async (organisationId = null) => {
  // Fetch all tickets scoped to the organisation (or all orgs for admins)
  const filters = organisationId ? { organisationId } : {};
  const allTickets = await getTickets(filters);

  // ── Tickets by Priority (donut chart) ──────────────────────────────────────
  const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
  const priorityCounts = priorityOrder.reduce((acc, p) => {
    acc[p] = allTickets.filter((t) => t.priority === p).length;
    return acc;
  }, {});

  const ticketsByPriority = priorityOrder.map((priority) => ({
    priority,
    count: priorityCounts[priority],
  }));

  // ── Unassigned tickets (active, no agent) ──────────────────────────────────
  const unassignedTickets = allTickets.filter(
    (t) => t.status === 'Active' && (!t.assignedAgentId || t.assignedAgentId === '')
  ).length;

  // ── Average response time ──────────────────────────────────────────────────
  // Proxy: use timeRecord on Actioned/On Hold/Pending tickets as a first-response
  // signal until a dedicated responseTime field is added.
  const respondedTickets = allTickets.filter(
    (t) => t.status !== 'Active' && typeof t.timeRecord === 'number' && t.timeRecord > 0
  );
  const avgResponseTimeMinutes = respondedTickets.length
    ? Math.round(
        respondedTickets.reduce((sum, t) => sum + t.timeRecord, 0) / respondedTickets.length
      )
    : 0;

  const avgResponseHours = Math.floor(avgResponseTimeMinutes / 60);
  const avgResponseMins = avgResponseTimeMinutes % 60;

  // ── Team breakdown (bar chart) — reuse existing team breakdown model ────────
  const ticketsByTeam = await getTeamBreakdown();

  return {
    ticketsByPriority,
    ticketsByTeam,
    unassignedTickets,
    avgResponseTimeMinutes,
    avgResponseTimeFormatted:
      avgResponseHours > 0
        ? `${avgResponseHours}h ${avgResponseMins}m`
        : `${avgResponseMins}m`,
  };
};

module.exports = {
  VALID_MOODS,
  getDashboardKpis,
  getAgentMood,
  submitMood,
  getIncidentsByTeam,
  getIncidentsByCategory,
  getNewTicketsPanel,
  getAgentSummary,
  getWorkloadKpis,
};
