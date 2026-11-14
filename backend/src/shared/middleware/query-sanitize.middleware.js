'use strict';

/**
 * Helper to flatten/resolve potentially nested array query parameters into a single scalar value.
 * In HTTP parameter pollution (e.g. ?status=Open&status=Closed or ?status[]=Open),
 * Express parses multiple query parameters as an array. Downstream controller logic
 * expecting a string (e.g. status.toLowerCase()) will throw a TypeError (HTTP 500).
 *
 * This sanitizer picks the last provided value, preventing TypeError exceptions and HPP.
 */
const sanitizeQueryValue = (value) => {
  if (Array.isArray(value)) {
    return sanitizeQueryValue(value[value.length - 1]);
  }
  return value;
};

/**
 * Middleware that normalizes all array parameters in req.query to scalar values.
 */
const querySanitizer = (req, _res, next) => {
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = sanitizeQueryValue(req.query[key]);
      }
    }
  }
  next();
};

module.exports = {
  querySanitizer,
  sanitizeQueryValue,
};

