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

const listMajorIncidents = async (req, res) => {
  try {
    const incidents = await getMajorIncidents(req.query);
    res.status(200).json({ success: true, data: incidents });
  } catch (error) {
    respondWithError(res, error, 'Failed to fetch major incidents');
  }
};

const getMajorIncident = async (req, res) => {
  try {
    const incident = await getMajorIncidentById(req.params.incidentId);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Major incident not found' });
    }
    return res.status(200).json({ success: true, data: incident });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch major incident');
  }
};

const addMajorIncident = async (req, res) => {
  try {
    const incident = await createMajorIncident(req.body);
    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    respondWithError(res, error, 'Failed to create major incident');
  }
};

const editMajorIncident = async (req, res) => {
  try {
    const incident = await changeMajorIncident(req.params.incidentId, req.body);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Major incident not found' });
    }
    return res.status(200).json({ success: true, data: incident });
  } catch (error) {
    return respondWithError(res, error, 'Failed to update major incident');
  }
};

const addMajorIncidentUpdate = async (req, res) => {
  try {
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

    if (!incident) {
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

    res.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
  });
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
