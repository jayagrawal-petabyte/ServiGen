'use strict';

jest.mock('../../shared', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

const { prisma } = require('../../shared');

const {
  validateTimeEntryInput,
  createTicketTimeEntry,
} = require('./incidents.time.service');

const user = {
  id: 'agent-001',
  firstName: 'Dinesh',
  lastName: 'Beniwal',
  email: 'agent@example.com',
  role: 'Service Agent',
  organisationId: 'org-001',
};

const input = {
  durationMinutes: 45,
  description: '<p>Investigated the network issue.</p>',
};

const ticket = {
  id: 'INC-1001',
  organisationId: 'org-001',
  timeRecord: 120,
};

const createTransaction = (options = {}) => {
  const transaction = {
    ticket: {
      findFirst: jest.fn().mockResolvedValue(
        options.ticket === undefined ? ticket : options.ticket
      ),
      update: jest.fn().mockResolvedValue({
        id: 'INC-1001',
        timeRecord: 165,
      }),
    },
    ticketTimeEntry: {
      create: jest.fn().mockImplementation(({ data }) => ({
        id: 'time-001',
        ...data,
      })),
    },
  };

  prisma.$transaction.mockImplementation(
    async (callback) => callback(transaction)
  );

  return transaction;
};

describe('Incident ticket time tracking', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('accepts a valid time entry', () => {
    expect(validateTimeEntryInput(input)).toEqual({
      durationMinutes: 45,
      description: '<p>Investigated the network issue.</p>',
      startedAt: null,
      endedAt: null,
    });
  });

  test('rejects zero or negative duration', () => {
    expect(() =>
      validateTimeEntryInput({
        ...input,
        durationMinutes: 0,
      })
    ).toThrow('durationMinutes must be a positive whole number');
  });

  test('rejects fractional duration', () => {
    expect(() =>
      validateTimeEntryInput({
        ...input,
        durationMinutes: 2.5,
      })
    ).toThrow('durationMinutes must be a positive whole number');
  });

  test('rejects a missing description', () => {
    expect(() =>
      validateTimeEntryInput({
        durationMinutes: 30,
      })
    ).toThrow('Time-entry description is required');
  });

  test('rejects a description exceeding 10000 characters', () => {
    expect(() =>
      validateTimeEntryInput({
        durationMinutes: 30,
        description: 'A'.repeat(10001),
      })
    ).toThrow('Description must not exceed 10000 characters');
  });

  test('removes unsafe HTML from descriptions', () => {
    const result = validateTimeEntryInput({
      durationMinutes: 30,
      description:
        '<p onclick="alert(1)">Fixed</p><script>alert(1)</script>',
    });

    expect(result.description).toContain('<p>Fixed</p>');
    expect(result.description).not.toContain('onclick');
    expect(result.description).not.toContain('<script>');
  });

  test('requires both session timestamps when either is provided', () => {
    expect(() =>
      validateTimeEntryInput({
        ...input,
        startedAt: '2026-11-07T10:00:00.000Z',
      })
    ).toThrow(
      'startedAt and endedAt must either both be provided or both be omitted'
    );
  });

  test('rejects an end timestamp earlier than the start timestamp', () => {
    expect(() =>
      validateTimeEntryInput({
        ...input,
        startedAt: '2026-11-07T11:00:00.000Z',
        endedAt: '2026-11-07T10:00:00.000Z',
      })
    ).toThrow('endedAt must be later than startedAt');
  });

  test('accepts valid session timestamps', () => {
    const result = validateTimeEntryInput({
      ...input,
      startedAt: '2026-11-07T10:00:00.000Z',
      endedAt: '2026-11-07T10:45:00.000Z',
    });

    expect(result.startedAt).toEqual(
      new Date('2026-11-07T10:00:00.000Z')
    );
    expect(result.endedAt).toEqual(
      new Date('2026-11-07T10:45:00.000Z')
    );
  });

  test('creates an entry using the authenticated agent identity', async () => {
    const transaction = createTransaction();

    const result = await createTicketTimeEntry(
      'INC-1001',
      {
        ...input,
        agentId: 'attacker-id',
        organisationId: 'attacker-org',
      },
      user
    );

    const createCall =
      transaction.ticketTimeEntry.create.mock.calls[0][0];

    expect(createCall.data).toMatchObject({
      ticketId: 'INC-1001',
      organisationId: 'org-001',
      agentId: 'agent-001',
      agentName: 'Dinesh Beniwal',
      agentEmail: 'agent@example.com',
      durationMinutes: 45,
    });

    expect(createCall.data.agentId).not.toBe('attacker-id');
    expect(result.ticket.timeRecord).toBe(165);
  });

  test('updates cumulative ticket time atomically', async () => {
    const transaction = createTransaction();

    await createTicketTimeEntry('INC-1001', input, user);

    expect(transaction.ticket.update).toHaveBeenCalledWith({
      where: { id: 'INC-1001' },
      data: {
        timeRecord: {
          increment: 45,
        },
      },
      select: {
        id: true,
        timeRecord: true,
      },
    });

    expect(transaction.ticketTimeEntry.create).toHaveBeenCalledTimes(1);
  });

  test('scopes ticket lookup to the authenticated organisation', async () => {
    const transaction = createTransaction();

    await createTicketTimeEntry('INC-1001', input, user);

    expect(transaction.ticket.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'INC-1001',
        organisationId: 'org-001',
      },
      select: {
        id: true,
        organisationId: true,
        timeRecord: true,
      },
    });
  });

  test('rejects unauthenticated users', async () => {
    await expect(
      createTicketTimeEntry('INC-1001', input, null)
    ).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('rejects non-admin users without an organisation', async () => {
    await expect(
      createTicketTimeEntry(
        'INC-1001',
        input,
        { ...user, organisationId: null }
      )
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  test('rejects tickets outside the authenticated organisation', async () => {
    const transaction = createTransaction({ ticket: null });

    await expect(
      createTicketTimeEntry('INC-9999', input, user)
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(transaction.ticketTimeEntry.create).not.toHaveBeenCalled();
    expect(transaction.ticket.update).not.toHaveBeenCalled();
  });

  test('allows Admin users to access tickets without organisation filtering', async () => {
    const admin = {
      ...user,
      role: 'Admin',
      organisationId: null,
    };

    const transaction = createTransaction({
      ticket: {
        ...ticket,
        organisationId: null,
      },
    });

    await createTicketTimeEntry('INC-1001', input, admin);

    expect(transaction.ticket.findFirst).toHaveBeenCalledWith({
      where: { id: 'INC-1001' },
      select: {
        id: true,
        organisationId: true,
        timeRecord: true,
      },
    });
  });
});
