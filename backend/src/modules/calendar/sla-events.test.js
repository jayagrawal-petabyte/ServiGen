'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { getSlaEvents } = require('./sla-events.service');

test.describe('Calendar SLA Events Service', () => {
  test('lists SLA deadlines as calendar events scoped to organisation', async () => {
    const events = await getSlaEvents({ organisationId: 'org-001' });
    assert.ok(Array.isArray(events));
    assert.ok(events.length > 0);
    assert.ok(events.every((e) => !e.organisationId || e.organisationId === 'org-001'));
    assert.equal(events[0].appointmentType, 'SLA Deadline');
    assert.ok(events[0].startsAt);
    assert.ok(events[0].endsAt);
    assert.equal(typeof events[0].breached, 'boolean');
    assert.equal(typeof events[0].timeRemainingMs, 'number');
  });

  test('filters SLA events by priority and enforces tenant isolation', async () => {
    const highEvents = await getSlaEvents({ organisationId: 'org-001', priority: 'High' });
    assert.ok(Array.isArray(highEvents));
    assert.ok(highEvents.every((e) => e.priority === 'High'));

    // Cross-tenant access check
    const org2Events = await getSlaEvents({ organisationId: 'org-999-empty' });
    assert.equal(org2Events.length, 0);
  });

  test('filters SLA events by date range window', async () => {
    const futureDate = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const pastEvents = await getSlaEvents({
      organisationId: 'org-001',
      start: futureDate,
    });
    assert.equal(pastEvents.length, 0);
  });
});

