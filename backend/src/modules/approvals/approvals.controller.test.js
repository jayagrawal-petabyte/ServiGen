'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const controller = require('./approvals.controller');

// ---------------------------------------------------------------------------
// Minimal mock helpers
// ---------------------------------------------------------------------------

function mockRes() {
  const res = {
    _status: null,
    _body: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    }
  };
  return res;
}

function mockReq({ params = {}, query = {}, body = {} } = {}) {
  return { params, query, body };
}

// ---------------------------------------------------------------------------
// Approvals Controller tests
//
// NOTE: The approvals model mutates shared in-memory state, so test order
// matters. Tests that mutate (approve/reject) are placed last to avoid
// contaminating the 404 and 200-fetch assertions.
// ---------------------------------------------------------------------------

describe('Approvals Controller', () => {

  // ── getPendingApprovals ──────────────────────────────────────────────────

  describe('getPendingApprovals', () => {
    it('should return 200 and an array of pending approvals', async () => {
      const req = mockReq();
      const res = mockRes();

      await controller.getPendingApprovals(req, res);

      assert.equal(res._status, 200);
      assert.equal(res._body.success, true);
      assert.ok(Array.isArray(res._body.data), 'data should be an array');
      assert.ok(res._body.data.every(a => a.status === 'Pending'), 'all items should be Pending');
    });
  });

  // ── getApprovalById ──────────────────────────────────────────────────────

  describe('getApprovalById', () => {
    it('should return 404 when the approval ID does not exist', async () => {
      const req = mockReq({ params: { approvalId: 'does-not-exist' } });
      const res = mockRes();

      await controller.getApprovalById(req, res);

      assert.equal(res._status, 404);
      assert.equal(res._body.success, false);
      assert.equal(res._body.message, 'Approval request not found');
    });
  });

  // ── approveRequest ────────────────────────────────────────────────────────

  describe('approveRequest', () => {
    it('should return 400 when attempting to update a non-pending (already Approved) request', async () => {
      // 'a3' is 'Approved' in the initial mock data
      const req = mockReq({ params: { approvalId: 'a3' } });
      const res = mockRes();

      await controller.approveRequest(req, res);

      assert.equal(res._status, 400);
      assert.equal(res._body.success, false);
      assert.equal(res._body.message, 'Cannot update non-pending request');
    });

    it('should return 200 and the updated approval when approving a pending request', async () => {
      const req = mockReq({ params: { approvalId: 'a1' } });
      const res = mockRes();

      await controller.approveRequest(req, res);

      assert.equal(res._status, 200);
      assert.equal(res._body.success, true);
      assert.ok(res._body.data, 'data should be present');
      assert.equal(res._body.data.id, 'a1');
      assert.equal(res._body.data.status, 'Approved');
    });
  });

  // ── rejectRequest ─────────────────────────────────────────────────────────

  describe('rejectRequest', () => {
    it('should return 200 and the updated approval when rejecting a pending request', async () => {
      // 'a2' remains Pending at this point (only 'a1' was consumed above)
      const req = mockReq({ params: { approvalId: 'a2' } });
      const res = mockRes();

      await controller.rejectRequest(req, res);

      assert.equal(res._status, 200);
      assert.equal(res._body.success, true);
      assert.ok(res._body.data, 'data should be present');
      assert.equal(res._body.data.id, 'a2');
      assert.equal(res._body.data.status, 'Rejected');
    });
  });

  // ── Security, Multi-Stage & Validation ───────────────────────────────────

  describe('Security, Multi-Stage Workflow & Input Validation', () => {
    it('should sanitize HTML comments and record decision trail', async () => {
      const model = require('./approvals.model');
      model.createApprovalRecord({
        id: 'sec-app-1',
        title: 'Security Probe',
        status: 'Pending',
        stage: 1,
        totalStages: 2,
        organisationId: 'org-test',
        approverId: 'approver-sec'
      });

      const req = {
        params: { approvalId: 'sec-app-1' },
        body: { comments: '<script>alert(1)</script>Approved with condition' },
        user: { id: 'approver-sec', role: 'Approver', organisationId: 'org-test', email: 'approver@sec.com' }
      };
      const res = mockRes();

      await controller.approveRequest(req, res);

      assert.equal(res._status, 200);
      assert.equal(res._body.data.status, 'Approved');
      assert.equal(res._body.data.comments, 'scriptalert(1)/scriptApproved with condition');
      assert.equal(res._body.data.actedBy, 'approver@sec.com');

      // Verify that stage 2 was spawned
      const nextStage = await model.getApprovalById('sec-app-1-S2');
      assert.ok(nextStage, 'Stage 2 approval should have been created');
      assert.equal(nextStage.stage, 2);
      assert.equal(nextStage.status, 'Pending');
    });

    it('should reject comments exceeding 2000 characters', async () => {
      const model = require('./approvals.model');
      model.createApprovalRecord({
        id: 'sec-app-len',
        title: 'Length Probe',
        status: 'Pending',
        stage: 1,
        totalStages: 1,
        organisationId: 'org-test',
        approverId: 'approver-sec'
      });

      const req = {
        params: { approvalId: 'sec-app-len' },
        body: { comments: 'C'.repeat(2001) },
        user: { id: 'approver-sec', role: 'Approver', organisationId: 'org-test' }
      };
      const res = mockRes();

      await controller.approveRequest(req, res);

      assert.equal(res._status, 400);
      assert.equal(res._body.success, false);
      assert.match(res._body.message, /must not exceed 2000 characters/);
    });

    it('should return 404 for cross-tenant approval access (IDOR defense)', async () => {
      const model = require('./approvals.model');
      model.createApprovalRecord({
        id: 'sec-app-tenant',
        title: 'Tenant Probe',
        status: 'Pending',
        organisationId: 'org-A',
        approverId: 'approver-A'
      });

      const req = {
        params: { approvalId: 'sec-app-tenant' },
        user: { id: 'approver-B', role: 'Approver', organisationId: 'org-B' }
      };
      const res = mockRes();

      await controller.getApprovalById(req, res);

      assert.equal(res._status, 404);
      assert.equal(res._body.success, false);
    });

    it('should return 404 when an unauthorized approver tries to act on another approver item', async () => {
      const model = require('./approvals.model');
      model.createApprovalRecord({
        id: 'sec-app-unauth',
        title: 'Unauth Probe',
        status: 'Pending',
        organisationId: 'org-test',
        approverId: 'assigned-approver'
      });

      const req = {
        params: { approvalId: 'sec-app-unauth' },
        user: { id: 'other-approver', role: 'Approver', organisationId: 'org-test' }
      };
      const res = mockRes();

      await controller.approveRequest(req, res);

      assert.equal(res._status, 404);
      assert.equal(res._body.success, false);
    });
  });
});
