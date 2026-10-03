'use strict';

/**
 * Standard API response envelope format across all modules:
 * {
 *   success: true | false,
 *   data: ...,
 *   message: string | null,
 *   pagination?: { ... }
 * }
 */
const sendSuccess = (res, data = null, message = null, statusCode = 200, pagination = null) => {
  const payload = {
    success: true,
    data,
  };

  if (message) {
    payload.message = message;
  }

  if (pagination) {
    payload.pagination = pagination;
  }

  return res.status(statusCode).json(payload);
};

const sendError = (res, message = 'Internal server error', statusCode = 500, details = null) => {
  const payload = {
    success: false,
    message,
  };

  if (details) {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError,
};
