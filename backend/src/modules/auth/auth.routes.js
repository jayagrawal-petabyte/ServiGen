const express = require('express');

const {
  loginHandler,
  getSessionHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
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
 * Refresh authenticated user token.
 */
router.post('/refresh', refreshHandler);

/**
 * POST /auth/forgot-password
 *
 * Submit password recovery request.
 */
router.post('/forgot-password', forgotPasswordHandler);

/**
 * POST /auth/reset-password
 *
 * Reset account password using token.
 */
router.post('/reset-password', resetPasswordHandler);

/**
 * GET /auth/session
 *
 * Load the currently authenticated user's session.
 */
router.get('/session', getSessionHandler);

module.exports = router;