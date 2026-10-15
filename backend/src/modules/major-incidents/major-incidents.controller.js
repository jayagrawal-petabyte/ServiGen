const {
  getMajorIncidents,
  getMajorIncidentById,
  createMajorIncident,
  changeMajorIncident,
  createIncidentUpdate,
} = require('./major-incidents.service');

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
    const incident = await createIncidentUpdate(req.params.incidentId, req.body);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Major incident not found' });
    }
    return res.status(201).json({ success: true, data: incident });
  } catch (error) {
    return respondWithError(res, error, 'Failed to add major incident update');
  }
};

module.exports = {
  listMajorIncidents,
  getMajorIncident,
  addMajorIncident,
  editMajorIncident,
  addMajorIncidentUpdate,
};
