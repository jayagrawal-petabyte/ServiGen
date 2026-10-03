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
