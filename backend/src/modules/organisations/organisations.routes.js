const express = require('express');

const {
  getUsersHandler,
  getUserHandler,
  getSitesHandler,
  getContactsHandler,
} = require('./organisations.controller');

const router = express.Router();

/**
 * GET /organisations/:organisationId/users
 *
 * Get all users belonging to an organisation.
 */
router.get('/:organisationId/users', getUsersHandler);

/**
 * GET /organisations/:organisationId/sites
 *
 * Get all physical sites belonging to an organisation.
 */
router.get('/:organisationId/sites', getSitesHandler);

/**
 * GET /organisations/:organisationId/contacts
 *
 * Get directory of organisation users and VIP designations.
 */
router.get('/:organisationId/contacts', getContactsHandler);

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