'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getUsers,
  getSites,
  getContacts,
} = require('./organisations.service');

test.describe('Organisations Hierarchy & Sites Service', () => {
  test('retrieves organisation sites scoped to tenant', async () => {
    const sites = await getSites('org-001');
    assert.ok(Array.isArray(sites));
    assert.ok(sites.length > 0);
    assert.ok(sites.every((s) => s.organisationId === 'org-001'));
    assert.ok(sites.some((s) => s.name.includes('London')));
  });

  test('retrieves organisation contacts with VIP designations', async () => {
    const contacts = await getContacts('org-001');
    assert.ok(Array.isArray(contacts));
    assert.ok(contacts.length > 0);

    const adminContact = contacts.find((c) => c.role === 'Admin');
    if (adminContact) {
      assert.equal(adminContact.isVip, true, 'Admin should have VIP designation');
    }

    const regularContact = contacts.find((c) => c.role === 'Service User');
    if (regularContact) {
      assert.equal(regularContact.isVip, false, 'Service User should not have VIP designation');
    }
  });

  test('rejects empty organisation ID', async () => {
    await assert.rejects(
      getSites(''),
      /Organisation ID is required/
    );

    await assert.rejects(
      getContacts(''),
      /Organisation ID is required/
    );
  });
});
