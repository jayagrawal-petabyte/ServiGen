'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-at-least-32-characters-long!';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const cmdbModel = require('./cmdb.model');
const cmdbController = require('./cmdb.controller');

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
    },
  };
  return res;
}

function mockReq({ params = {}, query = {}, body = {}, user = null } = {}) {
  return { params, query, body, user, headers: {} };
}

describe('CMDB Module — Core Model Verification', () => {
  test('getConfigurationItems returns array of configuration items', async () => {
    const items = await cmdbModel.getConfigurationItems();
    assert.ok(Array.isArray(items), 'Items should be an array');
    assert.ok(items.length >= 4, 'Should contain seeded CIs');
  });

  test('getConfigurationItemsByType groups items by category', async () => {
    const grouped = await cmdbModel.getConfigurationItemsByType();
    assert.ok(typeof grouped === 'object' && grouped !== null);
    assert.ok(Array.isArray(grouped['Database']), 'Should have Database category');
    assert.ok(Array.isArray(grouped['Server']), 'Should have Server category');
  });

  test('getConfigurationItemById finds CI by id or tag', async () => {
    const byTag = await cmdbModel.getConfigurationItemById('DB-001');
    assert.ok(byTag, 'Should find CI by tag DB-001');
    assert.equal(byTag.tag, 'DB-001');

    const byId = await cmdbModel.getConfigurationItemById(byTag.id);
    assert.ok(byId, 'Should find CI by ID');
    assert.equal(byId.id, byTag.id);
  });

  test('createConfigurationItem persists in-memory and survives across fetches', async () => {
    const uniqueName = `Test Cluster Node ${Date.now()}`;
    const newCiPayload = {
      name: uniqueName,
      type: 'Server',
      tag: `TST-${Math.floor(100 + Math.random() * 900)}`,
      site: 'London Primary DC (Lon-01)',
      status: 'Active',
      lifecycleState: 'Deployed',
      businessOwner: 'Platform Engineering',
      technicalContact: 'Test Admin',
      environment: 'Staging',
      ipAddress: '10.240.99.10',
      criticality: 'Tier 2 - Business Operational',
      specifications: {
        os: 'Ubuntu 24.04 LTS',
        cpu: '16 vCPU',
        ram: '64 GB',
      },
    };

    const created = await cmdbModel.createConfigurationItem(newCiPayload, 'org-001');
    assert.ok(created, 'Created item should be returned');
    assert.equal(created.name, uniqueName);
    assert.ok(created.id.startsWith('CI-'), 'Should have generated CI- ID');

    // Verify it persists in subsequent query
    const fetched = await cmdbModel.getConfigurationItemById(created.id, 'org-001');
    assert.ok(fetched, 'Created item should be retrievable from model store');
    assert.equal(fetched.name, uniqueName);
    assert.equal(fetched.specifications.cpu, '16 vCPU');
  });

  test('updateConfigurationItem updates CI details, specifications, and lifecycle status', async () => {
    const ci = await cmdbModel.getConfigurationItemById('DB-001');
    assert.ok(ci, 'DB-001 must exist');

    const updatePayload = {
      lifecycleState: 'Maintenance',
      status: 'Maintenance',
      specifications: {
        storage: '4 TB NVMe Enterprise',
        ram: '256 GB ECC',
      },
    };

    const updated = await cmdbModel.updateConfigurationItem(ci.id, updatePayload, 'org-001');
    assert.ok(updated, 'Updated record returned');
    assert.equal(updated.lifecycleState, 'Maintenance');
    assert.equal(updated.status, 'Maintenance');
    assert.equal(updated.specifications.storage, '4 TB NVMe Enterprise');
    assert.equal(updated.specifications.ram, '256 GB ECC');

    // Reset status back to Deployed/Active
    await cmdbModel.updateConfigurationItem(ci.id, {
      lifecycleState: 'Deployed',
      status: 'Active',
    });
  });

  test('addCiRelationship links two CIs together (e.g. DB-001 to PAY-001 with direction upstream/downstream)', async () => {
    const result = await cmdbModel.addCiRelationship(
      'DB-001',
      {
        targetId: 'PAY-001',
        type: 'runs_on',
        direction: 'upstream',
      },
      'org-001'
    );

    assert.ok(!result.error, `Unexpected error: ${result.error}`);
    assert.ok(Array.isArray(result.relationships));

    const sourceLink = result.relationships.find((r) => r.targetCiTag === 'PAY-001');
    assert.ok(sourceLink, 'Source CI should have relationship to PAY-001');
    assert.equal(sourceLink.direction, 'upstream');
    assert.equal(sourceLink.type, 'runs_on');

    // Verify inverse relationship on target CI
    const targetCi = await cmdbModel.getConfigurationItemById('PAY-001');
    const targetLink = (targetCi.relationships || []).find((r) => r.targetCiTag === 'DB-001');
    assert.ok(targetLink, 'Target CI should have reciprocal relationship to DB-001');
    assert.equal(targetLink.direction, 'downstream');
  });

  test('addCiRelationship prevents self-linking', async () => {
    const result = await cmdbModel.addCiRelationship('DB-001', { targetId: 'DB-001' });
    assert.equal(result.error, 'SELF_LINK');
  });

  test('removeCiRelationship removes dependency link', async () => {
    await cmdbModel.addCiRelationship('NET-001', {
      targetId: 'DB-001',
      type: 'connected_to',
      direction: 'downstream',
    });

    const removeResult = await cmdbModel.removeCiRelationship('NET-001', 'DB-001');
    assert.ok(!removeResult.error);

    const remainingLink = removeResult.relationships.find((r) => r.targetCiTag === 'DB-001');
    assert.equal(remainingLink, undefined, 'Relationship should be removed');
  });

  test('getCiTopology returns recursive dependency tree (nodes & edges)', async () => {
    const topology = await cmdbModel.getCiTopology('DB-001');
    assert.ok(topology, 'Topology must not be null');
    assert.ok(Array.isArray(topology.nodes), 'Topology should have nodes array');
    assert.ok(Array.isArray(topology.edges), 'Topology should have edges array');

    const rootNode = topology.nodes.find((n) => n.tag === 'DB-001');
    assert.ok(rootNode, 'Root node DB-001 should be present in topology nodes');
    assert.ok(topology.nodes.length >= 2, 'Should discover connected CIs in graph');
    assert.ok(topology.edges.length >= 1, 'Should have edges linking nodes');
  });
});

describe('CMDB Controller HTTP Endpoints Verification', () => {
  test('POST /api/cmdb/configuration-items registers CI and returns 201', async () => {
    const req = mockReq({
      body: {
        name: 'Elasticsearch Log Collector',
        type: 'Server',
        site: 'London Primary DC (Lon-01)',
        environment: 'Production',
      },
    });
    const res = mockRes();

    await cmdbController.createConfigurationItem(req, res);

    assert.equal(res._status, 201);
    assert.equal(res._body.success, true);
    assert.ok(res._body.data.id);
    assert.equal(res._body.data.name, 'Elasticsearch Log Collector');
  });

  test('POST /api/cmdb/configuration-items validates required fields (400)', async () => {
    const req = mockReq({ body: { name: '' } });
    const res = mockRes();

    await cmdbController.createConfigurationItem(req, res);

    assert.equal(res._status, 400);
    assert.equal(res._body.success, false);
  });

  test('PATCH /api/cmdb/configuration-items/:id updates CI and returns 200', async () => {
    const req = mockReq({
      params: { id: 'DB-001' },
      body: { lifecycleState: 'Deployed', status: 'Active' },
    });
    const res = mockRes();

    await cmdbController.updateConfigurationItem(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.equal(res._body.data.lifecycleState, 'Deployed');
  });

  test('PATCH /api/cmdb/configuration-items/:id returns 404 for unknown CI', async () => {
    const req = mockReq({
      params: { id: 'NON-EXISTENT-CI' },
      body: { status: 'Active' },
    });
    const res = mockRes();

    await cmdbController.updateConfigurationItem(req, res);

    assert.equal(res._status, 404);
  });

  test('POST /api/cmdb/configuration-items/:id/relationships returns 201', async () => {
    const req = mockReq({
      params: { id: 'DB-001' },
      body: {
        targetId: 'PAY-001',
        type: 'depends_on',
        direction: 'upstream',
      },
    });
    const res = mockRes();

    await cmdbController.addCiRelationship(req, res);

    assert.equal(res._status, 201);
    assert.equal(res._body.success, true);
    assert.ok(Array.isArray(res._body.data));
  });

  test('DELETE /api/cmdb/configuration-items/:id/relationships/:targetId returns 200', async () => {
    const req = mockReq({
      params: { id: 'DB-001', targetId: 'NON-EXISTENT' },
    });
    const res = mockRes();

    await cmdbController.removeCiRelationship(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
  });

  test('GET /api/cmdb/configuration-items/:id/topology returns 200 with graph', async () => {
    const req = mockReq({
      params: { id: 'DB-001' },
    });
    const res = mockRes();

    await cmdbController.getCiTopology(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.ok(Array.isArray(res._body.data.nodes));
    assert.ok(Array.isArray(res._body.data.edges));
  });
});
