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
});
