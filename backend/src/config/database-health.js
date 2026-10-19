'use strict';

/** Public readiness for the frontend's unauthenticated database-status check. */
const createDatabaseHealthHandler = ({ probeDatabase, getDbDiagnostics, environment, now = Date.now }) => {
  const cacheMs = 5000;
  let cached;
  let pending;

  const snapshot = async () => {
    if (cached && now() < cached.expiresAt) return cached.payload;
    if (!pending) {
      pending = (async () => {
        const startedAt = now();
        let probe;
        try {
          probe = await probeDatabase();
        } catch {
          probe = { connected: false, latencyMs: Math.max(0, now() - startedAt) };
        }
        const connected = probe.connected === true;
        const payload = {
          success: connected,
          connected,
          latencyMs: probe.latencyMs,
          env: environment,
          mockFallbackEnabled: getDbDiagnostics().mockFallbackEnabled === true,
          timestamp: new Date(now()).toISOString(),
          ...(!connected ? { error: { message: 'Database connection is temporarily unavailable.' } } : {}),
        };
        // Cache only this small public payload, never connection details or errors.
        cached = { payload, expiresAt: now() + cacheMs };
        return payload;
      })().finally(() => { pending = undefined; });
    }
    return pending;
  };

  return async (_req, res, next) => {
    try {
      const payload = await snapshot();
      return res.set('Cache-Control', 'no-store').status(payload.connected ? 200 : 503).json(payload);
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = createDatabaseHealthHandler;
