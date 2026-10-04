'use strict';

const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const AppError = require('../utils/app-error');
const { HTTP_STATUS } = require('../constants/http.constants');
const { ROLES, ALL_ROLES } = require('../constants/roles.constants');

/**
 * Helper to generate signed JWT tokens (for Auth module & tests).
 */
const generateToken = (payload, expiresIn = env.JWT.EXPIRES_IN) => {
  return jwt.sign(payload, env.JWT.SECRET, { expiresIn });
};

/**
 * Extracts and verifies JWT from Bearer Authorization header.
 * Allows dev override (x-user-id) strictly when NODE_ENV !== 'production' and ALLOW_DEV_AUTH_OVERRIDE === true.
 */
const requireAuth = (req, _res, next) => {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT.SECRET, { algorithms: ['HS256'] });
      if (!decoded || typeof decoded.id !== 'string' || !decoded.id.trim() || !ALL_ROLES.includes(decoded.role)) {
        return next(new AppError('Invalid authentication identity', HTTP_STATUS.UNAUTHORIZED));
      }
      req.user = { id: decoded.id, email: decoded.email, role: decoded.role, organisationId: decoded.organisationId };
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Authentication token has expired', HTTP_STATUS.UNAUTHORIZED));
      }
      return next(new AppError('Invalid authentication token', HTTP_STATUS.UNAUTHORIZED));
    }
  }

  // Development-only override for local testing (STRICTLY DISABLED IN PRODUCTION)
  if (env.ALLOW_DEV_AUTH_OVERRIDE) {
    const devUserId = req.headers['x-user-id'] || req.query.agentId || 'agent-001';
    const devUserRole = req.headers['x-user-role'] || ROLES.SERVICE_AGENT;
    const devOrgId = req.headers['x-org-id'] || 'org-001';
    const devEmail = req.headers['x-user-email'] || `${devUserId}@example.com`;

    req.user = {
      id: devUserId,
      email: devEmail,
      role: devUserRole,
      organisationId: devOrgId,
      isDevOverride: true,
    };
    return next();
  }

  return next(new AppError('Authentication required. Missing Bearer token.', HTTP_STATUS.UNAUTHORIZED));
};

/**
 * Optional authentication: attaches user if valid token exists, but does not block if missing.
 */
const optionalAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT.SECRET, { algorithms: ['HS256'] });
      if (decoded && typeof decoded.id === 'string' && decoded.id.trim() && ALL_ROLES.includes(decoded.role)) {
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role, organisationId: decoded.organisationId };
      }
    } catch (_err) {
      // Ignored for optional auth
    }
  } else if (env.ALLOW_DEV_AUTH_OVERRIDE && req.headers['x-user-id']) {
    const devRole = req.headers['x-user-role'] || ROLES.SERVICE_AGENT;
    if (ALL_ROLES.includes(devRole)) {
      req.user = {
        id: req.headers['x-user-id'],
        role: devRole,
        isDevOverride: true,
      };
    }
  }
  return next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  generateToken,
};
