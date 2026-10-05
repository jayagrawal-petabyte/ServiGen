const express = require('express');

const {
  listIncidentRecords,
  getIncidentRecord,
  getIncidentPriorityAnalytics,
  getIncidentCategoryAnalytics,
  getRecentIncidentRecords,
  getNewIncidentTickets,
} = require('./incidents.controller');

const router = express.Router();

router.get('/analytics/priority', getIncidentPriorityAnalytics);
router.get('/analytics/category', getIncidentCategoryAnalytics);
router.get('/recent', getRecentIncidentRecords);
router.get('/new', getNewIncidentTickets);

router.get('/', listIncidentRecords);
router.get('/:incidentId', getIncidentRecord);

module.exports = router;