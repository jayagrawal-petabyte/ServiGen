'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const controller = require('./services-catalogue.controller');

// ---------------------------------------------------------------------------
// Minimal mock helpers
// ---------------------------------------------------------------------------

/**
 * Creates a minimal mock Express response object that captures the last
 * status/json pair so tests can inspect the result.
 */
function mockRes() {
  const res = {
    _status: null,
    _body: null,
    status(code) {
      this._status = code;
      return this; // allow chaining: res.status(200).json(...)
    },
    json(body) {
      this._body = body;
      return this;
    }
  };
  return res;
}

/**
 * Creates a minimal mock Express request object.
 */
function mockReq({ params = {}, query = {}, body = {} } = {}) {
  return { params, query, body };
}

// ---------------------------------------------------------------------------
// Services Catalogue Controller tests
// ---------------------------------------------------------------------------

describe('Services Catalogue Controller', () => {

  // ── getServices ──────────────────────────────────────────────────────────

  describe('getServices', () => {
    it('should return 200 and an array of services on success', async () => {
      const req = mockReq({ query: {} });
      const res = mockRes();

      await controller.getServices(req, res);

      assert.equal(res._status, 200);
      assert.equal(res._body.success, true);
      assert.ok(Array.isArray(res._body.data), 'data should be an array');
      assert.ok(res._body.data.length > 0, 'data should not be empty');
    });

    it('should return services filtered by category when category query param is provided', async () => {
      const req = mockReq({ query: { category: 'Hardware' } });
      const res = mockRes();

      await controller.getServices(req, res);

      assert.equal(res._status, 200);
      assert.equal(res._body.success, true);
      assert.ok(res._body.data.every(s => s.category === 'Hardware'));
    });

    // BI-9: repeated query params arrive as arrays from Express — must return 400
    it('should return 400 when category query param is an array (repeated param)', async () => {
      const req = mockReq({ query: { category: ['Hardware', 'Software'] } });
      const res = mockRes();

      await controller.getServices(req, res);

      assert.equal(res._status, 400);
      assert.equal(res._body.success, false);
      assert.ok(res._body.message.includes('category'), 'error message should mention the bad param');
    });

    it('should return 400 when search query param is an array (repeated param)', async () => {
      const req = mockReq({ query: { search: ['laptop', 'vpn'] } });
      const res = mockRes();

      await controller.getServices(req, res);

      assert.equal(res._status, 400);
      assert.equal(res._body.success, false);
      assert.ok(res._body.message.includes('search'), 'error message should mention the bad param');
    });
  });

  // ── getServiceById ───────────────────────────────────────────────────────

  describe('getServiceById', () => {
    it('should return 200 and the service when a valid ID is provided', async () => {
      const req = mockReq({ params: { serviceId: '1' } });
      const res = mockRes();

      await controller.getServiceById(req, res);

      assert.equal(res._status, 200);
      assert.equal(res._body.success, true);
      assert.ok(res._body.data, 'data should be present');
      assert.equal(res._body.data.id, '1');
    });

    it('should return 404 when the service ID does not exist', async () => {
      const req = mockReq({ params: { serviceId: 'does-not-exist' } });
      const res = mockRes();

      await controller.getServiceById(req, res);

      assert.equal(res._status, 404);
      assert.equal(res._body.success, false);
      assert.equal(res._body.message, 'Service not found');
    });
  });

  // ── submitServiceRequest ─────────────────────────────────────────────────

  describe('submitServiceRequest', () => {
    it('should return 400 when the request body is empty', async () => {
      const req = mockReq({ params: { serviceId: '1' }, body: {} });
      const res = mockRes();

      await controller.submitServiceRequest(req, res);

      assert.equal(res._status, 400);
      assert.equal(res._body.success, false);
      assert.equal(res._body.message, 'Request body is missing');
    });

    it('should return 201 and the created request when a valid request is submitted', async () => {
      const req = mockReq({
        params: { serviceId: '1' },
        body: { requester: 'Test User', notes: 'Needed for development' }
      });
      const res = mockRes();

      await controller.submitServiceRequest(req, res);

      assert.equal(res._status, 201);
      assert.equal(res._body.success, true);
      assert.ok(res._body.data, 'data should be present');
      assert.ok(res._body.data.id.startsWith('req_'), 'should have a generated request ID');
      assert.equal(res._body.data.serviceId, '1');
      assert.equal(res._body.data.status, 'Pending Approval');
    });

    // BI-8: a caller injecting protected metadata in the body must not be able
    //       to overwrite server-selected serviceId, serviceName, id or submittedAt
    it('should ignore injected serviceId/serviceName in the request body (BI-8)', async () => {
      const req = mockReq({
        params: { serviceId: '1' },
        body: {
          requester: 'Attacker',
          serviceId: '99',           // attempt to overwrite
          serviceName: 'Evil Service', // attempt to overwrite
          id: 'req_FAKE',            // attempt to overwrite
          submittedAt: '1970-01-01T00:00:00Z' // attempt to overwrite
        }
      });
      const res = mockRes();

      await controller.submitServiceRequest(req, res);

      assert.equal(res._status, 201);
      const data = res._body.data;
      assert.equal(data.serviceId, '1', 'serviceId must be from the URL, not the body');
      assert.equal(data.serviceName, 'Request a Laptop', 'serviceName must come from the service catalogue');
      assert.notEqual(data.id, 'req_FAKE', 'id must be server-generated, not caller-supplied');
      assert.notEqual(data.submittedAt, '1970-01-01T00:00:00Z', 'submittedAt must be server-generated');
    });

    it('should sanitize unsafe HTML from ticket descriptions', async () => {
      const req = mockReq({
        params: { serviceId: '1' },
        body: {
          requester: '<script>alert(1)</script>Bob',
          reason: '<img onerror=alert(2) src=x>Need laptop',
        },
      });
      const res = mockRes();

      await controller.submitServiceRequest(req, res);

      assert.equal(res._status, 201);
      assert.equal(res._body.data.requester, 'scriptalert(1)/scriptBob');
      assert.equal(res._body.data.reason, 'Need laptop');
    });

    it('should accept ticket descriptions up to 10000 characters', async () => {
      const req = mockReq({
        params: { serviceId: '1' },
        body: {
          requester: 'Bob',
          reason: 'A'.repeat(10000),
        },
      });
      const res = mockRes();

      await controller.submitServiceRequest(req, res);

      assert.equal(res._status, 201);
      assert.equal(res._body.data.reason.length, 10000);
    });

    it('should reject ticket descriptions exceeding 10000 characters', async () => {
      const req = mockReq({
        params: { serviceId: '1' },
        body: {
          requester: 'Bob',
          reason: 'A'.repeat(10001),
        },
      });
      const res = mockRes();

      await controller.submitServiceRequest(req, res);

      assert.equal(res._status, 400);
      assert.match(res._body.message, /10000 characters/);
    });

    it('should reject other form fields exceeding 2000 characters', async () => {
      const req = mockReq({
        params: { serviceId: '1' },
        body: {
          requester: 'Bob',
          shippingAddress: 'A'.repeat(2001),
        },
      });
      const res = mockRes();

      await controller.submitServiceRequest(req, res);

      assert.equal(res._status, 400);
      assert.match(res._body.message, /2000 characters/);
    });
  });
  describe('getServiceRequests and getServiceRequestDetail', () => {
    it('should return 200 and list of requests', async () => {
      const req = mockReq();
      const res = mockRes();

      await controller.getServiceRequests(req, res);

      assert.equal(res._status, 200);
      assert.equal(res._body.success, true);
      assert.ok(Array.isArray(res._body.data));
    });

    it('should return 404 for cross-tenant request access (IDOR defense)', async () => {
      const createRes = mockRes();
      await controller.submitServiceRequest(
        { params: { serviceId: '1' }, body: { requester: 'TenantUser' }, user: { id: 'u1', role: 'Engineer', organisationId: 'org-tenant-A' } },
        createRes
      );
      const createdId = createRes._body.data.id;

      // Access from another tenant
      const req = {
        params: { requestId: createdId },
        user: { id: 'attacker', role: 'Engineer', organisationId: 'org-tenant-B' }
      };
      const res = mockRes();

      await controller.getServiceRequestDetail(req, res);

      assert.equal(res._status, 404);
      assert.equal(res._body.success, false);
    });
  });
});
