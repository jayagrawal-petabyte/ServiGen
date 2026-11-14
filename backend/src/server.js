'use strict';

const app = require('./app');
const { env, db } = require('./config');

const PORT = env.PORT;

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
