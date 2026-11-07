'use strict';

const {
  getSlaPolicy,
  createSlaDeadlines,
  calculateSlaStatus,
  prepareSlaStatusUpdate,
} = require('./incidents.sla.service');

describe('Incidents real SLA engine', () => {
  const start = new Date('2026-11-01T10:00:00.000Z');

  test.each([
    ['P1', 3600, 14400],
    ['P2', 7200, 28800],
    ['P3', 14400, 86400],
    ['P4', 28800, 172800],
    ['Critical', 3600, 14400],
    ['High', 7200, 28800],
    ['Medium', 14400, 86400],
    ['Low', 28800, 172800],
  ])(
    'returns correct policy for %s',
    (priority, responseSeconds, resolutionSeconds) => {
      const policy = getSlaPolicy(priority);

      expect(policy.responseSeconds).toBe(responseSeconds);
      expect(policy.resolutionSeconds).toBe(resolutionSeconds);
    }
  );

  test('creates response and resolution deadlines', () => {
    const result = createSlaDeadlines('P1', start);

    expect(result.responseTargetAt.toISOString())
      .toBe('2026-11-01T11:00:00.000Z');

    expect(result.resolutionTargetAt.toISOString())
      .toBe('2026-11-01T14:00:00.000Z');
  });

  test('calculates remaining resolution seconds', () => {
    const ticket = {
      priority: 'P1',
      status: 'Active',
      createdAt: start,
    };

    const result = calculateSlaStatus(
      ticket,
      new Date('2026-11-01T11:00:00.000Z')
    );

    expect(result.slaTimeRemainingSeconds).toBe(10800);
    expect(result.isBreached).toBe(false);
    expect(result.responseTimeRemainingSeconds).toBe(0);
    expect(result.responseBreached).toBe(true);
  });

  test('freezes the SLA clock while ticket is On Hold', () => {
    const ticket = {
      priority: 'P1',
      status: 'On Hold',
      createdAt: start,
      holdStartedAt: new Date('2026-11-01T10:30:00.000Z'),
    };

    const result = calculateSlaStatus(
      ticket,
      new Date('2026-11-01T12:30:00.000Z')
    );

    expect(result.slaTimeRemainingSeconds).toBe(12600);
    expect(result.slaPaused).toBe(true);
  });

  test('records SLA pause when entering On Hold', () => {
    const ticket = {
      priority: 'P1',
      status: 'Active',
      createdAt: start,
    };

    const now = new Date('2026-11-01T10:30:00.000Z');

    const result = prepareSlaStatusUpdate(ticket, 'On Hold', now);

    expect(result.holdStartedAt).toEqual(now);
    expect(result.responseTargetAt.toISOString())
      .toBe('2026-11-01T11:00:00.000Z');
  });

  test('extends both deadlines when leaving On Hold', () => {
    const ticket = {
      priority: 'P1',
      status: 'On Hold',
      createdAt: start,
      holdStartedAt: new Date('2026-11-01T10:30:00.000Z'),
    };

    const result = prepareSlaStatusUpdate(
      ticket,
      'Active',
      new Date('2026-11-01T11:30:00.000Z')
    );

    expect(result.responseTargetAt.toISOString())
      .toBe('2026-11-01T12:00:00.000Z');

    expect(result.resolutionTargetAt.toISOString())
      .toBe('2026-11-01T15:00:00.000Z');

    expect(result.holdStartedAt).toBeNull();
  });

  test('marks resolution SLA as breached after its deadline', () => {
    const ticket = {
      priority: 'P1',
      status: 'Active',
      createdAt: start,
    };

    const result = calculateSlaStatus(
      ticket,
      new Date('2026-11-01T14:01:00.000Z')
    );

    expect(result.isBreached).toBe(true);
    expect(result.slaTimeRemainingSeconds).toBe(0);
  });

  test('does not invent SLA targets for unsupported priorities', () => {
    const result = calculateSlaStatus({
      priority: 'Unknown',
      status: 'Active',
      createdAt: start,
    });

    expect(result.slaTargetAt).toBeNull();
    expect(result.slaTimeRemainingSeconds).toBeNull();
    expect(result.isBreached).toBe(false);
  });
});
