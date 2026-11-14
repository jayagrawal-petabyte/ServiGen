'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
const env = require('../config/env');
const {
  ROLES,
  ALL_ROLES,
  AppError,
  sendSuccess,
  sendError,
  parsePagination,
  formatPaginated,
  generateToken,
  requireAuth,
  restrictTo,
  requireSelfOrRole,
  errorHandler,
} = require('./index');

// ─── 1. Constants ────────────────────────────────────────────────────────────

describe('Shared Constants', () => {
  it('should expose all 4 functional roles plus Admin', () => {
    assert.equal(ROLES.SERVICE_USER, 'Service User');
    assert.equal(ROLES.SERVICE_AGENT, 'Service Agent');
    assert.equal(ROLES.APPROVER, 'Approver');
    assert.equal(ROLES.SUPPORT_TEAM_USER, 'Support Team User');
    assert.equal(ROLES.ADMIN, 'Admin');
    assert.equal(ALL_ROLES.length, 5);
  });
});

// ─── 2. Utils ────────────────────────────────────────────────────────────────

describe('Shared Utils - AppError & ApiResponse', () => {
  it('should instantiate AppError with operational flag and status code', () => {
    const err = new AppError('Resource missing', 404, { id: 'T-1' });
    assert.equal(err.message, 'Resource missing');
    assert.equal(err.statusCode, 404);
    assert.equal(err.isOperational, true);
    assert.deepEqual(err.details, { id: 'T-1' });
  });

  it('should format success response envelope correctly', () => {
    let responseStatus = null;
    let responseBody = null;
    const mockRes = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    };

    sendSuccess(mockRes, { id: '123' }, 'Item retrieved', 200, { page: 1, total: 1 });
    assert.equal(responseStatus, 200);
    assert.equal(responseBody.success, true);
    assert.deepEqual(responseBody.data, { id: '123' });
    assert.equal(responseBody.message, 'Item retrieved');
    assert.deepEqual(responseBody.pagination, { page: 1, total: 1 });
  });

  it('should parse pagination safely with default and boundary clamp', () => {
    const parsed = parsePagination({ page: '2', limit: '20' });
    assert.equal(parsed.page, 2);
    assert.equal(parsed.limit, 20);
    assert.equal(parsed.skip, 20);

    const clamped = parsePagination({ page: '-5', limit: '9999' });
    assert.equal(clamped.page, 1);
    assert.equal(clamped.limit, 100);
  });

  it('should format paginated metadata accurately', () => {
    const paginated = formatPaginated(['a', 'b'], 25, 1, 10);
    assert.equal(paginated.pagination.totalPages, 3);
    assert.equal(paginated.pagination.hasNext, true);
    assert.equal(paginated.pagination.hasPrev, false);
  });
});

// ─── 3. Auth & RBAC Middleware ───────────────────────────────────────────────

describe('Shared Auth & RBAC Middleware', () => {
  it('should verify valid JWT and populate req.user', (t, done) => {
    const token = generateToken({ id: 'usr-100', role: ROLES.SERVICE_AGENT });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};

    requireAuth(req, res, (err) => {
      assert.ifError(err);
      assert.equal(req.user.id, 'usr-100');
      assert.equal(req.user.role, ROLES.SERVICE_AGENT);
      done();
    });
  });

  it('should fall back to dev override when token is missing in development', (t, done) => {
    const previousOverride = env.ALLOW_DEV_AUTH_OVERRIDE;
    env.ALLOW_DEV_AUTH_OVERRIDE = true;
    t.after(() => { env.ALLOW_DEV_AUTH_OVERRIDE = previousOverride; });
    const req = {
      headers: {
        'x-user-id': 'agent-dev-99',
        'x-user-role': ROLES.APPROVER,
      },
      query: {},
    };
    const res = {};

    requireAuth(req, res, (err) => {
      assert.ifError(err);
      assert.equal(req.user.id, 'agent-dev-99');
      assert.equal(req.user.role, ROLES.APPROVER);
      assert.equal(req.user.isDevOverride, true);
      done();
    });
  });

  it('should permit access in restrictTo when user role matches', (t, done) => {
    const req = { user: { role: ROLES.APPROVER } };
    const res = {};
    const middleware = restrictTo(ROLES.APPROVER, ROLES.ADMIN);

    middleware(req, res, (err) => {
      assert.ifError(err);
      done();
    });
  });

  it('should reject access with 403 in restrictTo when user role is not permitted', (t, done) => {
    const req = { user: { role: ROLES.SERVICE_USER } };
    const res = {};
    const middleware = restrictTo(ROLES.APPROVER);

    middleware(req, res, (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 403);
      done();
    });
  });

  it('should allow resource owner or admin in requireSelfOrRole', (t, done) => {
    const req = { user: { id: 'u-1', role: ROLES.SERVICE_USER }, params: { userId: 'u-1' } };
    const res = {};
    const middleware = requireSelfOrRole('userId', ROLES.ADMIN);

    middleware(req, res, (err) => {
      assert.ifError(err);
      done();
    });
  });
});

// ─── 4. Error Handler Middleware ─────────────────────────────────────────────

describe('Shared Error Handler', () => {
  it('should normalize AppError to structured response with matching status code', () => {
    let capturedCode = null;
    let capturedJson = null;
    const mockRes = {
      status(c) {
        capturedCode = c;
        return this;
      },
      json(j) {
        capturedJson = j;
        return this;
      },
    };

    const err = new AppError('Ticket not found', 404);
    errorHandler(err, {}, mockRes, () => {});

    assert.equal(capturedCode, 404);
    assert.equal(capturedJson.success, false);
    assert.equal(capturedJson.message, 'Ticket not found');
  });

  it('should normalize Prisma P2002 unique constraint violation to 409 Conflict', () => {
    let capturedCode = null;
    let capturedJson = null;
    const mockRes = {
      status(c) {
        capturedCode = c;
        return this;
      },
      json(j) {
        capturedJson = j;
        return this;
      },
    };

    const prismaErr = new Error('Unique constraint failed');
    prismaErr.name = 'PrismaClientKnownRequestError';
    prismaErr.code = 'P2002';
    prismaErr.meta = { target: ['email'] };

    errorHandler(prismaErr, {}, mockRes, () => {});

    assert.equal(capturedCode, 409);
    assert.equal(capturedJson.success, false);
    assert.ok(capturedJson.message.includes('already exists (email)'));
  });
});

 it('rejects missing authentication when override is disabled', (t) => {
   const previous = env.ALLOW_DEV_AUTH_OVERRIDE;
   env.ALLOW_DEV_AUTH_OVERRIDE = false;
   t.after(() => { env.ALLOW_DEV_AUTH_OVERRIDE = previous; });
   requireAuth({headers:{},query:{}}, {}, err => assert.equal(err.statusCode, 401));
 });
 it('hides unexpected Prisma failures in production', (t) => {
   const previous = {isProduction:env.isProduction, isDevelopment:env.isDevelopment};
   env.isProduction = true; env.isDevelopment = false;
   t.after(() => Object.assign(env, previous));
   const err = Object.assign(new Error('private SQL details'), {name:'PrismaClientKnownRequestError', code:'P2010', details:{sql:'private'}});
   errorHandler(err, {}, {status(code){assert.equal(code,500);return this},json(body){assert.equal(body.message,'Internal server error');assert.equal(body.details,undefined)}},()=>{});
 });
