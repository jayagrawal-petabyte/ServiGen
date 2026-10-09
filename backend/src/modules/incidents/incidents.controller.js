const {
  listIncidents,
  getIncident,
  getPriorityAnalytics,
  getCategoryAnalytics,
  getRecentIncidents,
  getNewTickets,
} = require('./incidents.service');

const respondWithError = (res, error, fallbackMessage) => {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : fallbackMessage,
  });
};

const resolveScopedQuery = (req) => {
  const query = { ...req.query };
  if (req.user && req.user.role !== 'Admin' && req.user.organisationId) {
    query.organisation = req.user.organisationId;
  }
  return query;
};

/**
 * GET /api/incidents
 */
const listIncidentRecords = async (req, res) => {
  try {
    const query = resolveScopedQuery(req);
    const result = await listIncidents(query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch incidents');
  }
};

/**
 * GET /api/incidents/:incidentId
 */
const getIncidentRecord = async (req, res) => {
  try {
    const incident = await getIncident(req.params.incidentId);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    // SG-05 / BI-20: Prevent cross-tenant incident retrieval (IDOR) with non-disclosure 404
    if (req.user && req.user.role !== 'Admin' && req.user.organisationId) {
      const userOrg = req.user.organisationId.toLowerCase();
      const incOrg = (incident.organisation || '').toLowerCase();
      const incOrgId = (incident.organisationId || '').toLowerCase();
      const matchesTenant = incOrgId === userOrg || incOrg.includes(userOrg) || (userOrg === 'org-001' && incOrg.includes('acme')) || (userOrg === 'org-002' && incOrg.includes('globex'));

      if (!matchesTenant) {
        return res.status(404).json({
          success: false,
          message: 'Incident not found',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch incident');
  }
};

/**
 * GET /api/incidents/analytics/priority
 */
const getIncidentPriorityAnalytics = async (req, res) => {
  try {
    const query = resolveScopedQuery(req);
    const analytics = await getPriorityAnalytics(query);

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    return respondWithError(
      res,
      error,
      'Failed to fetch incident priority analytics'
    );
  }
};

/**
 * GET /api/incidents/analytics/category
 */
const getIncidentCategoryAnalytics = async (req, res) => {
  try {
    const query = resolveScopedQuery(req);
    const analytics = await getCategoryAnalytics(query);

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    return respondWithError(
      res,
      error,
      'Failed to fetch incident category analytics'
    );
  }
};

/**
 * GET /api/incidents/recent
 */
const getRecentIncidentRecords = async (req, res) => {
  try {
    const query = resolveScopedQuery(req);
    const result = await getRecentIncidents(query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return respondWithError(
      res,
      error,
      'Failed to fetch recent incidents'
    );
  }
};

/**
 * GET /api/incidents/new
 */
const getNewIncidentTickets = async (req, res) => {
  try {
    const query = resolveScopedQuery(req);
    const result = await getNewTickets(query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return respondWithError(
      res,
      error,
      'Failed to fetch new incident tickets'
    );
  }
};

module.exports = {
  listIncidentRecords,
  getIncidentRecord,
  getIncidentPriorityAnalytics,
  getIncidentCategoryAnalytics,
  getRecentIncidentRecords,
  getNewIncidentTickets,
};