'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const model = require('./services-catalogue.model');

test('model rejects generated ticket summaries exceeding 255 characters', async () => {
  await assert.rejects(
    () => model.createRequest({
      serviceId: '1',
      serviceName: 'S'.repeat(244),
      reason: 'Laptop required',
    }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /255 characters/);
      return true;
    }
  );
});

test('model rejects ticket descriptions exceeding 10000 characters', async () => {
  await assert.rejects(
    () => model.createRequest({
      serviceId: '1',
      serviceName: 'Request a Laptop',
      reason: 'D'.repeat(10001),
    }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /10000 characters/);
      return true;
    }
  );
});