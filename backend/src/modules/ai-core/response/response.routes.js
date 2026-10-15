const express = require('express');
const router = express.Router();
const responseController = require('./response.controller');

// POST /ai-core/response/format
router.post('/format', responseController.formatResponse);

module.exports = router;
