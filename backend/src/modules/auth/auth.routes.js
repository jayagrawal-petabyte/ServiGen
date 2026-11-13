const express = require('express');

const {
  loginHandler,
  getSessionHandler,
  forgotPasswordHandler,
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
 * POST /auth/forgot-password
 *
 * Submit password recovery request.
 */
router.post('/forgot-password', forgotPasswordHandler);

/**
 * GET /auth/session
 *
 * Load the currently authenticated user's session.
 */
router.get('/session', getSessionHandler);

/**
 * POST /auth/refresh
 *
 * Refresh the active session token.
 */
router.post('/refresh', refreshHandler);

module.exports = router;