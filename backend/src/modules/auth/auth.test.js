'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../../app');
const { generateToken } = require('../../shared');
const { isTokenRevoked, revokeToken, clearRevokedTokens } = require('../../shared/utils/token-revocation');
const { refreshToken, logout } = require('./auth.service');

test.describe('Authentication Security & Session Governance', () => {
  let server;
  let baseUrl;

  test.before(async () => {
    clearRevokedTokens();
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  test.after(async () => {
    clearRevokedTokens();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('POST /api/auth/login sets HttpOnly, SameSite=Strict cookie containing session token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'agent001',
        password: 'Ag3nt*8mP4!wR9t',
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.token, 'Response should contain token for API clients');

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Response must include Set-Cookie header');
    assert.ok(setCookie.includes('token='), 'Cookie must contain token');
    assert.ok(setCookie.toLowerCase().includes('httponly'), 'Cookie must be HttpOnly (Bug 3 defense)');
    assert.ok(setCookie.toLowerCase().includes('samesite=strict'), 'Cookie must be SameSite=Strict');
  });

  test('API accepts authentication via HttpOnly cookie as alternative to Bearer header', async () => {
    const testToken = generateToken({
      id: 'agent-001',
      role: 'Service Agent',
      organisationId: 'org-001',
    });

    const res = await fetch(`${baseUrl}/api/my-work`, {
      headers: {
        Cookie: `token=${testToken}`,
      },
    });

    assert.equal(res.status, 200, 'Endpoint should succeed with cookie-based auth');
  });

  test('POST /api/auth/logout revokes the token and clears the auth cookie (R2-Bug 2)', async () => {
    const testToken = generateToken({
      id: 'agent-001',
      role: 'Service Agent',
      organisationId: 'org-001',
    });

    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testToken}`,
        Cookie: `token=${testToken}`,
      },
    });

    assert.equal(logoutRes.status, 200);
    const logoutBody = await logoutRes.json();
    assert.equal(logoutBody.success, true);
    assert.equal(isTokenRevoked(testToken), true, 'Token must be added to revocation store');

    // Attempting to access an endpoint with the revoked token must fail with 401
    const postLogoutRes = await fetch(`${baseUrl}/api/my-work`, {
      headers: {
        Authorization: `Bearer ${testToken}`,
      },
    });

    assert.equal(postLogoutRes.status, 401, 'Revoked token must be rejected');
  });

  test('Single-use token rotation: refreshing token revokes previous token (R2-Bug 3)', async () => {
    const initialToken = generateToken({
      id: 'agent-001',
      role: 'Service Agent',
      organisationId: 'org-001',
      sessionId: 'rotation-test-session',
    });

    const refreshed = await refreshToken(initialToken);
    assert.ok(refreshed.token, 'Should return fresh token');
    assert.notEqual(refreshed.token, initialToken, 'Refreshed token must be distinct');
    assert.equal(isTokenRevoked(initialToken), true, 'Previous token must be revoked');

    // Replay attack with the already-used token must be rejected
    await assert.rejects(
      refreshToken(initialToken),
      /revoked/i,
      'Reusing revoked token must fail'
    );
  });
});
