'use strict';

const { requireAuth, optionalAuth, generateToken } = require('./auth.middleware');
const { restrictTo, requireSelfOrRole } = require('./rbac.middleware');
const { approvalScope } = require('./approval-scope.middleware');
const errorHandler = require('./error-handler.middleware');
const { validateBody } = require('./validate.middleware');
const requestLogger = require('./request-logger.middleware');
const { querySanitizer, sanitizeQueryValue } = require('./query-sanitize.middleware');
const { createOriginValidator } = require('./origin-validate.middleware');
const { createLoginLockout, loginLockout } = require('./login-lockout.middleware');

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
  querySanitizer,
  sanitizeQueryValue,
  createOriginValidator,
  createLoginLockout,
  loginLockout,
};
