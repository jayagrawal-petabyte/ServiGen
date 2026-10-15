'use strict';

const env = require('../../config/env');
const AppError = require('../utils/app-error');
const { HTTP_STATUS } = require('../constants/http.constants');

/**
 * Normalizes Prisma-specific database errors into standard AppErrors.
 */
const handlePrismaError = (err) => {
  switch (err.code) {
    case 'P2002': {
      const target = Array.isArray(err.meta?.target) ? ` (${err.meta.target.join(', ')})` : '';
      return new AppError(`A record with this unique field already exists${target}.`, HTTP_STATUS.CONFLICT);
    }
    case 'P2025':
      return new AppError('The requested record was not found.', HTTP_STATUS.NOT_FOUND);
    case 'P2003':
      return new AppError('Foreign key constraint violation: referenced entity does not exist.', HTTP_STATUS.BAD_REQUEST);
    default:
      return err;
  }
};

/**
 * Centralized Express Error Handler
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  let error = err;

  if (err.type === 'entity.too.large') {
    error = new AppError('Request body exceeds the 100 KB limit', 413);
  }

  // Handle invalid JSON body from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Malformed JSON payload received', HTTP_STATUS.BAD_REQUEST);
  }

  // Handle Prisma ORM errors
  if (err.name === 'PrismaClientKnownRequestError') {
    error = handlePrismaError(err);
  }

  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const isOperational = error.isOperational || false;
  const message = isOperational ? error.message : env.isProduction ? 'Internal server error' : error.message;

  const response = {
    success: false,
    message,
  };

  if (error.details && (isOperational || !env.isProduction)) {
    response.details = error.details;
  }

  // Include stack trace only in development
  if (env.isDevelopment && !isOperational) {
    response.stack = err.stack;
  }

  if (!isOperational && !env.isTest) {
    console.error('[servigen:error]', err);
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
