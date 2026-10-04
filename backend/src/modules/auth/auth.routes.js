const express = require('express');

const {
  loginHandler,
  getSessionHandler,
} = require('./auth.controller');

const router = express.Router();

/**
 * POST /auth/login
 *
 * Authenticate a user using username and password.
 */
router.post('/login', loginHandler);

/**
 * GET /auth/session
 *
 * Load the currently authenticated user's session.
 */
router.get('/session', getSessionHandler);

module.exports = router;