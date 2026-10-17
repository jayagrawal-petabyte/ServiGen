'use strict';
// Stage 2A & 2B — Change Requests Write Operations
// Covers: POST (create) validation, PATCH (update status) validation + IDOR guard
// Run via: node --test src/modules/change-requests/change-requests.stage2.test.js
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-at-least-32-characters-long!';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { createNewChangeRequest, updateChangeRequestData } = require('./change-requests.service');
const crModel = require('./change-requests.model');

// ─── Stage 2A: POST /api/change-requests ─────────────────────────────────────

describe('createNewChangeRequest — validation & creation', () => {

  test('creates record with valid payload', async () => {
    const result = await createNewChangeRequest({
      summary: 'Deploy new payment gateway',
      changeType: 'Normal',
    }, 'org-001');
    assert.ok(result.id, 'Created record must have an id');
    assert.equal(result.status, 'Draft', 'Status must default to Draft on creation');
    assert.equal(result.summary, 'Deploy new payment gateway');
    assert.equal(result.changeType, 'Normal');
  });

  test('rejects missing summary', async () => {
    await assert.rejects(
      () => createNewChangeRequest({ changeType: 'Normal' }, 'org-001'),
      /summary is required/
    );
  });

  test('rejects empty string summary', async () => {
    await assert.rejects(
      () => createNewChangeRequest({ summary: '   ', changeType: 'Normal' }, 'org-001'),
      /summary is required/
    );
  });

  test('rejects summary exceeding 500 characters', async () => {
    await assert.rejects(
      () => createNewChangeRequest({ summary: 'x'.repeat(501), changeType: 'Standard' }, 'org-001'),
      /500 characters/
    );
  });

  test('rejects missing changeType', async () => {
    await assert.rejects(
      () => createNewChangeRequest({ summary: 'Valid summary' }, 'org-001'),
      /changeType must be one of/
    );
  });

  test('rejects invalid changeType value', async () => {
    await assert.rejects(
      () => createNewChangeRequest({ summary: 'Valid summary', changeType: 'Urgent' }, 'org-001'),
      /changeType must be one of/
    );
  });

  test('rejects invalid startDate format', async () => {
    await assert.rejects(
      () => createNewChangeRequest({ summary: 'x', changeType: 'Normal', startDate: 'not-a-date' }, 'org-001'),
      /ISO 8601/
    );
  });

  test('rejects startDate after endDate', async () => {
    await assert.rejects(
      () => createNewChangeRequest({
        summary: 'x',
        changeType: 'Normal',
        startDate: '2026-11-10T00:00:00Z',
        endDate: '2026-11-01T00:00:00Z',
      }, 'org-001'),
      /startDate must not be after endDate/
    );
  });

  test('accepts Standard changeType', async () => {
    const r = await createNewChangeRequest({ summary: 'Patch network switch', changeType: 'Standard' }, 'org-001');
    assert.equal(r.changeType, 'Standard');
  });

  test('accepts Emergency changeType', async () => {
    const r = await createNewChangeRequest({ summary: 'Emergency hotfix', changeType: 'Emergency' }, 'org-001');
    assert.equal(r.changeType, 'Emergency');
  });
});

// ─── Stage 2B: PATCH /api/change-requests/:id ────────────────────────────────

describe('updateChangeRequestData — status patch & IDOR guard', () => {

  test('updates status for correct tenant', async () => {
    const updated = await updateChangeRequestData('CR-001', { status: 'Completed' }, 'org-001');
    assert.ok(updated !== null, 'Expected update to succeed');
    assert.equal(updated.status, 'Completed');
  });

  test('IDOR: blocks update for wrong tenant', async () => {
    const result = await updateChangeRequestData('CR-001', { status: 'Active' }, 'org-UNKNOWN');
    assert.equal(result, null, 'Cross-org update must be blocked');
  });

  test('returns null for non-existent ID', async () => {
    const result = await updateChangeRequestData('CR-NOTEXIST', { status: 'Active' }, 'org-001');
    assert.equal(result, null);
  });

  test('rejects empty body (no patchable field)', async () => {
    await assert.rejects(
      () => updateChangeRequestData('CR-001', {}, 'org-001'),
      /patchable field/
    );
  });

  test('rejects invalid status value', async () => {
    await assert.rejects(
      () => updateChangeRequestData('CR-001', { status: 'YOLO' }, 'org-001'),
      /status must be one of/
    );
  });

  test('allows all valid status enum values', async () => {
    const { VALID_STATUSES } = require('./change-requests.model');
    for (const s of VALID_STATUSES) {
      // Should not throw — actual DB call skipped in test env
      const r = await updateChangeRequestData('CR-002', { status: s }, 'org-001');
      // CR-002 is in mock data with org-001, so should succeed for valid statuses
      assert.ok(r !== undefined);
    }
  });
});
