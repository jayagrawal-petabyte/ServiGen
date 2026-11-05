'use strict';

/**
 * Validates Origin header on state-changing HTTP requests (POST, PUT, PATCH, DELETE).
 * Browsers automatically attach the Origin header to cross-origin requests and fetch/XHR mutations.
 * If an Origin header is present and does not match any configured CORS origin, the request is rejected with 403 Forbidden.
 *
 * Requests without an Origin header (e.g. server-to-server calls, CLI scripts, same-origin) pass through to standard authentication.
 */
const createOriginValidator = (allowedOrigins = []) => {
  const allowedList = Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];

  return (req, res, next) => {
    const origin = req.headers.origin;
    const method = req.method ? req.method.toUpperCase() : 'GET';

    if (origin && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (!allowedList.includes(origin)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Request origin is not allowed',
        });
      }
    }

    next();
  };
};

module.exports = {
  createOriginValidator,
};

