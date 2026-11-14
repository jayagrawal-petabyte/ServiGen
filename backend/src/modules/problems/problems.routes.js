'use strict';

const express = require('express');
const {
  getProblemsHandler,
  getProblemByIdHandler,
  createProblemHandler,
  updateProblemHandler,
  deleteProblemHandler,
  updateProblemStageHandler,
  reassignProblemHandler,
  addWorkaroundHandler,
  updateRootCauseHandler,
  getLinkedIncidentsHandler,
  linkIncidentsHandler,
  unlinkIncidentHandler,
  bulkResolveChildIncidentsHandler,
  getLinkedCisHandler,
  linkCiHandler,
  unlinkCiHandler,
  getProblemLogsHandler,
  postProblemLogHandler,
  sendProblemEmailHandler,
} = require('./problems.controller');

const router = express.Router();

// ─── CRUD & List ───────────────────────────────────────────────────────────
router.get('/problems', getProblemsHandler);
router.post('/problems', createProblemHandler);

// ─── Stages & Reassignment ──────────────────────────────────────────────────
router.patch('/problems/:id/stage', updateProblemStageHandler);
router.patch('/problems/:id/reassign', reassignProblemHandler);

// ─── Root Cause & Workaround ───────────────────────────────────────────────
router.post('/problems/:id/workaround', addWorkaroundHandler);
router.post('/problems/:id/cause', updateRootCauseHandler);

// ─── Incident Linking & Bulk Resolve ───────────────────────────────────────
router.get('/problems/:id/incidents', getLinkedIncidentsHandler);
router.post('/problems/:id/incidents', linkIncidentsHandler);
router.delete('/problems/:id/incidents/:incidentId', unlinkIncidentHandler);
router.post('/problems/:id/incidents/bulk-resolve', bulkResolveChildIncidentsHandler);

// ─── CMDB / CI Linking ─────────────────────────────────────────────────────
router.get('/problems/:id/cis', getLinkedCisHandler);
router.post('/problems/:id/cis', linkCiHandler);
router.delete('/problems/:id/cis/:ciId', unlinkCiHandler);

// ─── Work Notes & Feed ─────────────────────────────────────────────────────
router.get('/problems/:id/logs', getProblemLogsHandler);
router.post('/problems/:id/logs', postProblemLogHandler);
router.post('/problems/:id/email', sendProblemEmailHandler);

// ─── Single Item Operations (MUST be after sub-routes) ─────────────────────
router.get('/problems/:id', getProblemByIdHandler);
router.patch('/problems/:id', updateProblemHandler);
router.delete('/problems/:id', deleteProblemHandler);

module.exports = router;
