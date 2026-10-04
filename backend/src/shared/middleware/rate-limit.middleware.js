'use strict';

const { rateLimit } = require('express-rate-limit');
const env = require('../../config/env');

// Default keying uses Express req.ip, including IPv6 subnet handling. Forwarded
// headers are not trusted unless the deployment explicitly configures its proxy.
const createRateLimiter = (limit, windowMs = env.RATE_LIMIT.WINDOW_MS) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

module.exports = { createRateLimiter };
