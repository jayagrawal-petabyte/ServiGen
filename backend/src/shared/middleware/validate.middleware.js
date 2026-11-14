'use strict';

const AppError = require('../utils/app-error');
const { HTTP_STATUS } = require('../constants/http.constants');

/**
 * Validates request payload against schema or validator function.
 * Supports custom validation functions: (body) => ({ error?: string, details?: any })
 */
const validateBody = (validateFn) => {
  return (req, _res, next) => {
    if (typeof validateFn !== 'function') {
      return next();
    }

    const result = validateFn(req.body);
    if (result && result.error) {
      return next(new AppError(result.error, HTTP_STATUS.BAD_REQUEST, result.details || null));
    }

    next();
  };
};

module.exports = {
  validateBody,
};
