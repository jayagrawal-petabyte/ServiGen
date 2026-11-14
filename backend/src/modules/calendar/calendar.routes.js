'use strict';

const express = require('express');
const router = express.Router();
const calendarController = require('./calendar.controller');
const { getSlaEventsHandler } = require('./sla-events.controller');

router.get('/sla-events', getSlaEventsHandler);
router.get('/', calendarController.listEvents);
router.post('/', calendarController.createEvent);

module.exports = router;
