'use strict';

/**
 * Standard operational error class for ServiGen backend.
 * Distinguishes trusted operational errors from unhandled runtime bugs.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
