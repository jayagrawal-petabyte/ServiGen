const express = require('express');

const {
  loginHandler,
  getSessionHandler,
  refreshHandler,
} = require('./auth.controller');

const router = express.Router();

/**
 * POST /auth/login
 *
 * Authenticate a user using username and password.
 */
router.post('/login', loginHandler);

/**
 * POST /auth/refresh
 *
 * Refresh an active token.
 */
router.post('/refresh', refreshHandler);

/**
 * GET /auth/session
 *
 * Load the currently authenticated user's session.
 */
router.get('/session', getSessionHandler);

module.exports = router;