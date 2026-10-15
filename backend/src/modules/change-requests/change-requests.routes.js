// Implementation Summary: Express routes for Change Requests (SCR-009 & SCR-026), defining list, active filter, and details endpoints.
const express = require('express');
const {
  getChangeRequestsList,
  getActiveChangeRequestsList,
  getChangeRequestById,
} = require('./change-requests.controller');

const router = express.Router();

router.get('/', getChangeRequestsList);
router.get('/active', getActiveChangeRequestsList);
router.get('/:id', getChangeRequestById);

module.exports = router;
