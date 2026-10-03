'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend root if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
if (!['development', 'test', 'production'].includes(NODE_ENV)) {
  throw new Error('NODE_ENV must be development, test, or production');
}

const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

// In production, prevent the use of fallback development secrets
const DEFAULT_DEV_JWT_SECRET = 'servigen-super-secret-jwt-key-dev-only-change-in-prod';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_DEV_JWT_SECRET;

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_DEV_JWT_SECRET)) {
  throw new Error('SECURITY VIOLATION: A secure, unique JWT_SECRET must be provided in production.');
}

// Dev auth override can ONLY be enabled in non-production environments
const ALLOW_DEV_AUTH_OVERRIDE = !isProduction && process.env.ALLOW_DEV_AUTH_OVERRIDE === 'true';

const parseCorsOrigins = (rawOrigins) => {
  if (!rawOrigins || rawOrigins === '*') return '*';
  return rawOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);
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
};

module.exports = env;
