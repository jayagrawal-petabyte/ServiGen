const express = require('express');
const { restrictTo } = require('../../shared/middleware');

const {
  listMajorIncidents,
  getMajorIncident,
  addMajorIncident,
  editMajorIncident,
  addMajorIncidentUpdate,
} = require('./major-incidents.controller');

const router = express.Router();

router.get('/', listMajorIncidents);
router.post('/', restrictTo('Admin'), addMajorIncident);
router.get('/:incidentId', getMajorIncident);
router.patch('/:incidentId', editMajorIncident);
router.post('/:incidentId/updates', addMajorIncidentUpdate);

module.exports = router;
