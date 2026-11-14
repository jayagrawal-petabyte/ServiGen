'use strict';

// Implementation Summary: Controller for AI Core Intent Analysis.
// Delegates to intent.service, enforces error propagation via next(err),
// and maps operational validation errors to 400 vs unhandled faults to 500
// through the shared centralized errorHandler.

const { classifyIntent } = require('./intent.service');
const AppError = require('../../../shared/utils/app-error');
const { HTTP_STATUS } = require('../../../shared/constants/http.constants');

/**
 * POST /api/ai-core/intent/analyze
 *
 * Accepts: { text: string }
 * Returns: { success: true, data: IntentResult }
 *
 * BUG FIX: Previously all errors (validation AND unexpected) were caught and
 * returned as 400. An unhandled DB error or programmer mistake would present
 * as a user-facing "Bad Request" instead of a 500, masking real failures.
 *
 * Now:
 *  - Validation / input errors thrown with no statusCode default to 400.
 *  - Unexpected errors with statusCode already set pass through as-is.
 *  - All errors go to next(err) so errorHandler applies consistent logging
 *    and stack-trace suppression in production.
 */
const analyzeIntent = async (req, res, next) => {
  try {
    const result = await classifyIntent(req.body);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } catch (err) {
    // classifyIntent and analyzeTextIntent throw plain Errors for input
    // validation failures. Wrap them as operational 400s so errorHandler
    // knows to surface the message to the client.
    if (!err.statusCode && !err.isOperational) {
      return next(new AppError(err.message, HTTP_STATUS.BAD_REQUEST));
    }
    return next(err);
  }
};

module.exports = {
  analyzeIntent,
};
