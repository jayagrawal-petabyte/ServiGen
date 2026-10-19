'use strict';

const app = require('./app');
const { env, db } = require('./config');
const { probeDatabase, describeDatasource, ALLOW_MOCK_FALLBACK } = require('./shared/utils/db-guard');

const PORT = env.PORT;

/**
 * Verify the datasource at boot so a misconfigured DATABASE_URL is visible in the
 * deploy logs instead of silently degrading every endpoint to mock data.
 */
const verifyDatabase = async () => {
  const datasource = describeDatasource();
  console.log(
    `[servigen] Datasource: ${datasource.host || 'unknown'}:${datasource.port || '?'}/${datasource.database || '?'}` +
      `${datasource.pooled ? ' (pooled)' : ''}`
  );

  if (env.isProduction && datasource.isLocalhost) {
    console.error(
      '[servigen] FATAL-ish: DATABASE_URL points at localhost in production. ' +
        'Set it to your Supabase connection string in the Render dashboard.'
    );
  }

  const probe = await probeDatabase();
  if (probe.connected) {
    console.log(`[servigen] Database connected in ${probe.latencyMs}ms`);
  } else {
    console.error(
      `[servigen] Database UNREACHABLE after ${probe.latencyMs}ms ` +
        `[${probe.error?.code || probe.error?.name}] ${probe.error?.message}`
    );
    console.error(
      ALLOW_MOCK_FALLBACK
        ? '[servigen] ALLOW_MOCK_FALLBACK is on — endpoints will serve hardcoded mock data.'
        : '[servigen] Data endpoints will return 503 until the database is reachable. See GET /api/health/db.'
    );
  }
};

const server = app.listen(PORT, () => {
  console.log(`[servigen] Backend running on http://localhost:${PORT} (${env.NODE_ENV})`);
  console.log(`[servigen] Health check:         http://localhost:${PORT}/api/health`);
  console.log(`[servigen] My Work API:          http://localhost:${PORT}/api/my-work`);
  console.log(`[servigen] Dashboard API:        http://localhost:${PORT}/api/dashboard`);
  console.log(`[servigen] Approvals API:        http://localhost:${PORT}/api/approvals`);
  console.log(`[servigen] Services API:         http://localhost:${PORT}/api/services`);
  console.log(`[servigen] Major Incidents API:  http://localhost:${PORT}/api/major-incidents`);
  console.log(`[servigen] Change Requests API:  http://localhost:${PORT}/api/change-requests`);
  console.log(`[servigen] AI Response API:      http://localhost:${PORT}/api/ai-core/response`);
  console.log(`[servigen] DB diagnostics:        http://localhost:${PORT}/api/health/db`);
  verifyDatabase().catch((err) => console.error('[servigen] Database check failed:', err.message));
});

let stopping = false;
const shutdown = () => {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => {
    console.error('[servigen] Shutdown timed out');
    process.exit(1);
  }, 10000);
  timeout.unref();
  server.close(async (error) => {
    try {
      await db.$disconnect();
      if (error) throw error;
    } catch (err) {
      console.error('[servigen] Shutdown failed:', err.message);
      process.exitCode = 1;
    } finally {
      clearTimeout(timeout);
    }
  });
  server.closeIdleConnections?.();
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
