'use strict';

const express = require('express');
const router = express.Router();
const responseController = require('./response.controller');

// POST /api/ai-core/response/format
router.post('/format', responseController.formatResponse);

// POST /api/ai-core/response/summarize
router.post('/summarize', responseController.summarizeTicket);

// POST /api/ai-core/response/suggest-resolution
router.post('/suggest-resolution', responseController.suggestResolution);

module.exports = router;
