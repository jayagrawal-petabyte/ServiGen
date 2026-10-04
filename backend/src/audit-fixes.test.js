'use strict';

process.env.NODE_ENV = 'test';
process.env.ALLOW_DEV_AUTH_OVERRIDE = 'false';

const { test, before, after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const jwt = require('jsonwebtoken');

const app = require('./app');
const env = require('./config/env');
const { generateToken, optionalAuth } = require('./shared');
const { requireSelfOrRole } = require('./shared/middleware/rbac.middleware');

describe('Security Fixes Audit Verification Suite', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = await new Promise(resolve => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    baseUrl = 'http://127.0.0.1:' + server.address().port;
  });

  after(async () => {
    server.closeIdleConnections?.();
    await new Promise(resolve => server.close(resolve));
  });

  // ─── SG-01: Header-based Auth Bypass Verification ─────────────────────────
  describe('SG-01: Header-based Authentication Bypass', () => {
    it('rejects unauthenticated requests even with spoofed X-User-Role: Admin', async () => {
      const res = await fetch(`${baseUrl}/api/major-incidents`, {
        method: 'GET',
        headers: {
          'x-user-id': 'attacker',
          'x-user-role': 'Admin',
        },
      });
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Authentication required/i);
    });

    it('overwrites spoofed headers with verified JWT token identity', async () => {
      // Attacker has valid Service User token, but sends headers claiming to be Admin agent-001
      const token = generateToken({
        id: 'real-service-user',
        role: 'Service User',
        organisationId: 'real-org-123',
        email: 'user@real.com',
      });

      const res = await fetch(`${baseUrl}/api/major-incidents`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'x-user-id': 'agent-001',
          'x-user-role': 'Admin',
          'x-org-id': 'spoofed-org-999',
          'x-user-email': 'admin@spoofed.com',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ title: 'Rogue Incident' }),
      });

      // Must be rejected with 403 because real role is Service User, not Admin
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.deepEqual(body, { success: false, message: 'Forbidden' });
    });

    it('rejects JWT signed with algorithm none', async () => {
      // Create unsigned token (algorithm: none)
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ id: 'attacker', role: 'Admin' })).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      const res = await fetch(`${baseUrl}/api/major-incidents`, {
        headers: { authorization: `Bearer ${noneToken}` },
      });
      assert.equal(res.status, 401);
    });

    it('rejects JWT containing unrecognized role', async () => {
      const token = jwt.sign({ id: 'attacker', role: 'SuperUser' }, env.JWT.SECRET, { algorithm: 'HS256' });
      const res = await fetch(`${baseUrl}/api/my-work`, {
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.match(body.message, /Invalid authentication identity/i);
    });

    it('hardens optionalAuth against unsigned tokens and invalid roles', (t, done) => {
      const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const nonePayload = Buffer.from(JSON.stringify({ id: 'attacker', role: 'Admin' })).toString('base64url');
      const req1 = { headers: { authorization: `Bearer ${noneHeader}.${nonePayload}.` } };
      optionalAuth(req1, {}, () => {
        assert.equal(req1.user, undefined, 'algorithm none token must not attach user');

        const req2 = { headers: { authorization: `Bearer ${generateToken({ id: 'good', role: 'Approver' })}` } };
        optionalAuth(req2, {}, () => {
          assert.equal(req2.user?.id, 'good');
          assert.equal(req2.user?.role, 'Approver');
          done();
        });
      });
    });
  });

  // ─── SG-02: Publicly Known Default JWT Secret Verification ────────────────
  describe('SG-02: Publicly Known Default JWT Secret', () => {
    it('rejects JWT signed with the published sample key', async () => {
      const forged = jwt.sign(
        { id: 'attacker', role: 'Admin' },
        'servigen-super-secret-jwt-key-dev-only-change-in-prod',
        { algorithm: 'HS256' }
      );
      const res = await fetch(`${baseUrl}/api/major-incidents`, {
        headers: { authorization: `Bearer ${forged}` },
      });
      assert.equal(res.status, 401);
    });

    it('fails fast on startup in development when sample key or short key is configured', () => {
      const envScript = path.join(__dirname, 'config/env.js');
      const testCases = [
        { JWT_SECRET: '', desc: 'empty secret' },
        { JWT_SECRET: 'short-123', desc: 'secret < 32 bytes' },
        { JWT_SECRET: 'servigen-super-secret-jwt-key-dev-only-change-in-prod', desc: 'published example key' },
      ];

      for (const tc of testCases) {
        const result = spawnSync(process.execPath, ['-e', `require('dotenv').config=()=>{}; require(${JSON.stringify(envScript)})`], {
          env: {
            ...process.env,
            NODE_ENV: 'development',
            PORT: '3000',
            JWT_SECRET: tc.JWT_SECRET,
          },
          encoding: 'utf8',
        });
        assert.notEqual(result.status, 0, `Startup should fail for ${tc.desc}`);
        assert.match(result.stderr, /JWT_SECRET must be a unique secret of at least 32 bytes/);
      }
    });

    it('fails fast on startup in production when sample key is configured', () => {
      const envScript = path.join(__dirname, 'config/env.js');
      const result = spawnSync(process.execPath, ['-e', `require('dotenv').config=()=>{}; require(${JSON.stringify(envScript)})`], {
        env: {
          ...process.env,
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://prod:prod@localhost:5432/servigen',
          CORS_ORIGIN: 'https://servigen.app',
          PORT: '3000',
          JWT_SECRET: 'servigen-super-secret-jwt-key-dev-only-change-in-prod',
        },
        encoding: 'utf8',
      });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /the published example key is not permitted/);
    });
  });

  // ─── SG-07: Security Headers, Rate Limiting & Body Limits ──────────────────
  describe('SG-07: Security Headers, Rate Limiting & Body Limits', () => {
    it('omits X-Powered-By and sets essential security headers', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.headers.get('x-powered-by'), null);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    });

    it('rejects oversized JSON (> 100 KB) with HTTP 413 before business processing', async () => {
      const token = generateToken({ id: 'agent-001', role: 'Service Agent' });
      const largePayload = { query: 'A'.repeat(102401) }; // > 100KB

      const res = await fetch(`${baseUrl}/api/ai-core/response`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(largePayload),
      });

      assert.equal(res.status, 413);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /100 KB limit/i);
    });

    it('allows valid payload under 100 KB limit', async () => {
      const token = generateToken({ id: 'agent-001', role: 'Service Agent' });
      const validPayload = { query: 'printer offline', intent: 'troubleshooting' };

      const res = await fetch(`${baseUrl}/api/ai-core/response/format`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(validPayload),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
    });
  });

  // ─── SG-12: Seed Protection & Lockfile Verification ───────────────────────
  describe('SG-12: Seed Protection & Lockfile', () => {
    it('refuses to seed in production before opening any database connection', () => {
      const seedScript = path.resolve(__dirname, '../prisma/seed.js');
      const testCode = `
        const Module = require('node:module');
        const orig = Module._load;
        Module._load = function(id, ...args) {
          if (id === '../src/config/db') {
            throw new Error('UNEXPECTED_DB_TOUCH');
          }
          return orig.call(this, id, ...args);
        };
        require(${JSON.stringify(seedScript)});
      `;

      const result = spawnSync(process.execPath, ['-e', testCode], {
        env: {
          ...process.env,
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://prod:prod@localhost:5432/servigen',
          CORS_ORIGIN: 'https://servigen.app',
          JWT_SECRET: 'a'.repeat(64),
        },
        encoding: 'utf8',
      });

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Sample seed accounts are development-only/);
      assert.ok(!result.stderr.includes('UNEXPECTED_DB_TOUCH'), 'Must fail before contacting database');
    });

    it('ensures package-lock.json is not ignored by git', () => {
      const checkIgnore = spawnSync('git', ['check-ignore', 'package-lock.json'], {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8',
      });
      // git check-ignore returns 1 when the file is NOT ignored
      assert.equal(checkIgnore.status, 1, 'package-lock.json must NOT be ignored by git');
    });
  });

  // ─── SG-13: Verbose 403 Response & Information Disclosure ─────────────────
  describe('SG-13: RBAC Information Disclosure', () => {
    it('sanitizes 403 responses across all staff and admin routes without leaking role names', async () => {
      const token = generateToken({ id: 'user-001', role: 'Service User' });
      const testRoutes = [
        { path: '/api/my-work', method: 'GET' },
        { path: '/api/approvals/pending', method: 'GET' },
        { path: '/api/major-incidents', method: 'GET' },
        { path: '/api/change-requests', method: 'GET' },
        { path: '/api/projects', method: 'GET' },
        { path: '/api/cmdb/configuration-items', method: 'GET' },
      ];

      for (const route of testRoutes) {
        const res = await fetch(`${baseUrl}${route.path}`, {
          method: route.method,
          headers: { authorization: `Bearer ${token}` },
        });

        assert.equal(res.status, 403, `Route ${route.path} should return 403`);
        const body = await res.json();
        assert.deepEqual(body, { success: false, message: 'Forbidden' }, `Route ${route.path} leaked details`);
      }
    });

    it('sanitizes requireSelfOrRole 403 message to generic Forbidden', (t, done) => {
      const req = { user: { id: 'user-a', role: 'Service User' }, params: { userId: 'user-b' } };
      const middleware = requireSelfOrRole('userId', 'Admin');
      middleware(req, {}, (err) => {
        assert.ok(err);
        assert.equal(err.statusCode, 403);
        assert.equal(err.message, 'Forbidden');
        done();
      });
    });
  });

  // ─── SG-15: CORS Fail-Closed Verification ─────────────────────────────────
  describe('SG-15: CORS Configuration', () => {
    it('fails fast on startup in production when CORS_ORIGIN is unset or wildcard', () => {
      const envScript = path.join(__dirname, 'config/env.js');
      for (const badOrigin of ['', '*', 'https://app.com/path', 'https://user:pass@app.com']) {
        const result = spawnSync(process.execPath, ['-e', `require('dotenv').config=()=>{}; require(${JSON.stringify(envScript)})`], {
          env: {
            ...process.env,
            NODE_ENV: 'production',
            DATABASE_URL: 'postgresql://prod:prod@localhost:5432/servigen',
            PORT: '3000',
            JWT_SECRET: 'b'.repeat(64),
            CORS_ORIGIN: badOrigin,
          },
          encoding: 'utf8',
        });
        assert.notEqual(result.status, 0, `Production must reject CORS_ORIGIN="${badOrigin}"`);
      }
    });

    it('blocks unconfigured origins without returning Access-Control-Allow-Origin', async () => {
      const token = generateToken({ id: 'agent-001', role: 'Service Agent' });
      const res = await fetch(`${baseUrl}/api/my-work`, {
        headers: {
          authorization: `Bearer ${token}`,
          origin: 'https://attacker-domain.evil',
        },
      });

      assert.equal(res.headers.get('access-control-allow-origin'), null);
    });

    it('permits configured localhost origin with credentials', async () => {
      const token = generateToken({ id: 'agent-001', role: 'Service Agent' });
      const res = await fetch(`${baseUrl}/api/my-work`, {
        headers: {
          authorization: `Bearer ${token}`,
          origin: 'http://localhost:5173',
        },
      });

      assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
      assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
    });
  });

  // ─── SG-11 & Token Expiration Verification ────────────────────────────────
  describe('SG-11: Token Expiration & Validity', () => {
    it('returns specific 401 message when token is expired', async () => {
      // Mint expired token
      const expiredToken = jwt.sign(
        { id: 'agent-001', role: 'Service Agent' },
        env.JWT.SECRET,
        { algorithm: 'HS256', expiresIn: '-1s' }
      );

      const res = await fetch(`${baseUrl}/api/my-work`, {
        headers: { authorization: `Bearer ${expiredToken}` },
      });

      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.message, 'Authentication token has expired');
    });
  });

  // ─── SG-08: AI Core Role Gating & Identity Binding ────────────────────────
  describe('SG-08: AI Core Role Gating & Identity Binding', () => {
    it('blocks unauthorized roles (like Approver) from accessing AI endpoints', async () => {
      const approverToken = generateToken({ id: 'approver-001', role: 'Approver' });
      const res = await fetch(`${baseUrl}/api/ai-core/intent/analyze`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${approverToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ text: 'need server access' }),
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.deepEqual(body, { success: false, message: 'Forbidden' });
    });

    it('permits authorized roles (Service User, Service Agent) to access AI endpoints', async () => {
      for (const role of ['Service User', 'Service Agent', 'Support Team User', 'Admin']) {
        const token = generateToken({ id: 'user-001', role });
        const res = await fetch(`${baseUrl}/api/ai-core/intent/analyze`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ text: 'need server access' }),
        });
        assert.equal(res.status, 200, `Role ${role} should be allowed on AI endpoints`);
      }
    });

    it('forces escalation handoff userId to verified caller identity for non-Admins', async () => {
      const agentToken = generateToken({ id: 'real-agent-123', role: 'Service Agent' });
      const res = await fetch(`${baseUrl}/api/ai-core/escalation/handoff`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${agentToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'spoofed-victim-user',
          summary: 'Cannot connect to database',
          resolved: false,
        }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.request.userId, 'real-agent-123', 'Must bind to caller req.user.id');
    });

    it('allows Admin to escalate on behalf of a specified target user', async () => {
      const adminToken = generateToken({ id: 'admin-001', role: 'Admin' });
      const res = await fetch(`${baseUrl}/api/ai-core/escalation/handoff`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${adminToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'delegated-user-456',
          summary: 'Admin assisted escalation',
          resolved: false,
        }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.request.userId, 'delegated-user-456', 'Admin can specify target userId');
    });
  });
});
