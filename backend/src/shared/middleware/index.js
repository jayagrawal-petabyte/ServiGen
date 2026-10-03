'use strict';

const { requireAuth, optionalAuth, generateToken } = require('./auth.middleware');
const { restrictTo, requireSelfOrRole } = require('./rbac.middleware');
const { approvalScope } = require('./approval-scope.middleware');
const errorHandler = require('./error-handler.middleware');
const { validateBody } = require('./validate.middleware');
const requestLogger = require('./request-logger.middleware');

module.exports = {
  approvalScope,
  requireAuth,
  optionalAuth,
  generateToken,
  restrictTo,
  requireSelfOrRole,
  errorHandler,
  validateBody,
  requestLogger,
};
