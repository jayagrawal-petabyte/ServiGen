'use strict';

const path = require('path');
const { randomBytes } = require('node:crypto');
const dotenv = require('dotenv');

// Load .env from backend root if present
// Tests must not inherit credentials or development overrides from a local file.
if (process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const NODE_ENV = process.env.NODE_ENV;
if (!['development', 'test', 'production'].includes(NODE_ENV)) {
  throw new Error('NODE_ENV must be explicitly set to development, test, or production');
}

const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

const KNOWN_EXAMPLE_JWT_SECRET = 'servigen-super-secret-jwt-key-dev-only-change-in-prod';
const configuredSecret = process.env.JWT_SECRET;
if (configuredSecret?.trim() === KNOWN_EXAMPLE_JWT_SECRET ||
    (!isTest && (!configuredSecret?.trim() || Buffer.byteLength(configuredSecret, 'utf8') < 32))) {
  throw new Error('JWT_SECRET must be a unique secret of at least 32 bytes; the published example key is not permitted');
}
// A test-only random key is never shared with a development or production server.
const JWT_SECRET = configuredSecret || randomBytes(32).toString('hex');

// Dev auth override can ONLY be enabled in non-production environments
const ALLOW_DEV_AUTH_OVERRIDE = ['development', 'test'].includes(NODE_ENV) && process.env.ALLOW_DEV_AUTH_OVERRIDE === 'true';

const parseCorsOrigins = (rawOrigins) => {
  if (!rawOrigins?.trim()) {
    if (isProduction) throw new Error('CORS_ORIGIN must explicitly list production browser origins');
    return ['http://localhost:5173', 'http://localhost:3000'];
  }
  return [...new Set(rawOrigins.split(',').map((entry) => {
    try {
      const url = new URL(entry.trim());
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
          url.pathname !== '/' || url.search || url.hash) throw new Error();
      return url.origin;
    } catch {
      throw new Error('CORS_ORIGIN must contain HTTP(S) origins without wildcards, credentials, paths, queries or fragments');
    }
  }))];
};

const positiveInteger = (name, fallback, maximum = Number.MAX_SAFE_INTEGER) => {
  const raw = process.env[name] ?? String(fallback);
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${name} must be a positive integer no greater than ${maximum}`);
  }
  return value;
};

const PORT = Number(process.env.PORT || 3000);
if (!/^\d+$/.test(String(process.env.PORT || 3000)) || !Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}
if (isProduction && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be provided in production');
}
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/servigen?schema=public';
try {
  const url = new URL(DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || url.pathname.length < 2) throw new Error();
} catch {
  throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
}

const env = {
  NODE_ENV,
  isProduction,
  isTest,
  isDevelopment: !isProduction && !isTest,

  PORT,
  DATABASE_URL,

  JWT: {
    SECRET: JWT_SECRET,
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  },

  CORS_ORIGIN: parseCorsOrigins(process.env.CORS_ORIGIN),
  ALLOW_DEV_AUTH_OVERRIDE,
  RATE_LIMIT: {
    WINDOW_MS: positiveInteger('RATE_LIMIT_WINDOW_MS', 60000, 2147483647),
    MAX: positiveInteger('RATE_LIMIT_MAX', 300),
    AI_MAX: positiveInteger('AI_RATE_LIMIT_MAX', 30),
  },
};

module.exports = env;
