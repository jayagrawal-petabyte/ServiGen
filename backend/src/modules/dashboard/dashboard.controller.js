const {
  getDashboardKpis,
  getAgentMood,
  submitMood,
  getIncidentsByTeam,
  getIncidentsByCategory,
  getNewTicketsPanel,
} = require('./dashboard.service');

/**
 * Standard error responder — consistent with repository convention
 */
const respondWithError = (res, error, fallbackMessage) => {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : fallbackMessage,
  });
};

/**
 * Extract agent ID from request — header first, then query param, then dev default
 */
const getAgentIdFromReq = (req) =>
  req.headers['x-user-id'] || req.query.agentId || 'agent-001';

// ─── SCR-014: KPIs ────────────────────────────────────────────────────────────

/**
 * GET /dashboard/kpis
 * Returns live KPI metrics: open incidents, SLA breaches, avg resolution time (SCR-014)
 */
const getKpisHandler = async (req, res) => {
  try {
    const data = await getDashboardKpis();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch dashboard KPIs');
  }
};

// ─── SCR-014: Mood Check-in ───────────────────────────────────────────────────

/**
 * GET /dashboard/mood
 * Returns the acting agent's current mood check-in (SCR-014)
 */
const getMoodHandler = async (req, res) => {
  try {
    const agentId = getAgentIdFromReq(req);
    const data = await getAgentMood(agentId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch mood check-in');
  }
};

/**
 * POST /dashboard/mood
 * Submit a mood check-in for the acting agent (SCR-014)
 * Body: { mood: "Good" }
 */
const submitMoodHandler = async (req, res) => {
  try {
    const agentId = getAgentIdFromReq(req);
    const { mood } = req.body;
    const data = await submitMood(agentId, mood);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondWithError(res, error, 'Failed to submit mood check-in');
  }
};

// ─── SCR-015: Team & Category Breakdown ──────────────────────────────────────

/**
 * GET /dashboard/incidents-by-team
 * Returns incidents grouped by support team (SCR-015)
 */
const getIncidentsByTeamHandler = async (req, res) => {
  try {
    const data = await getIncidentsByTeam();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch team breakdown');
  }
};

/**
 * GET /dashboard/incidents-by-category
 * Returns incidents grouped by category (SCR-015)
 */
const getIncidentsByCategoryHandler = async (req, res) => {
  try {
    const data = await getIncidentsByCategory();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch category breakdown');
  }
};

// ─── SCR-015: New Tickets Panel ───────────────────────────────────────────────

/**
 * GET /dashboard/new-tickets
 * Returns the latest new tickets for the dashboard panel (SCR-015)
 * Query: ?limit=10
 */
const getNewTicketsHandler = async (req, res) => {
  try {
    const data = await getNewTicketsPanel(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch new tickets panel');
  }
};

module.exports = {
  getKpisHandler,
  getMoodHandler,
  submitMoodHandler,
  getIncidentsByTeamHandler,
  getIncidentsByCategoryHandler,
  getNewTicketsHandler,
};
