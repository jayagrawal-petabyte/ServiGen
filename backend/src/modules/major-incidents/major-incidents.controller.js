const {
  getMajorIncidents,
  getMajorIncidentById,
  createMajorIncident,
  changeMajorIncident,
  createIncidentUpdate,
} = require('./major-incidents.service');

const {
  subscribeToIncident,
  publishIncidentUpdate,
} = require('./major-incidents.events');

const respondWithError = (res, error, fallbackMessage) => {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : fallbackMessage,
  });
};

/**
 * Tenant boundary check: returns true if a non-admin user attempts to access
 * a major incident belonging to another organisation.
 */
const isCrossTenant = (incident, user) => {
  if (!incident || !user) return false;
  if (user.role === 'Admin') return false;
  if (user.organisationId && incident.organisationId && incident.organisationId !== user.organisationId) {
    return true;
  }
  return false;
};

const listMajorIncidents = async (req, res) => {
  try {
    const filters = { ...req.query };
    if (req.user && req.user.role !== 'Admin' && req.user.organisationId) {
      filters.organisationId = req.user.organisationId;
    }
    const incidents = await getMajorIncidents(filters);
    res.status(200).json({ success: true, data: incidents });
  } catch (error) {
    respondWithError(res, error, 'Failed to fetch major incidents');
  }
};

const getMajorIncident = async (req, res) => {
  try {
    const incident = await getMajorIncidentById(req.params.incidentId);
    if (!incident || isCrossTenant(incident, req.user)) {
      return res.status(404).json({ success: false, message: 'Major incident not found' });
    }
    return res.status(200).json({ success: true, data: incident });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch major incident');
  }
};

const addMajorIncident = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.user && req.user.role !== 'Admin' && req.user.organisationId) {
      payload.organisationId = req.user.organisationId;
    }
    const incident = await createMajorIncident(payload);
    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    respondWithError(res, error, 'Failed to create major incident');
  }
};

const editMajorIncident = async (req, res) => {
  try {
    const existing = await getMajorIncidentById(req.params.incidentId);
    if (!existing || isCrossTenant(existing, req.user)) {
      return res.status(404).json({ success: false, message: 'Major incident not found' });
    }
    const incident = await changeMajorIncident(req.params.incidentId, req.body);
    return res.status(200).json({ success: true, data: incident });
  } catch (error) {
    return respondWithError(res, error, 'Failed to update major incident');
  }
};

const addMajorIncidentUpdate = async (req, res) => {
  try {
    const existing = await getMajorIncidentById(req.params.incidentId);
    if (!existing || isCrossTenant(existing, req.user)) {
      return res.status(404).json({ success: false, message: 'Major incident not found' });
    }
    const author = req.user?.email || req.user?.id || 'Unassigned';
    const incident = await createIncidentUpdate(
      req.params.incidentId,
      req.body,
      author
    );
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Major incident not found' });
    }
    const latestUpdate = incident.updates.at(-1);

    publishIncidentUpdate(req.params.incidentId, latestUpdate);

    return res.status(201).json({ success: true, data: incident });
  } catch (error) {
    return respondWithError(res, error, 'Failed to add major incident update');
  }
};

const streamMajorIncidentUpdates = async (req, res) => {
  try {
    const incident = await getMajorIncidentById(req.params.incidentId);

    if (!incident || isCrossTenant(incident, req.user)) {
      return res.status(404).json({
        success: false,
        message: 'Major incident not found',
      });
    }

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.flushHeaders();

    res.write('event: connected\ndata: {"connected":true}\n\n');

    const unsubscribe = subscribeToIncident(
      req.params.incidentId,
      res,
    );

    const heartbeat = setInterval(() => {
      if (!res.destroyed && !res.writableEnded) {
        res.write(': heartbeat\n\n');
      }
    }, 25000);

    const cleanup = () => {
      clearInterval(heartbeat);
      unsubscribe();
    };

    res.on('close', cleanup);
    res.on('error', cleanup);
    res.on('finish', cleanup);
    req.on('aborted', cleanup);
  } catch (error) {
    if (!res.headersSent) {
      return respondWithError(
        res,
        error,
        'Failed to stream major incident updates',
      );
    }

    res.end();
  }
};

module.exports = {
  listMajorIncidents,
  getMajorIncident,
  addMajorIncident,
  editMajorIncident,
  addMajorIncidentUpdate,
  streamMajorIncidentUpdates,
};
