'use strict';

const env = require('../../config/env');

/**
 * Lightweight development request logger.
 */
const requestLogger = (req, res, next) => {
  if (!env.isDevelopment) {
    return next();
  }

  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const statusColor = statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const resetColor = '\x1b[0m';

    console.log(
      `[servigen:http] ${method} ${originalUrl} ${statusColor}${statusCode}${resetColor} - ${duration}ms`
    );
  });

  next();
};

module.exports = requestLogger;
