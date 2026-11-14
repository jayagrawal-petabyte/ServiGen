'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { searchKnowledge, getKnowledge } = require('./retrieval.service');

test('searchKnowledge rejects missing or invalid organisationId', async () => {
  await assert.rejects(
    () => searchKnowledge(null, 'vpn'),
    (err) => err.statusCode === 400 && err.message.includes('Organisation ID')
  );
  await assert.rejects(
    () => searchKnowledge('', 'vpn'),
    (err) => err.statusCode === 400
  );
});

test('searchKnowledge rejects missing or blank search query', async () => {
  await assert.rejects(
    () => searchKnowledge('org-001', ''),
    (err) => err.statusCode === 400 && err.message.includes('Search query')
  );
  await assert.rejects(
    () => searchKnowledge('org-001', '   '),
    (err) => err.statusCode === 400
  );
});

test('searchKnowledge rejects invalid limit argument', async () => {
  await assert.rejects(
    () => searchKnowledge('org-001', 'vpn', -1),
    (err) => err.statusCode === 400 && err.message.includes('Limit')
  );
  await assert.rejects(
    () => searchKnowledge('org-001', 'vpn', 'five'),
    (err) => err.statusCode === 400
  );
});

test('searchKnowledge returns ranked matching documents for organisation', async () => {
  const results = await searchKnowledge('org-001', 'password reset procedure', 5);
  assert.ok(Array.isArray(results), 'Results must be an array');
  assert.ok(results.length > 0, 'Should find at least 1 document');
  assert.equal(results[0].id, 'doc-001');
  assert.ok(results[0].relevanceScore > 0, 'Relevance score should be greater than 0');
});

test('getKnowledge returns requested document for matching organisation', async () => {
  const doc = await getKnowledge('org-001', 'doc-002');
  assert.ok(doc);
  assert.equal(doc.id, 'doc-002');
  assert.equal(doc.category, 'Network');
});

test('getKnowledge returns 404 for unknown document or wrong tenant', async () => {
  await assert.rejects(
    () => getKnowledge('org-001', 'doc-999'),
    (err) => err.statusCode === 404
  );
  await assert.rejects(
    () => getKnowledge('wrong-org', 'doc-001'),
    (err) => err.statusCode === 404
  );
});
