'use strict';

const express = require('express');
const {
  getChangeRequestsList,
  getActiveChangeRequestsList,
  getChangeCalendar,
  getChangeRequestById,
  createChangeRequest,
  updateChangeRequest,
} = require('./change-requests.controller');

const router = express.Router();

router.get('/', getChangeRequestsList);
router.post('/', createChangeRequest);
router.get('/active', getActiveChangeRequestsList);
router.get('/calendar', getChangeCalendar);
router.get('/:id', getChangeRequestById);
router.patch('/:id', updateChangeRequest);

module.exports = router;
