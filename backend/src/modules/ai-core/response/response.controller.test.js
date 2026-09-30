'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const controller = require('./response.controller');

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

function mockReq({ body = {} } = {}) {
  return { body };
}

// ---------------------------------------------------------------------------
// AI Response Controller tests
// ---------------------------------------------------------------------------

describe('AI Response Controller', () => {

  // ── formatResponse – validation ──────────────────────────────────────────

  describe('formatResponse – input validation', () => {
    it('should return 400 when both query and intent are missing', () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      controller.formatResponse(req, res);

      assert.equal(res._status, 400);
      assert.equal(res._body.success, false);
      assert.equal(res._body.message, 'query and intent are required');
    });

    it('should return 400 when query is missing but intent is present', () => {
      const req = mockReq({ body: { intent: 'service_request' } });
      const res = mockRes();

      controller.formatResponse(req, res);

      assert.equal(res._status, 400);
      assert.equal(res._body.success, false);
      assert.equal(res._body.message, 'query and intent are required');
    });

    it('should return 400 when intent is missing but query is present', () => {
      const req = mockReq({ body: { query: 'I need a laptop' } });
      const res = mockRes();

      controller.formatResponse(req, res);

      assert.equal(res._status, 400);
      assert.equal(res._body.success, false);
      assert.equal(res._body.message, 'query and intent are required');
    });
  });

  // ── formatResponse – success ──────────────────────────────────────────────

  describe('formatResponse – success', () => {
    it('should return 200 when both query and intent are provided', () => {
      const req = mockReq({
        body: { query: 'I need a laptop', intent: 'service_request' }
      });
      const res = mockRes();

      controller.formatResponse(req, res);

      assert.equal(res._status, 200);
      assert.equal(res._body.success, true);
      assert.ok(res._body.data, 'data should be present');
    });

    it('should return structured data with the expected shape', () => {
      const req = mockReq({
        body: {
          query: 'I need a laptop',
          intent: 'service_request',
          knowledge: [{ id: 'k1', title: 'Hardware Policy', content: 'You can request a laptop.' }],
          recommendations: [{ action: 'apply', targetId: '1', description: 'Request a Laptop' }]
        }
      });
      const res = mockRes();

      controller.formatResponse(req, res);

      assert.equal(res._status, 200);
      assert.equal(res._body.success, true);

      const data = res._body.data;
      assert.equal(data.type, 'service_request');
      assert.ok(typeof data.message === 'string' && data.message.length > 0, 'message should be a non-empty string');
      assert.ok(Array.isArray(data.knowledge), 'knowledge should be an array');
      assert.ok(Array.isArray(data.recommendations), 'recommendations should be an array');
      assert.ok(data.metadata && data.metadata.processedAt, 'metadata.processedAt should be present');

      // Verify knowledge item shape
      assert.equal(data.knowledge[0].id, 'k1');
      assert.equal(data.knowledge[0].title, 'Hardware Policy');
      assert.equal(data.knowledge[0].summary, 'You can request a laptop.');

      // Verify recommendation shape
      assert.equal(data.recommendations[0].action, 'apply');
      assert.equal(data.recommendations[0].targetId, '1');
      assert.equal(data.recommendations[0].description, 'Request a Laptop');

      // processedAt must be a valid ISO 8601 date
      const parsed = new Date(data.metadata.processedAt);
      assert.ok(!isNaN(parsed.getTime()), 'processedAt should be a valid ISO string');
    });

    it('should default knowledge and recommendations to empty arrays when omitted', () => {
      const req = mockReq({
        body: { query: 'test', intent: 'unknown' }
      });
      const res = mockRes();

      controller.formatResponse(req, res);

      assert.equal(res._status, 200);
      assert.ok(Array.isArray(res._body.data.knowledge));
      assert.equal(res._body.data.knowledge.length, 0);
      assert.ok(Array.isArray(res._body.data.recommendations));
      assert.equal(res._body.data.recommendations.length, 0);
    });
  });
});
