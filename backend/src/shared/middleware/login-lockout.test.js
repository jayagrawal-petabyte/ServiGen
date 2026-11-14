'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createLoginLockout } = require('./login-lockout.middleware');

describe('Login Lockout Middleware', () => {
  let lockout;

  beforeEach(() => {
    lockout = createLoginLockout({
      maxAttempts: 3,
      lockoutWindowMs: 5000,
      lockoutDurationMs: 10000,
    });
  });

  const createMockReqRes = (email, ip = '127.0.0.1') => {
    const req = {
      body: { email, password: 'password' },
      ip,
    };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    return { req, res };
  };

  it('allows logins under the attempt limit', () => {
    const { req, res } = createMockReqRes('user@example.com');
    let nextCalled = false;
    lockout(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
  });

  it('locks out user after max failed attempts', () => {
    const email = 'target@example.com';

    // Simulate 3 failed attempts (status 401)
    for (let i = 0; i < 3; i++) {
      const { req, res } = createMockReqRes(email);
      lockout(req, res, () => {});
      res.statusCode = 401;
      res.json({ success: false, message: 'Invalid credentials' });
    }

    // 4th attempt should be blocked with 429
    const { req: blockedReq, res: blockedRes } = createMockReqRes(email);
    let nextCalled = false;
    lockout(blockedReq, blockedRes, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(blockedRes.statusCode, 429);
    assert.equal(blockedRes.body.success, false);
    assert.match(blockedRes.body.message, /temporarily locked/i);
  });

  it('resets failed count on successful login', () => {
    const email = 'user2@example.com';

    // 2 failed attempts
    for (let i = 0; i < 2; i++) {
      const { req, res } = createMockReqRes(email);
      lockout(req, res, () => {});
      res.statusCode = 401;
      res.json({ success: false, message: 'Invalid credentials' });
    }

    // 1 successful attempt
    const { req: successReq, res: successRes } = createMockReqRes(email);
    lockout(successReq, successRes, () => {});
    successRes.statusCode = 200;
    successRes.json({ success: true, data: { id: 'user-1' } });

    // Next 2 failed attempts shouldn't lock out because counter was reset
    for (let i = 0; i < 2; i++) {
      const { req, res } = createMockReqRes(email);
      lockout(req, res, () => {});
      res.statusCode = 401;
      res.json({ success: false, message: 'Invalid credentials' });
    }

    // Should still be allowed because only 2 failures since reset
    const { req: nextReq, res: nextRes } = createMockReqRes(email);
    let nextCalled = false;
    lockout(nextReq, nextRes, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
  });
});

