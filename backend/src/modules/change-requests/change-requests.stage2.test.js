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

  test('computes dynamic riskScore and riskLevel based on inputs and service criticality', async () => {
    const highRisk = await createNewChangeRequest({
      summary: 'Emergency database migration',
      changeType: 'Emergency',
      impact: 'High',
      urgency: 'High',
      relatedService: 'Core Database Cluster',
    }, 'org-001');
    assert.ok(highRisk.riskScore >= 16, `Expected riskScore >= 16, got ${highRisk.riskScore}`);
    assert.equal(highRisk.riskLevel, 'Critical');

    const lowRisk = await createNewChangeRequest({
      summary: 'Standard font update',
      changeType: 'Standard',
      impact: 'Low',
      urgency: 'Low',
      relatedService: 'Marketing Page',
    }, 'org-001');
    assert.ok(lowRisk.riskScore <= 7, `Expected riskScore <= 7, got ${lowRisk.riskScore}`);
    assert.equal(lowRisk.riskLevel, 'Low');
  });

  test('sanitizes HTML and script tags from input fields', async () => {
    const sanitized = await createNewChangeRequest({
      summary: '<script>alert("xss")</script>Upgrade proxy',
      changeType: 'Normal',
      rollbackPlan: '<b>Revert snapshot</b><iframe src="evil.com"></iframe>',
      preImplementationTestingNotes: '<img onerror="steal()"/>Notes tested',
      implementationSteps: [
        { stepNumber: 1, description: '<svg onload="alert(1)"/>Step 1' }
      ],
    }, 'org-001');

    assert.equal(sanitized.summary, 'scriptalert("xss")/scriptUpgrade proxy');
    assert.equal(sanitized.rollbackPlan, 'bRevert snapshot/biframe src="evil.com"/iframe');
    assert.equal(sanitized.preImplementationTestingNotes, 'img onerror="steal()"/Notes tested');
    assert.equal(sanitized.implementationSteps[0].description, 'svg onload="alert(1)"/Step 1');
  });

  test('rejects rollbackPlan exceeding 10000 characters', async () => {
    await assert.rejects(
      () => createNewChangeRequest({
        summary: 'Upgrade',
        changeType: 'Normal',
        rollbackPlan: 'R'.repeat(10001),
      }, 'org-001'),
      /rollbackPlan must not exceed 10000 characters/
    );
  });

  test('rejects preImplementationTestingNotes exceeding 10000 characters', async () => {
    await assert.rejects(
      () => createNewChangeRequest({
        summary: 'Upgrade',
        changeType: 'Normal',
        preImplementationTestingNotes: 'N'.repeat(10001),
      }, 'org-001'),
      /preImplementationTestingNotes must not exceed 10000 characters/
    );
  });

  test('rejects implementation step description exceeding 2000 characters', async () => {
    await assert.rejects(
      () => createNewChangeRequest({
        summary: 'Upgrade',
        changeType: 'Normal',
        implementationSteps: [{ description: 'S'.repeat(2001) }],
      }, 'org-001'),
      /Step description must not exceed 2000 characters/
    );
  });
});

// ─── Stage 2B: PATCH /api/change-requests/:id ────────────────────────────────

describe('updateChangeRequestData — status patch & IDOR guard', () => {

  test('updates status for correct tenant', async () => {
    const updated = await updateChangeRequestData('CR-001', { status: 'Completed' }, 'org-001');
    assert.ok(updated !== null, 'Expected update to succeed');
    assert.equal(updated.status, 'Completed');
  });

  test('R4-Bug 2 FIX: blocks direct status transition from Draft or On Hold to Approved', async () => {
    // CR-001 created in test or seed can be put into Draft
    await updateChangeRequestData('CR-001', { status: 'Draft' }, 'org-001');
    await assert.rejects(
      () => updateChangeRequestData('CR-001', { status: 'Approved' }, 'org-001'),
      /Cannot transition directly from "Draft" to "Approved" \(workflow bypass prevented\)/
    );

    await updateChangeRequestData('CR-001', { status: 'On Hold' }, 'org-001');
    await assert.rejects(
      () => updateChangeRequestData('CR-001', { status: 'Approved' }, 'org-001'),
      /Cannot transition directly from "On Hold" to "Approved" \(workflow bypass prevented\)/
    );
  });

  test('allows transition from Pending Approval to Approved', async () => {
    await updateChangeRequestData('CR-001', { status: 'Pending Approval' }, 'org-001');
    const approved = await updateChangeRequestData('CR-001', { status: 'Approved' }, 'org-001');
    assert.equal(approved.status, 'Approved');
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

  test('patches structured fields with sanitization', async () => {
    const updated = await updateChangeRequestData('CR-001', {
      rollbackPlan: '<script>revert()</script>Clean Rollback',
      preImplementationTestingNotes: '<test>verified</test>',
      implementationSteps: [
        { stepNumber: 1, description: '<b>Step 1</b>', owner: 'DevOps' }
      ]
    }, 'org-001');

    assert.equal(updated.rollbackPlan, 'scriptrevert()/scriptClean Rollback');
    assert.equal(updated.preImplementationTestingNotes, 'testverified/test');
    assert.equal(updated.implementationSteps[0].description, 'bStep 1/b');
  });
});

// ─── Stage 2C: Calendar Overlay Data ─────────────────────────────────────────

describe('getCalendarOverlayData — scheduled changes & freeze windows', () => {
  const { getCalendarOverlayData } = require('./change-requests.service');

  test('returns scheduledChanges and freezeWindows', async () => {
    const data = await getCalendarOverlayData({ organisationId: 'org-001' });
    assert.ok(Array.isArray(data.scheduledChanges), 'scheduledChanges must be an array');
    assert.ok(Array.isArray(data.freezeWindows), 'freezeWindows must be an array');
    assert.ok(data.freezeWindows.length > 0, 'Must include pre-configured freeze windows');
  });

  test('filters scheduledChanges by date range', async () => {
    const data = await getCalendarOverlayData({
      startDate: '2026-10-01T00:00:00Z',
      endDate: '2026-10-31T23:59:59Z',
      organisationId: 'org-001',
    });
    for (const change of data.scheduledChanges) {
      if (change.startDate) {
        assert.ok(new Date(change.startDate) <= new Date('2026-10-31T23:59:59Z'));
      }
    }
  });
});
