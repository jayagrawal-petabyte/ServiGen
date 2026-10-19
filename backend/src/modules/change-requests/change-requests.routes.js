// Implementation Summary: Express routes for Change Requests (SCR-009 & SCR-026),
// defining list, active filter, details, create, and update-status endpoints.
const express = require('express');
const {
  getChangeRequestsList,
  getActiveChangeRequestsList,
  getChangeRequestById,
  createChangeRequest,
  updateChangeRequest,
} = require('./change-requests.controller');

const router = express.Router();

router.get('/', getChangeRequestsList);
router.post('/', createChangeRequest);
router.get('/active', getActiveChangeRequestsList);
router.get('/:id', getChangeRequestById);
router.patch('/:id', updateChangeRequest);

module.exports = router;
