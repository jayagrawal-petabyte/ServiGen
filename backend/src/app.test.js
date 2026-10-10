'use strict';
process.env.NODE_ENV = 'test';
process.env.ALLOW_DEV_AUTH_OVERRIDE = 'false';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('./app');
const { generateToken } = require('./shared');
let server, base;
before(async () => {
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => { server.closeIdleConnections?.(); await new Promise(resolve => server.close(resolve)); });
const token = generateToken({ id: 'agent-001', role: 'Service Agent' });
const headers = { authorization: 'Bearer ' + token };
test('health is public but business APIs reject anonymous access', async () => {
  assert.equal((await fetch(base + '/api/health')).status, 200);
  for (const path of ['/api/my-work', '/api/approvals/pending', '/api/projects']) {
    assert.equal((await fetch(base + path)).status, 401);
  }
});

test('development header identities and the published signing key cannot bypass authentication', async () => {
  const spoofed = {'x-user-id':'attacker', 'x-user-role':'Admin'};
  assert.equal((await fetch(base+'/api/major-incidents', {headers:spoofed})).status, 401);
  const forged = require('jsonwebtoken').sign({id:'attacker',role:'Admin'}, 'servigen-super-secret-jwt-key-dev-only-change-in-prod');
  assert.equal((await fetch(base+'/api/major-incidents', {headers:{authorization:'Bearer '+forged}})).status, 401);
});

test('API headers are protected and local HTTP is not forced to HTTPS', async () => {
  const response = await fetch(base+'/api/health');
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(response.headers.get('strict-transport-security'), null);
  assert.ok(!response.headers.get('content-security-policy').includes('upgrade-insecure-requests'));
});

test('only configured browser origins receive CORS permission; preflight and non-browser clients work', async () => {
  const allowed = await fetch(base+'/api/my-work', {method:'OPTIONS', headers:{origin:'http://localhost:5173','access-control-request-method':'GET','access-control-request-headers':'authorization'}});
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  const denied = await fetch(base+'/api/my-work', {headers:{...headers, origin:'https://unlisted.example.com'}});
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  assert.equal((await fetch(base+'/api/my-work', {headers})).status, 200);
});

test('oversized JSON is rejected before business mutations with the normal error envelope', async () => {
  const response = await fetch(base+'/api/ai-core/response', {
    method:'POST', headers:{...headers,'content-type':'application/json'},
    body:JSON.stringify({query:'x'.repeat(103000)}),
  });
  assert.equal(response.status, 413);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.match(body.message, /100 KB/);
});

test('forbidden responses do not disclose role names or the permission matrix', async () => {
  const response = await fetch(base+'/api/my-work', {headers:{authorization:'Bearer '+generateToken({id:'user-test',role:'Service User'})}});
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {success:false,message:'Forbidden'});
});
test('all existing routers are reachable with verified identity', async () => {
  for (const path of ['/api/projects', '/api/cmdb/configuration-items', '/api/list-builder/lists']) {
    assert.equal((await fetch(base + path, { headers })).status, 200);
  }
  for (const [path, body] of [
    ['/api/ai-core/intent/analyze', {text: 'server failure'}],
    ['/api/ai-core/escalation/check', {resolved: false}],
  ]) {
    assert.equal((await fetch(base + path, { method: 'POST', headers: {...headers, 'content-type':'application/json'}, body: JSON.stringify(body) })).status, 200);
  }
});
test('client identity cannot replace verified agent identity', async () => {
  const response = await fetch(base + '/api/my-work?agentId=agent-002', { headers: {...headers, 'x-user-id':'agent-002'} });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(JSON.stringify(body).includes('INC-1001'));
  assert.ok(!JSON.stringify(body).includes('REQ-1007'));
});
test('invalid JWT identities are rejected', async () => {
  const invalid = generateToken({role: 'Service Agent'});
  assert.equal((await fetch(base + '/api/my-work', {headers: {authorization:'Bearer ' + invalid}})).status, 401);
});

const authFor = (role, id = 'test-user') => ({authorization:'Bearer ' + generateToken({id,role})});
test('documented role matrix is enforced for module access', async () => {
  const cases = [
    ['/api/my-work', ['Service Agent','Support Team User']],
    ['/api/projects', ['Service Agent','Support Team User']],
    ['/api/cmdb/configuration-items', ['Service Agent','Support Team User']],
    ['/api/list-builder/lists', ['Service Agent','Support Team User']],
    ['/api/change-requests', ['Service Agent','Support Team User']],
    ['/api/major-incidents', ['Service Agent','Support Team User']],
    ['/api/services', ['Service User','Service Agent']],
    ['/api/approvals/pending', ['Approver']],
    ['/api/dashboard/summary', ['Service User','Service Agent','Support Team User','Approver']],
    ['/api/dashboard/kpis', ['Service User','Service Agent','Support Team User']],
  ];
  for (const [path, roles] of cases) {
    for (const role of ['Service User','Service Agent','Support Team User','Approver','Admin']) {
      const response = await fetch(base + path, {headers:authFor(role)});
      assert.equal(response.status, role === 'Admin' || roles.includes(role) ? 200 : 403, path + ' / ' + role);
    }
  }
});
test('approvers can only list, view and act on assigned approvals; Admin can access all', async (t) => {
  const model = require('./modules/approvals/approvals.model');
  const first = await model.getApprovalById('a1');
  const second = await model.getApprovalById('a2');
  const snapshots = [ {...first}, {...second} ];
  t.after(async () => {
    await model.updateStatus('a1', snapshots[0].status);
    await model.updateStatus('a2', snapshots[1].status);
    for (const [id,snapshot] of [['a1',snapshots[0]],['a2',snapshots[1]]]) {
      const current = await model.getApprovalById(id);
      for (const key of Object.keys(current)) if (!(key in snapshot)) delete current[key];
      Object.assign(current,snapshot);
    }
  });
  first.approverId = 'approver-test';
  second.approverId = 'another-approver';
  const approver = authFor('Approver','approver-test');
  const pending = await (await fetch(base + '/api/approvals/pending', {headers:approver})).json();
  assert.deepEqual(pending.data.map(item=>item.id), ['a1']);
  assert.equal((await fetch(base + '/api/approvals/a1', {headers:approver})).status,200);
  for (const suffix of ['', '/approve','/reject']) {
    assert.equal((await fetch(base + '/api/approvals/a2'+suffix, {method:suffix?'PATCH':'GET',headers:approver})).status,404);
  }
  assert.equal((await model.getApprovalById('a2')).status, snapshots[1].status);
  delete second.approverId;
  assert.equal((await fetch(base+'/api/approvals/a2',{headers:approver})).status,404);
  assert.equal((await fetch(base+'/api/approvals/a1/approve',{method:'PATCH',headers:approver})).status,200);
  assert.equal((await fetch(base+'/api/approvals/a1/reject',{method:'PATCH',headers:approver})).status,400);
  assert.equal((await fetch(base+'/api/approvals/a2/reject',{method:'PATCH',headers:authFor('Admin')})).status,200);
  assert.equal((await fetch(base+'/api/approvals/a2',{headers:authFor('Admin')})).status,200);
});
test('unspecified major-incident mutation permission is reserved for Admin', async () => {
  assert.equal((await fetch(base+'/api/major-incidents',{method:'POST',headers:authFor('Service Agent')})).status,403);
  // Empty request fails business validation, proving Admin reached the controller.
  assert.equal((await fetch(base+'/api/major-incidents',{method:'POST',headers:{...authFor('Admin'),'content-type':'application/json'},body:'{}'})).status,400);
});

test('Admin can inspect another agent queue while ordinary users cannot impersonate', async () => {
  const response = await fetch(base+'/api/my-work?agentId=agent-002',{headers:authFor('Admin','admin-test')});
  assert.equal(response.status,200);
  const body = await response.json();
  assert.ok(JSON.stringify(body).includes('REQ-1007'));
  assert.ok(!JSON.stringify(body).includes('INC-1001'));
});

test('AI endpoints enforce role restrictions and verified caller identity', async () => {
  const approver = authFor('Approver');
  const user = authFor('Service User');
  const agent = authFor('Service Agent', 'agent-001');
  const admin = authFor('Admin', 'admin-001');

  assert.equal((await fetch(base + '/api/ai-core/intent/analyze', {
    method: 'POST', headers: { ...approver, 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'test query' }),
  })).status, 403);

  assert.equal((await fetch(base + '/api/ai-core/intent/analyze', {
    method: 'POST', headers: { ...user, 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'test query' }),
  })).status, 200);

  const agentHandoff = await (await fetch(base + '/api/ai-core/escalation/handoff', {
    method: 'POST', headers: { ...agent, 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'spoofed-id', summary: 'test', resolved: false }),
  })).json();
  assert.equal(agentHandoff.data.request.userId, 'agent-001');

  const adminHandoff = await (await fetch(base + '/api/ai-core/escalation/handoff', {
    method: 'POST', headers: { ...admin, 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'target-user', summary: 'test', resolved: false }),
  })).json();
  assert.equal(adminHandoff.data.request.userId, 'target-user');
});

test('newly mounted module routes enforce authentication, RBAC, and tenant boundary', async () => {
  const staff = authFor('Service Agent', 'agent-001');
  const user = authFor('Service User', 'user-001');
  const org1Staff = { authorization: 'Bearer ' + generateToken({ id: 'user-001', role: 'Service Agent', organisationId: 'org-001' }) };
  const admin = authFor('Admin', 'admin-001');

  // Incidents route: authentication, RBAC, and tenant boundary
  assert.equal((await fetch(base + '/api/incidents')).status, 401);
  assert.equal((await fetch(base + '/api/incidents', { headers: user })).status, 403);
  assert.equal((await fetch(base + '/api/incidents', { headers: staff })).status, 200);
  assert.equal((await fetch(base + '/api/incidents/INC-1005', { headers: org1Staff })).status, 404);

  // Organisations route: IDOR protection
  assert.equal((await fetch(base + '/api/organisations/org-001/users')).status, 401);
  assert.equal((await fetch(base + '/api/organisations/org-001/users', { headers: org1Staff })).status, 200);
  assert.equal((await fetch(base + '/api/organisations/org-002/users', { headers: org1Staff })).status, 403);
  assert.equal((await fetch(base + '/api/organisations/org-002/users', { headers: admin })).status, 200);

  // AI Retrieval route
  assert.equal((await fetch(base + '/api/ai-core/retrieval/search?query=vpn')).status, 401);
  assert.equal((await fetch(base + '/api/ai-core/retrieval/search?query=vpn', { headers: org1Staff })).status, 200);

  // Auth routes: login is public, session requires auth
  assert.equal((await fetch(base + '/api/auth/session')).status, 401);
  assert.equal((await fetch(base + '/api/auth/session', { headers: org1Staff })).status, 200);
  assert.equal((await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 1234, password: 'Password@123' }),
  })).status, 400);
  assert.equal((await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'agent001@servigen.local', password: 'Password@123' }),
  })).status, 200);
  assert.equal((await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'agent001', password: 'Password@123' }),
  })).status, 200);
  assert.equal((await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'agent001', email: 'agent001@servigen.local', password: 'Password@123' }),
  })).status, 200);
});

test('unfinished modules enforce tenant boundary, BOLA/IDOR protection, identity spoofing defense, and BI-17 keyword boundary', async () => {
  const org1Staff = { authorization: 'Bearer ' + generateToken({ id: 'agent-001', role: 'Service Agent', organisationId: 'org-001' }) };
  const org2Staff = { authorization: 'Bearer ' + generateToken({ id: 'agent-002', role: 'Service Agent', organisationId: 'org-002' }) };
  const admin = authFor('Admin', 'admin-001');

  // 1. Projects: tenant isolation and subtask BOLA/IDOR
  const org1Projects = await (await fetch(base + '/api/projects', { headers: org1Staff })).json();
  assert.ok(org1Projects.data.length > 0);
  const org2Projects = await (await fetch(base + '/api/projects', { headers: org2Staff })).json();
  assert.equal(org2Projects.data.length, 0);

  // Subtasks BOLA: Org-2 cannot read Org-1 subtasks
  assert.equal((await fetch(base + '/api/projects/P-001/subtasks', { headers: org2Staff })).status, 404);
  assert.equal((await fetch(base + '/api/projects/P-001/subtasks', { headers: org1Staff })).status, 200);
  assert.equal((await fetch(base + '/api/projects/P-001/subtasks', { headers: admin })).status, 200);

  // Single project detail lookup
  assert.equal((await fetch(base + '/api/projects/P-001', { headers: org2Staff })).status, 404);
  assert.equal((await fetch(base + '/api/projects/P-001', { headers: org1Staff })).status, 200);
  assert.equal((await fetch(base + '/api/projects/P-001', { headers: admin })).status, 200);

  // 2. CMDB: tenant isolation and IDOR on configuration items
  const org1Cis = await (await fetch(base + '/api/cmdb/configuration-items', { headers: org1Staff })).json();
  assert.ok(org1Cis.data.length > 0);
  const org2Cis = await (await fetch(base + '/api/cmdb/configuration-items', { headers: org2Staff })).json();
  assert.equal(org2Cis.data.length, 0);

  // Single CI lookup
  assert.equal((await fetch(base + '/api/cmdb/configuration-items/CI-001', { headers: org2Staff })).status, 404);
  assert.equal((await fetch(base + '/api/cmdb/configuration-items/CI-001', { headers: org1Staff })).status, 200);
  assert.equal((await fetch(base + '/api/cmdb/configuration-items/CI-001', { headers: admin })).status, 200);

  // 3. Change Requests: tenant isolation and single CR lookup
  const org1Crs = await (await fetch(base + '/api/change-requests', { headers: org1Staff })).json();
  assert.ok(org1Crs.data.length > 0);
  const org2Crs = await (await fetch(base + '/api/change-requests', { headers: org2Staff })).json();
  assert.equal(org2Crs.data.length, 0);

  assert.equal((await fetch(base + '/api/change-requests/CR-001', { headers: org2Staff })).status, 404);
  assert.equal((await fetch(base + '/api/change-requests/CR-001', { headers: org1Staff })).status, 200);
  assert.equal((await fetch(base + '/api/change-requests/CR-001', { headers: admin })).status, 200);

  // 4. List Builder: BI-16 identity spoofing prevention & tenant boundary
  // Ordinary staff cannot spoof createdBy
  const spoofAttempt = await (await fetch(base + '/api/list-builder/lists', {
    method: 'POST',
    headers: { ...org1Staff, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Spoofed List', fields: ['name', 'status'], createdBy: 'Admin' }),
  })).json();
  assert.equal(spoofAttempt.data.createdBy, 'agent-001');

  // Admin CAN specify createdBy
  const adminCreated = await (await fetch(base + '/api/list-builder/lists', {
    method: 'POST',
    headers: { ...admin, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Admin Custom List', fields: ['name'], createdBy: 'CustomAuthor' }),
  })).json();
  assert.equal(adminCreated.data.createdBy, 'CustomAuthor');

  // Input validation: empty name or fields rejected with 400
  assert.equal((await fetch(base + '/api/list-builder/lists', {
    method: 'POST',
    headers: { ...org1Staff, 'content-type': 'application/json' },
    body: JSON.stringify({ name: '', fields: ['name'] }),
  })).status, 400);

  assert.equal((await fetch(base + '/api/list-builder/lists', {
    method: 'POST',
    headers: { ...org1Staff, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Valid Name', fields: [] }),
  })).status, 400);

  // 5. AI Core Intent: BI-17 regression test & input validation
  // "build an api database" must classify as Backend (confidence 0.90), NOT Frontend ("ui" in "build")
  const intentRes = await (await fetch(base + '/api/ai-core/intent/analyze', {
    method: 'POST',
    headers: { ...org1Staff, 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'build an api database' }),
  })).json();
  assert.equal(intentRes.data.category, 'Backend');
  assert.equal(intentRes.data.confidence, 0.90);

  // Invalid text rejected with 400
  assert.equal((await fetch(base + '/api/ai-core/intent/analyze', {
    method: 'POST',
    headers: { ...org1Staff, 'content-type': 'application/json' },
    body: JSON.stringify({ text: '' }),
  })).status, 400);
});


