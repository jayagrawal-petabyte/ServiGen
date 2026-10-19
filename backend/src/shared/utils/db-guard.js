'use strict';

const env = require('../../config/env');
const db = require('../../config/db');

/**
 * Database guard / diagnostics.
 *
 * Historically every model wrapped its Prisma call in `try { ... } catch (_err) {}`
 * and silently returned hardcoded mock data. A broken DATABASE_URL therefore looked
 * exactly like a working deployment serving one stale record, which is impossible to
 * debug from the browser.
 *
 * This module makes database failures observable:
 *   - every failure is logged with its Prisma error code,
 *   - the last failure per call-site is retained for GET /api/health/db,
 *   - in production the request fails with 503 instead of returning mock data,
 *     unless ALLOW_MOCK_FALLBACK=true is explicitly set.
 */

const rawFlag = (process.env.ALLOW_MOCK_FALLBACK || '').trim().toLowerCase();
const ALLOW_MOCK_FALLBACK =
  rawFlag === 'true' ? true : rawFlag === 'false' ? false : !env.isProduction;

/** @type {Map<string, {code?: string, name?: string, message: string, at: string, count: number}>} */
const failures = new Map();
let lastSuccessAt = null;
let lastFailureAt = null;

const describeError = (err) => {
  const message =
    typeof err?.message === 'string'
      ? err.message.replace(/\s+/g, ' ').trim().slice(0, 500)
      : String(err);
  return {
    name: err?.name || 'Error',
    code: err?.code || err?.errorCode || undefined,
    message,
  };
};

/**
 * Record that a database read/write succeeded.
 */
const recordDbSuccess = () => {
  lastSuccessAt = new Date().toISOString();
};

/**
 * Handle a Prisma failure inside a model catch block.
 * Logs it, remembers it, and rethrows as a 503 unless mock fallback is allowed.
 *
 * @param {string} context  e.g. 'major-incidents.getMajorIncidents'
 * @param {unknown} err
 * @param {{allowFallback?: boolean}} [options] allowFallback keeps the legacy mock
 *        behaviour for bootstrap paths (auth) so diagnostics stay reachable.
 */
const handleDbError = (context, err, options = {}) => {
  const allowFallback = options.allowFallback === true || ALLOW_MOCK_FALLBACK;
  const info = describeError(err);
  const previous = failures.get(context);
  lastFailureAt = new Date().toISOString();
  failures.set(context, {
    ...info,
    at: lastFailureAt,
    count: (previous?.count || 0) + 1,
  });

  if (!env.isTest) {
    console.error(
      `[db:fail] ${context} ${info.code || info.name}: ${info.message}` +
        (allowFallback ? ' — serving mock fallback' : ' — responding 503')
    );
  }

  if (!allowFallback) {
    const error = new Error(
      `Database unavailable while serving ${context}. ${info.code ? `[${info.code}] ` : ''}${info.message}`
    );
    error.statusCode = 503;
    error.isOperational = true;
    error.code = info.code;
    throw error;
  }
};

/**
 * Live connectivity probe used by GET /api/health/db.
 */
const probeDatabase = async () => {
  const startedAt = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    recordDbSuccess();
    return { connected: true, latencyMs: Date.now() - startedAt };
  } catch (err) {
    const info = describeError(err);
    lastFailureAt = new Date().toISOString();
    failures.set('health.probe', { ...info, at: lastFailureAt, count: (failures.get('health.probe')?.count || 0) + 1 });
    return { connected: false, latencyMs: Date.now() - startedAt, error: info };
  }
};

/**
 * Row counts for the tables the UI reads from. Reveals "connected but empty"
 * (migrations ran, seed did not) as distinct from "cannot connect".
 */
const countKeyTables = async () => {
  const targets = {
    organisations: () => db.organisation.count(),
    users: () => db.user.count(),
    tickets: () => db.ticket.count(),
    majorIncidents: () => db.majorIncident.count(),
    majorIncidentUpdates: () => db.majorIncidentUpdate.count(),
    serviceCatalogueItems: () => db.serviceCatalogueItem.count(),
    approvals: () => db.approval.count(),
    projects: () => db.project.count(),
    changeRequests: () => db.changeRequest.count(),
    configurationItems: () => db.configurationItem.count(),
  };

  const counts = {};
  await Promise.all(
    Object.entries(targets).map(async ([key, run]) => {
      try {
        counts[key] = await run();
      } catch (err) {
        counts[key] = { error: describeError(err).message };
      }
    })
  );
  return counts;
};

/**
 * Redacted description of the configured datasource, safe to expose.
 */
const describeDatasource = () => {
  try {
    const url = new URL(env.DATABASE_URL);
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.replace(/^\//, '') || null,
      user: url.username || null,
      pooled: /pooler\.supabase\.com$/i.test(url.hostname) || url.searchParams.get('pgbouncer') === 'true',
      isLocalhost: ['localhost', '127.0.0.1', '::1'].includes(url.hostname),
      params: Object.fromEntries(url.searchParams.entries()),
    };
  } catch {
    return { error: 'DATABASE_URL could not be parsed' };
  }
};

const getDbDiagnostics = () => ({
  mockFallbackEnabled: ALLOW_MOCK_FALLBACK,
  lastSuccessAt,
  lastFailureAt,
  recentFailures: Object.fromEntries(failures),
});

module.exports = {
  ALLOW_MOCK_FALLBACK,
  handleDbError,
  recordDbSuccess,
  probeDatabase,
  countKeyTables,
  describeDatasource,
  getDbDiagnostics,
};
