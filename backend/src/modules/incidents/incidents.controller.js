
const {
  listIncidents,
  getIncident,
  getPriorityAnalytics,
  getCategoryAnalytics,
  getRecentIncidents,
  getNewTickets,
} = require('./incidents.service');

const {
  TEAM_NAMES,
  listTeamIncidents,
  getTeamAgents,
  getTeamIncidentById,
} = require('./incidents.support.service');

const respondWithError = (res, error, fallbackMessage) => {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : fallbackMessage,
  });
};

const resolveScopedQuery = (req) => {
  const query = { ...req.query };

  if (req.user && req.user.role !== 'Admin') {
    query.organisationId =
      req.user.organisationId || '__unassigned_organisation__';
  }

  return query;
};

const listIncidentRecords = async (req, res) => {
  try {
    const result = await listIncidents(resolveScopedQuery(req));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch incidents');
  }
};

const getIncidentRecord = async (req, res) => {
  try {
    const incident = await getIncident(req.params.incidentId);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    if (req.user && req.user.role !== 'Admin') {
      const userOrg =
        typeof req.user.organisationId === 'string'
          ? req.user.organisationId.trim().toLowerCase()
          : '';

      const incidentOrg =
        typeof incident.organisationId === 'string'
          ? incident.organisationId.trim().toLowerCase()
          : '';

      if (!userOrg || !incidentOrg || userOrg !== incidentOrg) {
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

const getIncidentPriorityAnalytics = async (req, res) => {
  try {
    const result = await getPriorityAnalytics(resolveScopedQuery(req));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return respondWithError(
      res,
      error,
      'Failed to fetch incident priority analytics'
    );
  }
};

const getIncidentCategoryAnalytics = async (req, res) => {
  try {
    const result = await getCategoryAnalytics(resolveScopedQuery(req));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return respondWithError(
      res,
      error,
      'Failed to fetch incident category analytics'
    );
  }
};

const getRecentIncidentRecords = async (req, res) => {
  try {
    const result = await getRecentIncidents(resolveScopedQuery(req));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch recent incidents');
  }
};

const getNewIncidentTickets = async (req, res) => {
  try {
    const result = await getNewTickets(resolveScopedQuery(req));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch new incident tickets');
  }
};

// 1st Line Support: open incident list, agent availability, ticket detail.

const getFirstLineIncidents = async (req, res) => {
  try {
    const result = await listTeamIncidents(
      TEAM_NAMES.FIRST_LINE,
      req.user,
      req.query
    );

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch 1st Line incidents');
  }
};

const getFirstLineAgents = async (req, res) => {
  try {
    const result = await getTeamAgents(TEAM_NAMES.FIRST_LINE, req.user);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch 1st Line agents');
  }
};

const getFirstLineIncident = async (req, res) => {
  try {
    const incident = await getTeamIncidentById(
      TEAM_NAMES.FIRST_LINE,
      req.params.ticketId,
      req.user
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    return res.status(200).json({ success: true, data: incident });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch 1st Line incident');
  }
};

// 2nd Line Support: open incident list, agent list, ticket detail.

const getSecondLineIncidents = async (req, res) => {
  try {
    const result = await listTeamIncidents(
      TEAM_NAMES.SECOND_LINE,
      req.user,
      req.query
    );

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch 2nd Line incidents');
  }
};

const getSecondLineAgents = async (req, res) => {
  try {
    const result = await getTeamAgents(TEAM_NAMES.SECOND_LINE, req.user);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch 2nd Line agents');
  }
};

const getSecondLineIncident = async (req, res) => {
  try {
    const incident = await getTeamIncidentById(
      TEAM_NAMES.SECOND_LINE,
      req.params.ticketId,
      req.user
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    return res.status(200).json({ success: true, data: incident });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch 2nd Line incident');
  }
};

module.exports = {
  listIncidentRecords,
  getIncidentRecord,
  getIncidentPriorityAnalytics,
  getIncidentCategoryAnalytics,
  getRecentIncidentRecords,
  getNewIncidentTickets,
  getFirstLineIncidents,
  getFirstLineAgents,
  getFirstLineIncident,
  getSecondLineIncidents,
  getSecondLineAgents,
  getSecondLineIncident,
};
