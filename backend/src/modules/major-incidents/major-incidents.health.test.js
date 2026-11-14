'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getMajorIncidentServicesHealth,
} = require('./major-incidents.service');
const { getMajorIncidents } = require('./major-incidents.model');

test.describe('Major Incidents - Services Health & CMDB Linkage', () => {
  test('evaluates services health for an existing major incident', async () => {
    const list = await getMajorIncidents({ organisationId: 'org-001' });
    assert.ok(list.length > 0, 'Should have at least one mock major incident');
    const incidentId = list[0].id;

    const health = await getMajorIncidentServicesHealth(incidentId, 'org-001');
    assert.ok(health);
    assert.equal(health.incidentId, incidentId);
    assert.ok(['Critical', 'Degraded', 'Operational'].includes(health.overallHealth));
    assert.ok(Array.isArray(health.servicesHealth));
  });

  test('rejects cross-tenant access for services health (IDOR defense)', async () => {
    const list = await getMajorIncidents({ organisationId: 'org-001' });
    const incidentId = list[0].id;

    const health = await getMajorIncidentServicesHealth(incidentId, 'org-999-other');
    assert.equal(health, null, 'Must return null for cross-tenant request');
  });

  test('returns null for unknown incident ID', async () => {
    const health = await getMajorIncidentServicesHealth('MI-UNKNOWN-999', 'org-001');
    assert.equal(health, null);
  });
});

