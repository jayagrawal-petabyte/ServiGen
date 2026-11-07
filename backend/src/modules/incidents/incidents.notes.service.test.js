'use strict';

jest.mock('../../shared', () => ({
  prisma: {
    ticket: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    ticketNote: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const { prisma } = require('../../shared');

const {
  NOTE_TYPES,
  getTicketNotes,
  createTicketNote,
} = require('./incidents.notes.service');

const user = {
  id: 'user-123',
  firstName: 'Dinesh',
  lastName: 'Beniwal',
  email: 'agent@example.com',
  role: 'Service Agent',
  organisationId: 'org-001',
};

const ticket = {
  id: 'INC-1001',
  organisationId: 'org-001',
  responseMetAt: null,
};

const createTransaction = (ticketRecord = ticket) => {
  const transaction = {
    ticket: {
      findFirst: jest.fn().mockResolvedValue(ticketRecord),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    ticketNote: {
      create: jest.fn().mockImplementation(({ data }) => ({
        id: 'note-001',
        ...data,
      })),
    },
  };

  prisma.$transaction.mockImplementation(
    async (callback) => callback(transaction)
  );

  return transaction;
};

describe('Incident ticket notes service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('retrieves notes chronologically within the authenticated organisation', async () => {
    const notes = [
      { id: 'note-1', content: 'First note' },
      { id: 'note-2', content: 'Second note' },
    ];

    prisma.ticket.findFirst.mockResolvedValue(ticket);
    prisma.ticketNote.findMany.mockResolvedValue(notes);

    const result = await getTicketNotes('INC-1001', user);

    expect(prisma.ticket.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'INC-1001',
        organisationId: 'org-001',
      },
      select: {
        id: true,
        organisationId: true,
      },
    });

    expect(prisma.ticketNote.findMany).toHaveBeenCalledWith({
      where: {
        ticketId: 'INC-1001',
        organisationId: 'org-001',
      },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
    });

    expect(result.notes).toEqual(notes);
    expect(result.total).toBe(2);
  });

  test('allows an Admin to retrieve notes without organisation filtering', async () => {
    const admin = {
      ...user,
      role: 'Admin',
      organisationId: null,
    };

    prisma.ticket.findFirst.mockResolvedValue(ticket);
    prisma.ticketNote.findMany.mockResolvedValue([]);

    await getTicketNotes('INC-1001', admin);

    expect(prisma.ticket.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'INC-1001' },
      })
    );
  });

  test('does not retrieve notes when the ticket is not found', async () => {
    prisma.ticket.findFirst.mockResolvedValue(null);

    await expect(
      getTicketNotes('INC-9999', user)
    ).rejects.toMatchObject({
      message: 'Ticket not found',
      statusCode: 404,
    });

    expect(prisma.ticketNote.findMany).not.toHaveBeenCalled();
  });

  test('rejects non-admin users without an organisation', async () => {
    const unscopedUser = {
      ...user,
      organisationId: null,
    };

    await expect(
      getTicketNotes('INC-1001', unscopedUser)
    ).rejects.toMatchObject({
      statusCode: 403,
    });

    expect(prisma.ticket.findFirst).not.toHaveBeenCalled();
  });

  test('rejects missing authenticated users', async () => {
    await expect(
      getTicketNotes('INC-1001', null)
    ).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  test('creates an Internal Note using authenticated author identity', async () => {
    const transaction = createTransaction();

    const result = await createTicketNote(
      'INC-1001',
      {
        noteType: NOTE_TYPES.INTERNAL,
        content: '<p>Investigating the issue.</p>',
        authorId: 'attacker-id',
        organisationId: 'attacker-org',
      },
      user
    );

    expect(transaction.ticket.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'INC-1001',
        organisationId: 'org-001',
      },
      select: {
        id: true,
        organisationId: true,
        responseMetAt: true,
      },
    });

    const createCall =
      transaction.ticketNote.create.mock.calls[0][0];

    expect(createCall.data).toMatchObject({
      ticketId: 'INC-1001',
      organisationId: 'org-001',
      authorId: 'user-123',
      authorName: 'Dinesh Beniwal',
      authorEmail: 'agent@example.com',
      noteType: 'Internal Note',
      content: '<p>Investigating the issue.</p>',
    });

    expect(createCall.data.authorId).not.toBe('attacker-id');
    expect(result.responseRecorded).toBe(false);
    expect(transaction.ticket.updateMany).not.toHaveBeenCalled();
  });

  test('records the first Customer Reply as the SLA response', async () => {
    const transaction = createTransaction({
      ...ticket,
      responseMetAt: null,
    });

    const result = await createTicketNote(
      'INC-1001',
      {
        noteType: 'Customer Reply',
        content: '<p>We have responded to the customer.</p>',
      },
      user
    );

    expect(result.responseRecorded).toBe(true);

    expect(transaction.ticket.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'INC-1001',
        responseMetAt: null,
      },
      data: {
        responseMetAt: expect.any(Date),
      },
    });
  });

  test('does not overwrite an existing first-response timestamp', async () => {
    const responseMetAt = new Date('2026-11-01T10:00:00.000Z');

    const transaction = createTransaction({
      ...ticket,
      responseMetAt,
    });

    const result = await createTicketNote(
      'INC-1001',
      {
        noteType: 'Customer Reply',
        content: 'Another customer communication.',
      },
      user
    );

    expect(result.responseRecorded).toBe(false);
    expect(transaction.ticket.updateMany).not.toHaveBeenCalled();
  });

  test('rejects unsupported note types', async () => {
    await expect(
      createTicketNote(
        'INC-1001',
        {
          noteType: 'Unknown',
          content: 'Some text',
        },
        user
      )
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('rejects content that becomes empty after sanitization', async () => {
    await expect(
      createTicketNote(
        'INC-1001',
        {
          noteType: 'Internal Note',
          content: '<script>alert(1)</script>',
        },
        user
      )
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('rejects notes exceeding the 10000-character limit', async () => {
    await expect(
      createTicketNote(
        'INC-1001',
        {
          noteType: 'Internal Note',
          content: 'A'.repeat(10001),
        },
        user
      )
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
