const express = require('express');

const {
  getKpisHandler,
  getMoodHandler,
  submitMoodHandler,
  getIncidentsByTeamHandler,
  getIncidentsByCategoryHandler,
  getNewTicketsHandler,
} = require('./dashboard.controller');

const router = express.Router();

// SCR-014 — KPI aggregation
router.get('/kpis', getKpisHandler);

// SCR-014 — Mood check-in
router.get('/mood', getMoodHandler);
router.post('/mood', submitMoodHandler);

// SCR-015 — Team & category breakdown (scrolled view)
router.get('/incidents-by-team', getIncidentsByTeamHandler);
router.get('/incidents-by-category', getIncidentsByCategoryHandler);

// SCR-015 — New tickets panel
router.get('/new-tickets', getNewTicketsHandler);

module.exports = router;
