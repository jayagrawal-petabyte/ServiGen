'use strict';

const { test, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { querySanitizer, sanitizeQueryValue } = require('./query-sanitize.middleware');

describe('Query Sanitizer Middleware', () => {
  it('should flatten duplicate query parameters to the last value', () => {
    const req = {
      query: {
        status: ['Open', 'Closed'],
        priority: 'High',
      },
    };
    const res = {};
    let nextCalled = false;
    querySanitizer(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.query.status, 'Closed');
    assert.equal(req.query.priority, 'High');
  });

  it('should handle deeply nested arrays', () => {
    assert.equal(sanitizeQueryValue([[['First'], 'Second'], 'Third']), 'Third');
  });

  it('should pass through normal queries untouched', () => {
    const req = {
      query: {
        search: 'network',
        page: '1',
      },
    };
    querySanitizer(req, {}, () => {});
    assert.deepEqual(req.query, { search: 'network', page: '1' });
  });

  it('should safely handle missing or non-object query', () => {
    const req1 = {};
    querySanitizer(req1, {}, () => {});
    assert.equal(req1.query, undefined);

    const req2 = { query: null };
    querySanitizer(req2, {}, () => {});
    assert.equal(req2.query, null);
  });
});

