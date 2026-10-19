'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const createDatabaseHealthHandler = require('./database-health');

const response = () => ({
  headers: {},
  set(key, value) { this.headers[key] = value; return this; },
  status(value) { this.statusCode = value; return this; },
  json(value) { this.body = value; return this; },
});
const invoke = async handler => {
  const res = response();
  await handler({}, res, error => { throw error; });
  return res;
};

test('public database readiness excludes datasource details, table counts and raw failures', async () => {
  const handler = createDatabaseHealthHandler({
    environment: 'production',
    probeDatabase: async () => ({ connected: true, latencyMs: 12 }),
    getDbDiagnostics: () => ({
      mockFallbackEnabled: false,
      recentFailures: { earlier: { message: 'postgresql://private:secret@private-host/db' } },
    }),
  });
  const res = await invoke(handler);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(res.body.connected, true);
  assert.equal(res.body.success, true);
  assert.equal(res.body.mockFallbackEnabled, false);
  assert.deepEqual(Object.keys(res.body).sort(), ['connected', 'env', 'latencyMs', 'mockFallbackEnabled', 'success', 'timestamp']);
  assert.doesNotMatch(JSON.stringify(res.body), /private|secret|recentFailures|datasource|counts/);
});

test('a genuine database failure returns 503 without exposing its underlying error', async () => {
  const handler = createDatabaseHealthHandler({
    environment: 'production',
    probeDatabase: async () => ({ connected: false, latencyMs: 4, error: { message: 'password=private-secret', code: 'P1000' } }),
    getDbDiagnostics: () => ({ mockFallbackEnabled: false }),
  });
  const res = await invoke(handler);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.connected, false);
  assert.equal(res.body.error.message, 'Database connection is temporarily unavailable.');
  assert.doesNotMatch(JSON.stringify(res.body), /private-secret|P1000/);
});

test('concurrent requests share a database probe and the next probe detects recovery', async () => {
  let clock = 10000;
  let calls = 0;
  let complete;
  const handler = createDatabaseHealthHandler({
    environment: 'production',
    now: () => clock,
    probeDatabase: () => {
      calls += 1;
      return new Promise(resolve => { complete = resolve; });
    },
    getDbDiagnostics: () => ({ mockFallbackEnabled: false }),
  });
  const first = invoke(handler);
  const concurrent = invoke(handler);
  assert.equal(calls, 1);
  complete({ connected: false, latencyMs: 1 });
  assert.equal((await first).statusCode, 503);
  assert.equal((await concurrent).statusCode, 503);
  assert.equal((await invoke(handler)).statusCode, 503);
  assert.equal(calls, 1);
  clock += 5001;
  const recovered = invoke(handler);
  assert.equal(calls, 2);
  complete({ connected: true, latencyMs: 2 });
  const res = await recovered;
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.error, undefined);
});

test('unexpected probe rejection is reported as unavailable and mock fallback stays explicit', async () => {
  const handler = createDatabaseHealthHandler({
    environment: 'production',
    probeDatabase: async () => { throw new Error('private connection details'); },
    getDbDiagnostics: () => ({ mockFallbackEnabled: true }),
  });
  const res = await invoke(handler);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.mockFallbackEnabled, true);
  assert.doesNotMatch(JSON.stringify(res.body), /private connection details/);
});
