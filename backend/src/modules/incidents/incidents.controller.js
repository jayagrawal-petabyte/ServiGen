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

/**
 * GET /api/incidents
 */
const listIncidentRecords = async (req, res) => {
  try {
    const result = await listIncidents(req.query);

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
    const analytics = await getPriorityAnalytics();

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
    const analytics = await getCategoryAnalytics();

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
    const result = await getRecentIncidents(req.query);

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
    const result = await getNewTickets(req.query);

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