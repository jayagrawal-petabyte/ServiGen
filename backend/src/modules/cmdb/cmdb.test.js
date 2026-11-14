'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const cmdbService = require('./cmdb.service');
const AppError = require('../../shared/utils/app-error');

test.describe('CMDB & Assets Service', () => {
  test('lists configuration items scoped to organisation', async () => {
    const items = await cmdbService.getAllConfigurationItems({ organisationId: 'org-001' });
    assert.ok(Array.isArray(items));
    assert.ok(items.length > 0);
    assert.ok(items.every((ci) => !ci.organisationId || ci.organisationId === 'org-001'));
  });

  test('creates new configuration item with validation', async () => {
    const uniqueTag = `SRV-TEST-${Date.now().toString().slice(-4)}`;
    const created = await cmdbService.createCi(
      {
        name: 'Authentication Gateway Server',
        type: 'Server',
        tag: uniqueTag,
        site: 'Chennai',
        lifecycleStatus: 'Deployed',
        environment: 'Production',
        ipAddress: '10.10.1.50',
        operatingSystem: 'Ubuntu 24.04',
        supportTeam: 'Security Ops',
      },
      'org-001'
    );

    assert.ok(created.id);
    assert.equal(created.name, 'Authentication Gateway Server');
    assert.equal(created.tag, uniqueTag);
    assert.equal(created.lifecycleStatus, 'Deployed');
    assert.equal(created.environment, 'Production');
  });

  test('rejects duplicate CI tag within organisation', async () => {
    await assert.rejects(
      cmdbService.createCi(
        {
          name: 'Duplicate Tag Server',
          type: 'Server',
          tag: 'PAY-001', // already exists in mock
          site: 'Chennai',
        },
        'org-001'
      ),
      /already exists/i
    );
  });

  test('updates CI lifecycle status following valid transition rules', async () => {
    // Transition Deployed -> Maintenance
    const updated = await cmdbService.updateCi('CI-001', 'org-001', {
      lifecycleStatus: 'Maintenance',
    });
    assert.equal(updated.lifecycleStatus, 'Maintenance');

    // Transition Maintenance -> Deployed
    const restored = await cmdbService.updateCi('CI-001', 'org-001', {
      lifecycleStatus: 'Deployed',
    });
    assert.equal(restored.lifecycleStatus, 'Deployed');
  });

  test('rejects invalid lifecycle status transitions', async () => {
    // Put CI-003 into Retired
    await cmdbService.updateCi('CI-003', 'org-001', {
      lifecycleStatus: 'Retired',
    });

    // Attempting to transition from Retired -> Deployed must fail
    await assert.rejects(
      cmdbService.updateCi('CI-003', 'org-001', {
        lifecycleStatus: 'Deployed',
      }),
      /Invalid lifecycle status transition/i
    );
  });

  test('rejects cross-tenant CI mutation (IDOR defense)', async () => {
    await assert.rejects(
      cmdbService.updateCi('CI-001', 'org-999-other', {
        name: 'Hacked Server Name',
      }),
      (err) => err instanceof AppError && err.statusCode === 404
    );
  });

  test('retrieves upstream and downstream CI relationships', async () => {
    const relationships = await cmdbService.getCiRelationships('CI-001', 'org-001');
    assert.ok(relationships.ci);
    assert.ok(Array.isArray(relationships.upstream));
    assert.ok(Array.isArray(relationships.downstream));

    // CI-001 depends on CI-002
    assert.ok(relationships.upstream.some((d) => d.targetCi.id === 'CI-002'));
    // CI-004 depends on CI-001 (downstream)
    assert.ok(relationships.downstream.some((d) => d.dependentCi.id === 'CI-004'));
  });

  test('creates new CI dependency relationship and rejects self-dependency', async () => {
    await assert.rejects(
      cmdbService.createCiRelationship('CI-001', 'org-001', {
        targetCiId: 'CI-001',
      }),
      /cannot depend on itself/i
    );

    const created = await cmdbService.createCiRelationship('CI-002', 'org-001', {
      targetCiId: 'CI-004',
      relationType: 'HOSTED_ON',
      impactLevel: 'Medium',
    });

    assert.ok(created.id);
    assert.equal(created.relationType, 'HOSTED_ON');
  });

  test('performs service impact analysis for a CI', async () => {
    const impact = await cmdbService.getCiImpactAnalysis('CI-001', 'org-001');
    assert.ok(impact.ci);
    assert.equal(typeof impact.downstreamServicesCount, 'number');
    assert.equal(typeof impact.impactScore, 'number');
    assert.ok(['Low', 'Medium', 'High', 'Critical'].includes(impact.riskLevel));
  });
});

