'use strict';

const express = require('express');
const router = express.Router();
const calendarController = require('./calendar.controller');

router.get('/', calendarController.listEvents);
router.post('/', calendarController.createEvent);

module.exports = router;
