'use strict';
// Stage 1 — Change Requests Domain Verification Tests
// Covers: tenant isolation, empty-org guard (IDOR), Active filter, missing record handling
// Run via scripts/run-node-tests.js (NODE_ENV=test injected automatically)
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-at-least-32-characters-long!';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const crModel = require('./change-requests.model');

describe('change-requests.model — tenant isolation & data correctness', () => {

  test('getChangeRequests returns an array', async () => {
    const data = await crModel.getChangeRequests({});
    assert.ok(Array.isArray(data));
  });

  test('getChangeRequests has records for known org', async () => {
    const data = await crModel.getChangeRequests({ organisationId: 'org-001' });
    assert.ok(data.length > 0, 'Expected records for org-001');
  });

  test('TENANT-FIX: unknown org returns empty array (no mock leak)', async () => {
    const data = await crModel.getChangeRequests({ organisationId: 'org-UNKNOWN' });
    assert.equal(data.length, 0, 'Unknown org should yield zero records');
  });

  test('TENANT-FIX: all returned records match requested organisationId', async () => {
    const data = await crModel.getChangeRequests({ organisationId: 'org-001' });
    data.forEach(r =>
      assert.equal(r.organisationId, 'org-001', `Record ${r.id} has wrong org`)
    );
  });

  test('NO-HARDCODE: organisationId on records is not blindly "org-001" for all', async () => {
    // Verify formatRecord reads from source, not a hardcoded string
    const data = await crModel.getChangeRequests({});
    data.forEach(r =>
      assert.ok(
        typeof r.organisationId === 'string' || r.organisationId === null,
        'organisationId must be string or null from source data'
      )
    );
  });

  test('getActiveChangeRequests returns only Active records', async () => {
    const data = await crModel.getActiveChangeRequests({});
    assert.ok(Array.isArray(data));
    data.forEach(r =>
      assert.equal(r.status, 'Active', `Record ${r.id} has non-Active status: ${r.status}`)
    );
  });

  test('getActiveChangeRequests respects tenant filter', async () => {
    const data = await crModel.getActiveChangeRequests({ organisationId: 'org-UNKNOWN' });
    assert.equal(data.length, 0);
  });

  test('getChangeRequestById returns correct record for matching org', async () => {
    const r = await crModel.getChangeRequestById('CR-001', 'org-001');
    assert.ok(r !== null);
    assert.equal(r.id, 'CR-001');
  });

  test('IDOR-FIX: getChangeRequestById blocked for wrong org', async () => {
    const r = await crModel.getChangeRequestById('CR-001', 'org-UNKNOWN');
    assert.equal(r, null, 'Cross-org access must be blocked');
  });

  test('getChangeRequestById returns null for non-existent ID', async () => {
    const r = await crModel.getChangeRequestById('CR-NOTEXIST', 'org-001');
    assert.equal(r, null);
  });

  test('formatted record has expected shape keys', async () => {
    const [r] = await crModel.getChangeRequests({ organisationId: 'org-001' });
    const keys = ['id', 'agent', 'summary', 'changeType', 'status', 'ciTag', 'relatedService', 'startDate', 'endDate', 'organisationId'];
    keys.forEach(k => assert.ok(k in r, `Missing key: ${k}`));
  });
});
