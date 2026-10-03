'use strict';

const { ROLES } = require('../constants/roles.constants');
const AppError = require('../utils/app-error');
const { HTTP_STATUS } = require('../constants/http.constants');

/**
 * RBAC authorization guard.
 * Restricts access to users holding one of the specified roles.
 *
 * @param {...string} allowedRoles - List of permitted roles (e.g., ROLES.SERVICE_AGENT, ROLES.APPROVER)
 */
const restrictTo = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required prior to permission check', HTTP_STATUS.UNAUTHORIZED));
    }

    if (req.user.role !== ROLES.ADMIN && !allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required: [${allowedRoles.join(', ')}]`,
          HTTP_STATUS.FORBIDDEN
        )
      );
    }

    next();
  };
};

/**
 * Checks if the acting user owns the target resource OR possesses an elevated role (e.g. Admin).
 */
const requireSelfOrRole = (userIdParamName = 'id', ...elevatedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required prior to permission check', HTTP_STATUS.UNAUTHORIZED));
    }

    const targetUserId = req.params[userIdParamName];
    const isSelf = req.user.id === targetUserId;
    const hasElevatedRole = req.user.role === ROLES.ADMIN || elevatedRoles.includes(req.user.role);

    if (!isSelf && !hasElevatedRole) {
      return next(new AppError('Forbidden: You can only access your own resource', HTTP_STATUS.FORBIDDEN));
    }

    next();
  };
};

module.exports = {
  restrictTo,
  requireSelfOrRole,
};
