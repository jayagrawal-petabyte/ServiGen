const {
  getUsers,
  getUser,
} = require('./organisations.service');

/**
 * Standard error responder for organisation endpoints.
 */
const respondWithError = (res, error, fallbackMessage) => {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : fallbackMessage,
  });
};

/**
 * GET /organisations/:organisationId/users
 *
 * Get all users belonging to an organisation.
 */
const getUsersHandler = async (req, res) => {
  try {
    const { organisationId } = req.params;

    // SG-05 / BI-20: Prevent cross-tenant user enumeration (IDOR)
    if (req.user && req.user.role !== 'Admin' && req.user.organisationId && req.user.organisationId !== organisationId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    const users = await getUsers(organisationId);

    return res.status(200).json({
      success: true,
      message: 'Organisation users loaded successfully',
      data: users,
    });
  } catch (error) {
    return respondWithError(
      res,
      error,
      'Failed to load organisation users'
    );
  }
};

/**
 * GET /organisations/:organisationId/users/:userId
 *
 * Get a specific user belonging to an organisation.
 */
const getUserHandler = async (req, res) => {
  try {
    const {
      organisationId,
      userId,
    } = req.params;

    // SG-05 / BI-20: Prevent cross-tenant user access (IDOR)
    if (req.user && req.user.role !== 'Admin' && req.user.organisationId && req.user.organisationId !== organisationId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    const user = await getUser(organisationId, userId);

    return res.status(200).json({
      success: true,
      message: 'Organisation user loaded successfully',
      data: user,
    });
  } catch (error) {
    return respondWithError(
      res,
      error,
      'Failed to load organisation user'
    );
  }
};

module.exports = {
  getUsersHandler,
  getUserHandler,
};