'use strict';

const express = require('express');
const {
  getSlaComplianceHandler,
  getAgentPerformanceHandler,
  exportReportHandler,
} = require('./reports.controller');

const router = express.Router();

router.get('/reports/sla-compliance', getSlaComplianceHandler);
router.get('/reports/agent-performance', getAgentPerformanceHandler);
router.get('/reports/export', exportReportHandler);

module.exports = router;
