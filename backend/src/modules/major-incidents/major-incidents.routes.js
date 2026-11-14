const express = require('express');

const {
  listMajorIncidents,
  getMajorIncident,
  addMajorIncident,
  editMajorIncident,
  addMajorIncidentUpdate,
  streamMajorIncidentUpdates,
  getServicesHealth,
} = require('./major-incidents.controller');

const router = express.Router();

router.get('/', listMajorIncidents);
router.post('/', addMajorIncident);
router.get('/:incidentId', getMajorIncident);
router.get('/:incidentId/stream', streamMajorIncidentUpdates);
router.get('/:incidentId/services-health', getServicesHealth);
router.patch('/:incidentId', editMajorIncident);
router.post('/:incidentId/updates', addMajorIncidentUpdate);

module.exports = router;
