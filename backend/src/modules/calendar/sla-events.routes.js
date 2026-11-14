'use strict';

const express = require('express');
const { getSlaEventsHandler } = require('./sla-events.controller');

const router = express.Router();

router.get('/', getSlaEventsHandler);

module.exports = router;

