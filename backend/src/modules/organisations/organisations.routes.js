const express = require('express');

const {
  getUsersHandler,
  getUserHandler,
} = require('./organisations.controller');

const router = express.Router();

/**
 * GET /organisations/:organisationId/users
 *
 * Get all users belonging to an organisation.
 */
router.get('/:organisationId/users', getUsersHandler);

/**
 * GET /organisations/:organisationId/users/:userId
 *
 * Get a specific user belonging to an organisation.
 */
router.get(
  '/:organisationId/users/:userId',
  getUserHandler
);

module.exports = router;