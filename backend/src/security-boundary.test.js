'use strict';
process.env.NODE_ENV = 'test';
process.env.ALLOW_DEV_AUTH_OVERRIDE = 'false';
process.env.RATE_LIMIT_MAX = '3';
process.env.AI_RATE_LIMIT_MAX = '2';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('./app');
const { generateToken } = require('./shared');

test('mounted AI and API limits run before JSON/auth while health and preflight stay available', async t => {
  assert.equal(app.get('trust proxy'), false);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => {server.closeIdleConnections?.();server.close(resolve);}));
  const base = 'http://127.0.0.1:'+server.address().port;
  const token = generateToken({id:'agent-001',role:'Service Agent'});
  const valid = await fetch(base+'/api/ai-core/escalation/check', {
    method:'POST', headers:{authorization:'Bearer '+token,'content-type':'application/json'},
    body:JSON.stringify({resolved:false}),
  });
  assert.equal(valid.status, 200);
  const malformed = await fetch(base+'/api/ai-core/escalation/check', {
    method:'POST',headers:{'content-type':'application/json'},body:'{',
  });
  assert.equal(malformed.status, 400);
  const aiBlocked = await fetch(base+'/api/ai-core/escalation/check', {
    method:'POST',headers:{'content-type':'application/json','x-real-ip':'192.0.2.10'},body:'{',
  });
  assert.equal(aiBlocked.status, 429);
  assert.equal((await aiBlocked.json()).success, false);
  assert.equal((await fetch(base+'/api/my-work', {headers:{'x-user-id':'another-agent'}})).status, 429);
  assert.equal((await fetch(base+'/api/health')).status, 200);
  const preflight = await fetch(base+'/api/my-work', {
    method:'OPTIONS', headers:{origin:'http://localhost:5173','access-control-request-method':'GET'},
  });
  assert.equal(preflight.status, 204);
});
