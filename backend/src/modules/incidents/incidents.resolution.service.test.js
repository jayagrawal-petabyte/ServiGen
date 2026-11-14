'use strict';

jest.mock('../../shared', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

const { prisma } = require('../../shared');

const {
  validateResolutionInput,
  resolveIncident,
} = require('./incidents.resolution.service');

const user = {
  id: 'agent-001',
  firstName: 'Dinesh',
  lastName: 'Beniwal',
  role: 'Service Agent',
  organisationId: 'org-001',
};

const ticket = {
  id: 'INC-1001',
  ticketType: 'Incident',
  organisationId: 'org-001',
  priority: 'P1',
  status: 'Active',
  createdAt: new Date('2026-11-01T10:00:00.000Z'),
  holdStartedAt: null,
  responseTargetAt: new Date('2026-11-01T11:00:00.000Z'),
  resolutionTargetAt: new Date('2026-11-01T14:00:00.000Z'),
  responseMetAt: null,
};

const input = {
  resolutionCode: 'Patch Applied',
  resolutionNotes: '<p>Applied the required security patch.</p>',
  rootCauseSummary: '<p>Outdated software caused the issue.</p>',
};

const createTransaction = (options = {}) => {
  const transaction = {
    ticket: {
      findFirst: jest.fn()
        .mockResolvedValueOnce(
          options.existing === undefined ? ticket : options.existing
        )
        .mockResolvedValue(options.updated || {
          ...ticket,
          ...input,
          status: 'Resolved',
          resolvedById: user.id,
        }),
      updateMany: jest.fn().mockResolvedValue({
        count: options.updateCount === undefined
          ? 1
          : options.updateCount,
      }),
    },
  };

  prisma.$transaction.mockImplementation(
    async (callback) => callback(transaction)
  );

  return transaction;
};

describe('Incident resolution governance', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('accepts all mandatory resolution fields', () => {
    expect(validateResolutionInput(input)).toEqual(input);
  });

  test('rejects a missing resolution code', () => {
    expect(() =>
      validateResolutionInput({
        resolutionNotes: 'Fixed the problem',
        rootCauseSummary: 'Network failure',
      })
    ).toThrow('Resolution code is required and must be text');
  });

  test('rejects empty resolution notes', () => {
    expect(() =>
      validateResolutionInput({
        ...input,
        resolutionNotes: '   ',
      })
    ).toThrow('Resolution notes cannot be empty');
  });

  test('rejects empty root cause summary', () => {
    expect(() =>
      validateResolutionInput({
        ...input,
        rootCauseSummary: '',
      })
    ).toThrow('Root cause summary cannot be empty');
  });

  test('rejects oversized resolution notes', () => {
    expect(() =>
      validateResolutionInput({
        ...input,
        resolutionNotes: 'A'.repeat(10001),
      })
    ).toThrow('Resolution notes must not exceed 10000 characters');
  });

  test('sanitizes unsafe HTML in resolution fields', () => {
    const result = validateResolutionInput({
      ...input,
      resolutionNotes:
        '<p onclick="alert(1)">Fixed</p><script>alert(1)</script>',
    });

    expect(result.resolutionNotes).toContain('<p>Fixed</p>');
    expect(result.resolutionNotes).not.toContain('onclick');
    expect(result.resolutionNotes).not.toContain('<script>');
  });

  test('resolves an incident and records the authenticated resolver', async () => {
    const transaction = createTransaction();

    await resolveIncident('INC-1001', input, user);

    expect(transaction.ticket.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'INC-1001',
        ticketType: 'Incident',
        organisationId: 'org-001',
      },
      select: expect.any(Object),
    });

    const updateCall =
      transaction.ticket.updateMany.mock.calls[0][0];

    expect(updateCall.data).toMatchObject({
      status: 'Resolved',
      resolutionCode: 'Patch Applied',
      resolutionNotes: input.resolutionNotes,
      rootCauseSummary: input.rootCauseSummary,
      resolvedById: 'agent-001',
      resolvedAt: expect.any(Date),
    });

    expect(updateCall.where.organisationId).toBe('org-001');
    expect(updateCall.where.status).toBe('Active');
  });

  test('rejects unauthenticated users', async () => {
    await expect(
      resolveIncident('INC-1001', input, null)
    ).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('rejects users without an organisation', async () => {
    await expect(
      resolveIncident(
        'INC-1001',
        input,
        { ...user, organisationId: null }
      )
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  test('does not resolve a ticket outside the organisation', async () => {
    const transaction = createTransaction({ existing: null });

    await expect(
      resolveIncident('INC-9999', input, user)
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(transaction.ticket.updateMany).not.toHaveBeenCalled();
  });

  test('rejects tickets that are already resolved', async () => {
    const transaction = createTransaction({
      existing: {
        ...ticket,
        status: 'Resolved',
      },
    });

    await expect(
      resolveIncident('INC-1001', input, user)
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(transaction.ticket.updateMany).not.toHaveBeenCalled();
  });

  test('rejects non-incident tickets', async () => {
    const transaction = createTransaction({
      existing: {
        ...ticket,
        ticketType: 'Service Request',
      },
    });

    // The query itself scopes to Incident, so a non-Incident
    // ticket is treated as not found.
    await expect(
      resolveIncident('INC-1001', input, user)
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(transaction.ticket.updateMany).not.toHaveBeenCalled();
  });

  test('clears the hold timestamp when resolving an On Hold incident', async () => {
    const transaction = createTransaction({
      existing: {
        ...ticket,
        status: 'On Hold',
        holdStartedAt: new Date('2026-11-01T10:30:00.000Z'),
      },
    });

    await resolveIncident('INC-1001', input, user);

    const updateCall =
      transaction.ticket.updateMany.mock.calls[0][0];

    expect(updateCall.data.holdStartedAt).toBeNull();
    expect(updateCall.data.resolutionTargetAt.getTime())
      .toBeGreaterThan(ticket.resolutionTargetAt.getTime());
  });

  test('rejects concurrent resolution after the ticket status changes', async () => {
    const transaction = createTransaction({ updateCount: 0 });

    await expect(
      resolveIncident('INC-1001', input, user)
    ).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});
