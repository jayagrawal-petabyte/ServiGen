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
    const { username, password } = req.body;

    const user = await login(username, password);

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
 *
 * Temporary implementation:
 * Reads the user ID from the x-user-id header until
 * the shared authentication/session middleware is available.
 */
const getSessionHandler = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const user = await getSession(userId);

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