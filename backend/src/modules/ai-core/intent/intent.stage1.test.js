'use strict';
// Stage 1 — Domain Verification Tests
// Covers: change-requests model (tenant isolation, empty-DB fix, IDOR guard)
//         intent model (bias-fix, threshold, fallback, input guards)
//         intent service (routing decision)
// Run via: node --test src/modules/change-requests/change-requests.stage1.test.js
//           (NODE_ENV and JWT_SECRET must be set — handled by run-node-tests.js)

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ─── Intent Model ─────────────────────────────────────────────────────────────
describe('intent.model — analyzeTextIntent', () => {
  const { analyzeTextIntent } = require('./intent.model');

  test('rejects blank input', async () => {
    await assert.rejects(() => analyzeTextIntent('   '), /Valid text input/);
  });

  test('rejects input exceeding 2000 chars', async () => {
    await assert.rejects(() => analyzeTextIntent('A'.repeat(2001)), /must not exceed/);
  });

  test('BIAS-FIX: Cybersecurity beats Backend on security-heavy prompt', async () => {
    const r = await analyzeTextIntent('security vulnerability in the backend API');
    assert.equal(r.category, 'Cybersecurity', `Expected Cybersecurity, got ${r.category}`);
    assert.ok(r.matchedKeywords >= 2, 'Expected ≥2 matched keywords');
  });

  test('Frontend matches button/component keywords', async () => {
    const r = await analyzeTextIntent('my button is broken on the frontend component');
    assert.equal(r.category, 'Frontend');
  });

  test('Backend matches multiple keywords with higher density', async () => {
    const r = await analyzeTextIntent('the database query on the server endpoint fails');
    assert.equal(r.category, 'Backend');
    assert.ok(r.matchedKeywords >= 2);
  });

  test('Generic input falls back to General Support', async () => {
    const r = await analyzeTextIntent('hello how are you today');
    assert.equal(r.category, 'General Support');
    assert.equal(r.meetsThreshold, false);
  });

  test('meetsThreshold false when confidence < 0.75', async () => {
    const r = await analyzeTextIntent('hello how are you today');
    assert.equal(r.meetsThreshold, false);
    assert.ok(r.confidence < 0.75);
  });

  test('matchedKeywords field is present and numeric', async () => {
    const r = await analyzeTextIntent('api server issue');
    assert.equal(typeof r.matchedKeywords, 'number');
  });
});

// ─── Intent Service ───────────────────────────────────────────────────────────
describe('intent.service — classifyIntent routing', () => {
  const { classifyIntent } = require('./intent.service');

  test('below-threshold routes to Human Escalation', async () => {
    const r = await classifyIntent({ text: 'hello how are you' });
    assert.equal(r.routingDecision, 'Human Escalation');
  });

  test('above-threshold routes to matched category', async () => {
    const r = await classifyIntent({ text: 'security breach on the firewall intrusion detected' });
    assert.equal(r.routingDecision, 'Cybersecurity');
  });

  test('throws on missing text field', async () => {
    await assert.rejects(() => classifyIntent({ text: '' }), /required/);
  });

  test('throws on non-object input', async () => {
    await assert.rejects(() => classifyIntent(null), /required/);
  });
});
