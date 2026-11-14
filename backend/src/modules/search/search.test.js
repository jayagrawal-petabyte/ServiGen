'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { globalSearch } = require('./search.service');

test.describe('Global Unified Search Service', () => {
  test('searches across multiple modules with query string scoped to organisation', async () => {
    const results = await globalSearch({
      query: 'vpn',
      organisationId: 'org-001',
    });

    assert.equal(results.query, 'vpn');
    assert.equal(typeof results.totalMatches, 'number');
    assert.ok(results.totalMatches > 0);
    assert.ok(results.results.tickets);
    assert.ok(results.results.problems);
    assert.ok(results.results.contracts);
    assert.ok(results.results.configurationItems);
    assert.ok(results.results.articles);
  });

  test('enforces tenant boundary on search results', async () => {
    const results = await globalSearch({
      query: 'vpn',
      organisationId: 'org-999-empty',
    });

    assert.equal(results.results.problems.length, 0);
    assert.equal(results.results.contracts.length, 0);
  });

  test('validates search query and rejects invalid or oversized queries', async () => {
    // Missing query
    await assert.rejects(
      globalSearch({ query: '' }),
      /Search query parameter "q" is required/
    );

    // Oversized query
    await assert.rejects(
      globalSearch({ query: 'a'.repeat(105) }),
      /Search query cannot exceed 100 characters/
    );
  });

  test('sanitizes unsafe HTML script tags in search query', async () => {
    const results = await globalSearch({
      query: '<script>alert("xss")</script>Database',
      organisationId: 'org-001',
    });

    assert.ok(!results.query.includes('<script>'));
    assert.ok(results.query.includes('Database'));
  });
});

