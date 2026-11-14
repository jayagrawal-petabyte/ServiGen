'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const contractsService = require('./contracts.service');

test.describe('Contracts Management Module', () => {
  test('lists contracts scoped to organisation', async () => {
    const list = await contractsService.listContracts({ organisationId: 'org-001' });
    assert.ok(Array.isArray(list));
    assert.ok(list.length > 0);
    assert.ok(list.every((c) => c.organisationId === 'org-001'));
  });

  test('retrieves contract by id and prevents cross-tenant access (IDOR)', async () => {
    const contract = await contractsService.getContractDetail('CON-1001', 'org-001');
    assert.equal(contract.id, 'CON-1001');
    assert.equal(contract.title, 'Enterprise Database Support Agreement');

    await assert.rejects(
      contractsService.getContractDetail('CON-1001', 'org-999'),
      /Contract not found/
    );
  });

  test('creates a contract with validation and sanitization', async () => {
    // Missing title
    await assert.rejects(
      contractsService.createContract({ vendorName: 'Acme Corp' }, 'org-001'),
      /Title is required/
    );

    // Missing vendorName
    await assert.rejects(
      contractsService.createContract({ title: 'Test Contract' }, 'org-001'),
      /Vendor name is required/
    );

    // Invalid vendor email
    await assert.rejects(
      contractsService.createContract(
        { title: 'Test Contract', vendorName: 'Acme Corp', vendorEmail: 'invalid-email' },
        'org-001'
      ),
      /Invalid vendor email format/
    );

    // Invalid date ordering
    await assert.rejects(
      contractsService.createContract(
        {
          title: 'Test Contract',
          vendorName: 'Acme Corp',
          startDate: '2026-12-31T00:00:00.000Z',
          endDate: '2026-01-01T00:00:00.000Z',
        },
        'org-001'
      ),
      /Start date cannot be after end date/
    );

    // Invalid negative contractValue
    await assert.rejects(
      contractsService.createContract(
        {
          title: 'Test Contract',
          vendorName: 'Acme Corp',
          contractValue: -500,
        },
        'org-001'
      ),
      /Contract value must be a non-negative number/
    );

    // Valid creation
    const created = await contractsService.createContract(
      {
        title: '<script>alert("xss")</script>Cloud Backup License Agreement',
        vendorName: 'Acme Cloud<b>Services</b>',
        vendorEmail: 'sales@acmecloud.local',
        type: 'License',
        status: 'Active',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        renewalDate: '2026-11-30T00:00:00.000Z',
        autoRenew: true,
        contractValue: 24000,
        currency: 'USD',
        notes: 'Includes 100TB storage and daily snapshots.',
        ciIds: ['CI-001'],
      },
      'org-001'
    );

    assert.ok(created.id);
    assert.ok(!created.title.includes('<script>'));
    assert.ok(created.title.includes('Cloud Backup License Agreement'));
    assert.equal(created.type, 'License');
    assert.equal(created.status, 'Active');
    assert.equal(created.contractValue, 24000);
    assert.equal(created.autoRenew, true);
    assert.deepEqual(created.linkedCiIds, ['CI-001']);
  });

  test('updates contract details cleanly', async () => {
    const updated = await contractsService.updateContract('CON-1001', 'org-001', {
      contractValue: 52000,
      notes: 'Updated DBA SLA to 10-minute response.',
    });

    assert.equal(updated.id, 'CON-1001');
    assert.equal(updated.contractValue, 52000);
    assert.equal(updated.notes, 'Updated DBA SLA to 10-minute response.');
  });

  test('filters expiring contracts within given days window', async () => {
    const expiring = await contractsService.getExpiringSoonContracts('org-001', { days: 30 });
    assert.ok(Array.isArray(expiring));

    // Rejects invalid days parameter
    await assert.rejects(
      contractsService.getExpiringSoonContracts('org-001', { days: 45 }),
      /days parameter must be one of: 30, 60, 90, 180, 365/
    );
  });

  test('links and unlinks CIs to/from contract', async () => {
    const linkResult = await contractsService.linkCi('CON-1001', 'org-001', {
      ciId: 'CI-003',
      notes: 'Secondary replica',
    });
    assert.equal(linkResult.contractId, 'CON-1001');
    assert.equal(linkResult.configurationItemId, 'CI-003');

    const linked = await contractsService.getLinkedCis('CON-1001', 'org-001');
    assert.ok(linked.linkedCiIds.includes('CI-003'));

    const unlinkResult = await contractsService.unlinkCi('CON-1001', 'org-001', 'CI-003');
    assert.equal(unlinkResult.success, true);

    const afterUnlink = await contractsService.getLinkedCis('CON-1001', 'org-001');
    assert.ok(!afterUnlink.linkedCiIds.includes('CI-003'));
  });

  test('deletes/archives contract with tenant check', async () => {
    const toDelete = await contractsService.createContract(
      {
        title: 'Temporary Contract for Deletion',
        vendorName: 'Temp Vendor',
        type: 'Warranty',
        status: 'Draft',
      },
      'org-001'
    );

    // Cross-tenant delete should fail
    await assert.rejects(
      contractsService.deleteContract(toDelete.id, 'org-999'),
      /Contract not found/
    );

    // Valid delete
    const deleted = await contractsService.deleteContract(toDelete.id, 'org-001');
    assert.equal(deleted.id, toDelete.id);

    // Re-retrieval should fail
    await assert.rejects(
      contractsService.getContractDetail(toDelete.id, 'org-001'),
      /Contract not found/
    );
  });
});
