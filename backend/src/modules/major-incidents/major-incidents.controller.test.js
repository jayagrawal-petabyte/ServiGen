'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const controller = require('./major-incidents.controller');
const model = require('./major-incidents.model');

const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    events: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
      return this;
    },
    flushHeaders() {},
    write() {},
    on(event, handler) {
      this.events[event] = handler;
      return this;
    },
  };
  return res;
};

describe('Major Incidents Controller - Security & IDOR', () => {
  beforeEach(async () => {
    // Ensure mock data has org-tagged incidents
    const mockList = await model.getMajorIncidents();
    if (mockList.length > 0) {
      mockList[0].organisationId = 'org-1';
    }
  });

  it('prevents cross-tenant access in getMajorIncident (returns 404)', async () => {
    const req = {
      params: { incidentId: 'MI-001' },
      user: { role: 'Engineer', organisationId: 'org-2' }, // different org
    };
    const res = createMockRes();

    await controller.getMajorIncident(req, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not found/i);
  });

  it('allows same-tenant access in getMajorIncident', async () => {
    const req = {
      params: { incidentId: 'MI-001' },
      user: { role: 'Engineer', organisationId: 'org-1' }, // matching org
    };
    const res = createMockRes();

    await controller.getMajorIncident(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, 'MI-001');
  });

  it('allows Admin access across tenants in getMajorIncident', async () => {
    const req = {
      params: { incidentId: 'MI-001' },
      user: { role: 'Admin', organisationId: 'org-other' },
    };
    const res = createMockRes();

    await controller.getMajorIncident(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
  });

  it('prevents cross-tenant updates in addMajorIncidentUpdate (returns 404)', async () => {
    const req = {
      params: { incidentId: 'MI-001' },
      body: { message: 'Cross-tenant probe' },
      user: { role: 'Engineer', organisationId: 'org-attacker', email: 'attacker@org2.com' },
    };
    const res = createMockRes();

    await controller.addMajorIncidentUpdate(req, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
  });

  it('prevents cross-tenant SSE subscription in streamMajorIncidentUpdates (returns 404)', async () => {
    const req = {
      params: { incidentId: 'MI-001' },
      user: { role: 'Engineer', organisationId: 'org-attacker' },
      on() {},
    };
    const res = createMockRes();

    await controller.streamMajorIncidentUpdates(req, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
  });
});
