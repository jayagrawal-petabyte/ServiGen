'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  generateEmbedding,
  formatVectorForPostgres,
  VECTOR_DIMENSIONS,
} = require('./embedding.service');

test('formatVectorForPostgres formats valid float array into PostgreSQL vector literal', () => {
  const vec = [0.123, -0.456, 0.789];
  const formatted = formatVectorForPostgres(vec);
  assert.equal(formatted, '[0.123,-0.456,0.789]');
});

test('formatVectorForPostgres returns null for non-array inputs', () => {
  assert.equal(formatVectorForPostgres(null), null);
  assert.equal(formatVectorForPostgres('string'), null);
  assert.equal(formatVectorForPostgres({}), null);
});

test('generateEmbedding gracefully returns null for empty or non-string inputs', async () => {
  assert.equal(await generateEmbedding(null), null);
  assert.equal(await generateEmbedding(''), null);
  assert.equal(await generateEmbedding('   '), null);
  assert.equal(await generateEmbedding(12345), null);
});

test('generateEmbedding produces a 384-dimensional vector for valid input', async () => {
  const vector = await generateEmbedding('VPN connectivity troubleshooting');
  assert.ok(Array.isArray(vector), 'Vector must be an array');
  assert.equal(vector.length, VECTOR_DIMENSIONS, `Vector must have exactly ${VECTOR_DIMENSIONS} dimensions`);
  for (const val of vector) {
    assert.equal(typeof val, 'number', 'Every element must be a floating point number');
    assert.ok(!Number.isNaN(val), 'Value must not be NaN');
  }
});
