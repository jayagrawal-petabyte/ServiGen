// Implementation Summary: Express routes for AI Core Intent Classification, defining the analysis endpoint for Farjan's integration.
const express = require('express');
const { analyzeIntent } = require('./intent.controller');

const router = express.Router();

router.post('/analyze', analyzeIntent);

module.exports = router;
