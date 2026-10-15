const {
  login,
  getSession,
} = require('./auth.service');

/**
 * Standard error responder used by the authentication endpoints.
 */
const respondWithError = (res, error, fallbackMessage) => {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : fallbackMessage,
  });
};

/**
 * POST /auth/login
 *
 * Authenticate a user using username and password.
 */
const loginHandler = async (req, res) => {
  try {
    const { username, email, identifier, password } = req.body || {};

    if (username !== undefined && (typeof username !== 'string' || !username.trim())) {
      const error = new Error('Username must be a non-empty string');
      error.statusCode = 400;
      throw error;
    }
    if (email !== undefined && (typeof email !== 'string' || !email.trim())) {
      const error = new Error('Email must be a non-empty string');
      error.statusCode = 400;
      throw error;
    }
    if (identifier !== undefined && (typeof identifier !== 'string' || !identifier.trim())) {
      const error = new Error('Identifier must be a non-empty string');
      error.statusCode = 400;
      throw error;
    }

    const cleanUsername = typeof username === 'string' && username.trim() ? username.trim() : null;
    const cleanEmail = typeof email === 'string' && email.trim() ? email.trim() : null;
    const cleanIdentifier = typeof identifier === 'string' && identifier.trim() ? identifier.trim() : null;

    if (!cleanUsername && !cleanEmail && !cleanIdentifier) {
      const error = new Error('Username or email is required');
      error.statusCode = 400;
      throw error;
    }

    const user = await login(
      {
        username: cleanUsername,
        email: cleanEmail,
        identifier: cleanIdentifier,
      },
      password
    );

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: user,
    });
  } catch (error) {
    return respondWithError(res, error, 'Login failed');
  }
};

/**
 * GET /auth/session
 *
 * Load the currently authenticated user's session.
 */
const getSessionHandler = async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];

    const user = await getSession(userId);

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.status(200).json({
      success: true,
      message: 'Session loaded successfully',
      data: user,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to load session');
  }
};

module.exports = {
  loginHandler,
  getSessionHandler,
};