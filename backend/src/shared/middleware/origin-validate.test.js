'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createOriginValidator } = require('./origin-validate.middleware');

describe('Origin Validator Middleware', () => {
  const allowed = ['http://localhost:5173', 'https://servi-gen.vercel.app'];
  const validator = createOriginValidator(allowed);

  const mockResponse = () => {
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    return res;
  };

  it('should allow state-changing request from allowed origin', () => {
    const req = {
      method: 'POST',
      headers: { origin: 'http://localhost:5173' },
    };
    const res = mockResponse();
    let nextCalled = false;
    validator(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
  });

  it('should block state-changing request with 403 from disallowed origin', () => {
    const req = {
      method: 'POST',
      headers: { origin: 'https://evil-attacker.com' },
    };
    const res = mockResponse();
    let nextCalled = false;
    validator(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not allowed/i);
  });

  it('should block PUT, PATCH, DELETE from disallowed origin', () => {
    for (const method of ['PUT', 'PATCH', 'DELETE']) {
      const req = {
        method,
        headers: { origin: 'https://evil-attacker.com' },
      };
      const res = mockResponse();
      validator(req, res, () => {});
      assert.equal(res.statusCode, 403);
    }
  });

  it('should allow GET and HEAD requests even from foreign origin (handled by standard CORS headers)', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      const req = {
        method,
        headers: { origin: 'https://unlisted.example.com' },
      };
      const res = mockResponse();
      let nextCalled = false;
      validator(req, res, () => { nextCalled = true; });
      assert.equal(nextCalled, true);
      assert.equal(res.statusCode, null);
    }
  });

  it('should allow requests without origin header (server-to-server / CLI)', () => {
    const req = {
      method: 'POST',
      headers: {},
    };
    const res = mockResponse();
    let nextCalled = false;
    validator(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
  });
});

