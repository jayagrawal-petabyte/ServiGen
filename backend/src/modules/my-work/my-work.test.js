/**
 * Unit tests for the My Work service layer.
 * Covers: SLA formatting, priority sorting, filtering, pagination,
 * escalation logic, on-hold duration, status transitions, time logging.
 *
 * SCR-004, SCR-008, SCR-016
 */

const {
  formatSla,
  formatHoldDuration,
  computeEscalation,
  formatTicket,
  getAgentTickets,
  getActiveTickets,
  getPendingTickets,
  getActionedTickets,
  getOnHoldTickets,
  getTicket,
  changeTicketStatus,
  logTicketTime,
  PRIORITY_ORDER,
} = require('./my-work.service');

// ---------------------------------------------------------------------------
// formatSla
// ---------------------------------------------------------------------------
describe('formatSla()', () => {
  test('returns "N/A" for null', () => {
    expect(formatSla(null)).toBe('N/A');
  });

  test('returns "SLA Breached" for 0 minutes', () => {
    expect(formatSla(0)).toBe('SLA Breached');
  });

  test('returns "SLA Breached" for negative minutes', () => {
    expect(formatSla(-30)).toBe('SLA Breached');
  });

  test('formats minutes only (no hours)', () => {
    expect(formatSla(45)).toBe('45m');
  });

  test('formats hours and minutes correctly', () => {
    expect(formatSla(150)).toBe('2h 30m');
  });

  test('formats exact hours with 0 remaining minutes', () => {
    expect(formatSla(180)).toBe('3h 0m');
  });
});

// ---------------------------------------------------------------------------
// formatHoldDuration
// ---------------------------------------------------------------------------
describe('formatHoldDuration()', () => {
  test('returns null when holdStartedAt is null', () => {
    expect(formatHoldDuration(null)).toBeNull();
  });

  test('returns null when holdStartedAt is undefined', () => {
    expect(formatHoldDuration(undefined)).toBeNull();
  });

  test('returns a non-null string for a past timestamp', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const result = formatHoldDuration(twoHoursAgo);
    expect(result).not.toBeNull();
    expect(result).toMatch(/h/);
  });

  test('returns minutes-only string for recent hold (< 1 hour)', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const result = formatHoldDuration(thirtyMinsAgo);
    expect(result).toMatch(/^\d+m$/);
  });

  test('returns null for a future timestamp (edge case)', () => {
    const future = new Date(Date.now() + 60000).toISOString();
    expect(formatHoldDuration(future)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// computeEscalation
// ---------------------------------------------------------------------------
describe('computeEscalation()', () => {
  test('does not escalate when SLA is well above threshold', () => {
    const result = computeEscalation({ priority: 'High', slaTimeLeft: 300, status: 'Active' });
    expect(result.needsEscalation).toBe(false);
    expect(result.escalationReason).toBeNull();
  });

  test('escalates when SLA is at threshold for High priority (120 min)', () => {
    const result = computeEscalation({ priority: 'High', slaTimeLeft: 120, status: 'Active' });
    expect(result.needsEscalation).toBe(true);
    expect(result.escalationReason).toContain('SLA threshold reached');
  });

  test('escalates for Critical priority at 60 min SLA threshold', () => {
    const result = computeEscalation({ priority: 'Critical', slaTimeLeft: 60, status: 'Active' });
    expect(result.needsEscalation).toBe(true);
  });

  test('does not escalate On Hold ticket within allowed hold duration', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const result = computeEscalation({
      priority: 'Medium',
      slaTimeLeft: 300,
      status: 'On Hold',
      holdStartedAt: oneHourAgo,
    });
    expect(result.needsEscalation).toBe(false);
  });

  test('escalates On Hold ticket when hold duration exceeds threshold', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    const result = computeEscalation({
      priority: 'Critical',
      slaTimeLeft: 300,
      status: 'On Hold',
      holdStartedAt: fiveHoursAgo,
    });
    expect(result.needsEscalation).toBe(true);
    expect(result.escalationReason).toContain('Hold duration exceeded');
  });

  test('escalation reason contains both when SLA and hold are both breached', () => {
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString();
    const result = computeEscalation({
      priority: 'Critical',
      slaTimeLeft: 30,
      status: 'On Hold',
      holdStartedAt: tenHoursAgo,
    });
    expect(result.needsEscalation).toBe(true);
    expect(result.escalationReason).toContain('SLA threshold reached');
    expect(result.escalationReason).toContain('Hold duration exceeded');
  });
});

// ---------------------------------------------------------------------------
// formatTicket
// ---------------------------------------------------------------------------
describe('formatTicket()', () => {
  test('attaches required computed fields', () => {
    const raw = { id: 'T', priority: 'High', status: 'Active', slaTimeLeft: 300, holdStartedAt: null };
    const result = formatTicket(raw);
    expect(result).toHaveProperty('slaFormatted');
    expect(result).toHaveProperty('slaBreach');
    expect(result).toHaveProperty('holdDuration');
    expect(result).toHaveProperty('needsEscalation');
    expect(result).toHaveProperty('escalationReason');
  });

  test('marks slaBreach as true when slaTimeLeft is 0', () => {
    const raw = { id: 'T', priority: 'Low', status: 'Active', slaTimeLeft: 0 };
    expect(formatTicket(raw).slaBreach).toBe(true);
  });

  test('marks slaBreach as false when slaTimeLeft is positive', () => {
    const raw = { id: 'T', priority: 'Low', status: 'Active', slaTimeLeft: 60 };
    expect(formatTicket(raw).slaBreach).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getAgentTickets
// ---------------------------------------------------------------------------
describe('getAgentTickets()', () => {
  test('returns only tickets for the specified agent', async () => {
    const { tickets } = await getAgentTickets('agent-001');
    expect(tickets.every((t) => t.assignedAgentId === 'agent-001')).toBe(true);
  });

  test('returns empty array for unknown agent', async () => {
    const { tickets } = await getAgentTickets('agent-999');
    expect(tickets).toHaveLength(0);
  });

  test('results are sorted by priority (Critical first)', async () => {
    const { tickets } = await getAgentTickets('agent-001');
    for (let i = 1; i < tickets.length; i++) {
      const prev = PRIORITY_ORDER[tickets[i - 1].priority] ?? 99;
      const curr = PRIORITY_ORDER[tickets[i].priority] ?? 99;
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  test('filters by status (case-insensitive)', async () => {
    const { tickets } = await getAgentTickets('agent-001', { status: 'active' });
    expect(tickets.every((t) => t.status === 'Active')).toBe(true);
    expect(tickets.length).toBeGreaterThan(0);
  });

  test('filters by priority (case-insensitive)', async () => {
    const { tickets } = await getAgentTickets('agent-001', { priority: 'critical' });
    expect(tickets.every((t) => t.priority === 'Critical')).toBe(true);
  });

  test('throws 400 for invalid status', async () => {
    await expect(getAgentTickets('agent-001', { status: 'Garbage' })).rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 400 for invalid priority', async () => {
    await expect(getAgentTickets('agent-001', { priority: 'SuperUrgent' })).rejects.toMatchObject({ statusCode: 400 });
  });

  test('pagination returns correct page and total', async () => {
    const { pagination } = await getAgentTickets('agent-001', { page: '1', limit: '2' });
    expect(pagination.limit).toBe(2);
    expect(pagination.page).toBe(1);
    expect(pagination.total).toBeGreaterThan(0);
  });

  test('pagination clamps limit to 100 max', async () => {
    const { pagination } = await getAgentTickets('agent-001', { limit: '9999' });
    expect(pagination.limit).toBe(100);
  });

  test('filters by organisation (partial, case-insensitive)', async () => {
    const { tickets } = await getAgentTickets('agent-001', { organisation: 'acme' });
    expect(tickets.every((t) => t.organisation.toLowerCase().includes('acme'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Dedicated queue helpers
// ---------------------------------------------------------------------------
describe('getActiveTickets()', () => {
  test('returns only Active tickets', async () => {
    const { tickets } = await getActiveTickets('agent-001');
    expect(tickets.every((t) => t.status === 'Active')).toBe(true);
  });
});

describe('getPendingTickets()', () => {
  test('returns only Pending tickets', async () => {
    const { tickets } = await getPendingTickets('agent-001');
    expect(tickets.every((t) => t.status === 'Pending')).toBe(true);
  });
});

describe('getActionedTickets()', () => {
  test('returns only Actioned tickets', async () => {
    const { tickets } = await getActionedTickets('agent-001');
    expect(tickets.every((t) => t.status === 'Actioned')).toBe(true);
  });
});

describe('getOnHoldTickets()', () => {
  test('returns only On Hold tickets', async () => {
    const { tickets } = await getOnHoldTickets('agent-001');
    expect(tickets.every((t) => t.status === 'On Hold')).toBe(true);
    expect(tickets.length).toBeGreaterThan(0);
  });

  test('On Hold tickets include holdDuration when holdStartedAt is set', async () => {
    const { tickets } = await getOnHoldTickets('agent-001');
    const withHold = tickets.filter((t) => t.holdStartedAt);
    expect(withHold.every((t) => t.holdDuration !== null)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getTicket
// ---------------------------------------------------------------------------
describe('getTicket()', () => {
  test('returns formatted ticket for a valid ID', async () => {
    const ticket = await getTicket('INC-1001');
    expect(ticket.id).toBe('INC-1001');
    expect(ticket).toHaveProperty('slaFormatted');
  });

  test('ID lookup is case-insensitive', async () => {
    const ticket = await getTicket('inc-1001');
    expect(ticket.id).toBe('INC-1001');
  });

  test('throws 404 for non-existent ticket ID', async () => {
    await expect(getTicket('INC-9999')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ---------------------------------------------------------------------------
// changeTicketStatus
// ---------------------------------------------------------------------------
describe('changeTicketStatus()', () => {
  test('transitions a valid ticket to Pending', async () => {
    const result = await changeTicketStatus('INC-1003', { status: 'Pending' });
    expect(result.status).toBe('Pending');
  });

  test('transitions a ticket to On Hold and sets holdReason', async () => {
    const result = await changeTicketStatus('INC-1001', { status: 'On Hold', holdReason: 'Awaiting customer' });
    expect(result.status).toBe('On Hold');
    expect(result.holdReason).toBe('Awaiting customer');
  });

  test('defaults holdReason to "Pending external input" when none provided', async () => {
    const result = await changeTicketStatus('REQ-1002', { status: 'On Hold' });
    expect(result.holdReason).toBe('Pending external input');
  });

  test('clears holdReason when leaving On Hold status', async () => {
    const result = await changeTicketStatus('INC-1004', { status: 'Active' });
    expect(result.holdReason).toBeNull();
  });

  test('throws 400 when status is missing', async () => {
    await expect(changeTicketStatus('INC-1001', {})).rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 400 for invalid status value', async () => {
    await expect(changeTicketStatus('INC-1001', { status: 'Deleted' })).rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 404 for non-existent ticket', async () => {
    await expect(changeTicketStatus('INC-9999', { status: 'Active' })).rejects.toMatchObject({ statusCode: 404 });
  });

  test('status transition is case-insensitive', async () => {
    const result = await changeTicketStatus('REQ-1007', { status: 'actioned' });
    expect(result.status).toBe('Actioned');
  });
});

// ---------------------------------------------------------------------------
// logTicketTime
// ---------------------------------------------------------------------------
describe('logTicketTime()', () => {
  test('accumulates time correctly', async () => {
    const before = await getTicket('INC-1006');
    const prevTime = before.timeRecord;
    const result = await logTicketTime('INC-1006', 30);
    expect(result.timeRecord).toBe(prevTime + 30);
  });

  test('throws 400 when minutesSpent is 0', async () => {
    await expect(logTicketTime('INC-1001', 0)).rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 400 when minutesSpent is negative', async () => {
    await expect(logTicketTime('INC-1001', -10)).rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 400 when minutesSpent is not a number', async () => {
    await expect(logTicketTime('INC-1001', 'abc')).rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 404 for non-existent ticket', async () => {
    await expect(logTicketTime('INC-9999', 30)).rejects.toMatchObject({ statusCode: 404 });
  });
});
