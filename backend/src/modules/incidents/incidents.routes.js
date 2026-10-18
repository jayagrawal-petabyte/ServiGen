
const express = require('express');

const {
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
} = require('./incidents.controller');
const { createTicketHandler } = require('../my-work/my-work.controller');

const router = express.Router();

// Existing Incidents endpoints
router.post('/', createTicketHandler);
router.get('/analytics/priority', getIncidentPriorityAnalytics);
router.get('/analytics/category', getIncidentCategoryAnalytics);
router.get('/recent', getRecentIncidentRecords);
router.get('/new', getNewIncidentTickets);

// 1st Line Support
router.get('/support/first-line/agents', getFirstLineAgents);
router.get('/support/first-line/:ticketId', getFirstLineIncident);
router.get('/support/first-line', getFirstLineIncidents);

// 2nd Line Support
router.get('/support/second-line/agents', getSecondLineAgents);
router.get('/support/second-line/:ticketId', getSecondLineIncident);
router.get('/support/second-line', getSecondLineIncidents);

// Keep parameterized incident detail after static endpoints
router.get('/', listIncidentRecords);
router.get('/:incidentId', getIncidentRecord);

module.exports = router;

