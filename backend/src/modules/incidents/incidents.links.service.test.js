'use strict';

jest.mock('../../shared', () => ({
  prisma: {
    $transaction: jest.fn(),
    ticket: {
      findFirst: jest.fn(),
    },
    ticketLink: {
      findMany: jest.fn(),
    },
  },
}));

const { prisma } = require('../../shared');

const {
  RELATION_TYPES,
  createTicketLink,
  getTicketLinks,
} = require('./incidents.links.service');

const user = {
  id: 'user-123',
  firstName: 'Dinesh',
  lastName: 'Beniwal',
  email: 'agent@example.com',
  role: 'Service Agent',
  organisationId: 'org-001',
};

const sourceTicket = {
  id: 'INC-1001',
  organisationId: 'org-001',
};

const targetTicket = {
  id: 'INC-1002',
  organisationId: 'org-001',
};

const createTransaction = (options = {}) => {
  const transaction = {
    ticket: {
      findFirst: jest.fn()
        .mockResolvedValueOnce(
          options.sourceTicket === undefined
            ? sourceTicket
            : options.sourceTicket
        )
        .mockResolvedValue(
          options.targetTicket === undefined
            ? targetTicket
            : options.targetTicket
        ),
    },
    ticketLink: {
      findMany: jest.fn().mockResolvedValue(
        options.existingLinks || []
      ),
      findFirst: jest.fn().mockResolvedValue(
        options.duplicate || null
      ),
      create: jest.fn().mockImplementation(({ data }) => ({
        id: 'link-001',
        ...data,
      })),
    },
    configurationItem: {
      findFirst: jest.fn().mockResolvedValue(
        options.configurationItem === undefined
          ? { id: 'CI-001' }
          : options.configurationItem
      ),
    },
  };

  prisma.$transaction.mockImplementation(
    async (callback) => callback(transaction)
  );

  return transaction;
};

describe('Incident ticket linking service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('creates a RELATED ticket link within the same organisation', async () => {
    const transaction = createTransaction();

    const result = await createTicketLink(
      'INC-1001',
      {
        relationType: 'RELATED',
        targetTicketId: 'INC-1002',
      },
      user
    );

    expect(result).toMatchObject({
      id: 'link-001',
      ticketId: 'INC-1001',
      relatedTicketId: 'INC-1002',
      organisationId: 'org-001',
      createdById: 'user-123',
      relationType: 'RELATED',
    });

    expect(transaction.ticket.findFirst).toHaveBeenCalledTimes(2);
    expect(transaction.ticketLink.create).toHaveBeenCalledTimes(1);
  });

  test('rejects a missing authenticated user', async () => {
    await expect(
      createTicketLink(
        'INC-1001',
        {
          relationType: 'RELATED',
          targetTicketId: 'INC-1002',
        },
        null
      )
    ).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('rejects a non-admin user without an organisation', async () => {
    await expect(
      createTicketLink(
        'INC-1001',
        {
          relationType: 'RELATED',
          targetTicketId: 'INC-1002',
        },
        { ...user, organisationId: null }
      )
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  test('rejects unsupported relationship types', async () => {
    await expect(
      createTicketLink(
        'INC-1001',
        {
          relationType: 'UNKNOWN',
          targetTicketId: 'INC-1002',
        },
        user
      )
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('rejects missing target identifiers', async () => {
    await expect(
      createTicketLink(
        'INC-1001',
        {
          relationType: 'RELATED',
        },
        user
      )
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test('rejects multiple target identifiers', async () => {
    await expect(
      createTicketLink(
        'INC-1001',
        {
          relationType: 'RELATED',
          targetTicketId: 'INC-1002',
          problemId: 'PRB-001',
        },
        user
      )
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test('rejects a ticket linked to itself', async () => {
    const transaction = createTransaction();

    await expect(
      createTicketLink(
        'INC-1001',
        {
          relationType: 'RELATED',
          targetTicketId: 'INC-1001',
        },
        user
      )
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(transaction.ticketLink.create).not.toHaveBeenCalled();
  });

  test('rejects cross-organisation ticket links', async () => {
    const transaction = createTransaction({
      targetTicket: null,
    });

    await expect(
      createTicketLink(
        'INC-1001',
        {
          relationType: 'RELATED',
          targetTicketId: 'INC-9999',
        },
        user
      )
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(transaction.ticketLink.create).not.toHaveBeenCalled();
  });

  test('rejects tickets that do not belong to the user organisation', async () => {
    const transaction = createTransaction({
      sourceTicket: null,
    });

    await expect(
      createTicketLink(
        'INC-9999',
        {
          relationType: 'RELATED',
          targetTicketId: 'INC-1002',
        },
        user
      )
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(transaction.ticketLink.create).not.toHaveBeenCalled();
  });

  test('rejects duplicate relationships', async () => {
    const transaction = createTransaction({
      duplicate: { id: 'existing-link' },
    });

    await expect(
      createTicketLink(
        'INC-1001',
        {
          relationType: 'RELATED',
          targetTicketId: 'INC-1002',
        },
        user
      )
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(transaction.ticketLink.create).not.toHaveBeenCalled();
  });

  test('creates a parent-child relationship', async () => {
    const transaction = createTransaction();

    const result = await createTicketLink(
      'INC-1001',
      {
        relationType: 'PARENT',
        targetTicketId: 'INC-1002',
      },
      user
    );

    expect(result.relationType).toBe('PARENT');
    expect(transaction.ticketLink.create).toHaveBeenCalledTimes(1);
  });

  test('rejects a parent-child cycle', async () => {
    const transaction = createTransaction({
      existingLinks: [
        {
          ticketId: 'INC-1001',
          relatedTicketId: 'INC-1003',
          relationType: 'CHILD',
        },
        {
          ticketId: 'INC-1003',
          relatedTicketId: 'INC-1002',
          relationType: 'CHILD',
        },
      ],
    });

    await expect(
      createTicketLink(
        'INC-1001',
        {
          relationType: 'PARENT',
          targetTicketId: 'INC-1002',
        },
        user
      )
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(transaction.ticketLink.create).not.toHaveBeenCalled();
  });

  test('creates an AFFECTED_CI link within the same organisation', async () => {
    const transaction = createTransaction();

    const result = await createTicketLink(
      'INC-1001',
      {
        relationType: 'AFFECTED_CI',
        configurationItemId: 'CI-001',
      },
      user
    );

    expect(result).toMatchObject({
      ticketId: 'INC-1001',
      configurationItemId: 'CI-001',
      relationType: 'AFFECTED_CI',
    });

    expect(transaction.configurationItem.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'CI-001',
        organisationId: 'org-001',
      },
      select: {
        id: true,
      },
    });
  });

  test('rejects a Configuration Item from another organisation', async () => {
    const transaction = createTransaction({
      configurationItem: null,
    });

    await expect(
      createTicketLink(
        'INC-1001',
        {
          relationType: 'AFFECTED_CI',
          configurationItemId: 'CI-999',
        },
        user
      )
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(transaction.ticketLink.create).not.toHaveBeenCalled();
  });

  test('creates a Problem reference without inventing a Problem table', async () => {
    const transaction = createTransaction();

    const result = await createTicketLink(
      'INC-1001',
      {
        relationType: 'PROBLEM',
        problemId: 'PRB-001',
      },
      user
    );

    expect(result).toMatchObject({
      ticketId: 'INC-1001',
      problemId: 'PRB-001',
      relationType: 'PROBLEM',
    });

    expect(transaction.ticketLink.create).toHaveBeenCalledTimes(1);
  });

  test('retrieves outgoing and incoming relationships', async () => {
    prisma.ticket.findFirst.mockResolvedValue(sourceTicket);

    prisma.ticketLink.findMany.mockResolvedValue([
      {
        id: 'link-1',
        ticketId: 'INC-1001',
        relatedTicketId: 'INC-1002',
        relationType: 'RELATED',
      },
      {
        id: 'link-2',
        ticketId: 'INC-1003',
        relatedTicketId: 'INC-1001',
        relationType: 'CHILD',
      },
    ]);

    const result = await getTicketLinks('INC-1001', user);

    expect(result.outgoing).toHaveLength(1);
    expect(result.incoming).toHaveLength(1);
    expect(result.total).toBe(2);

    expect(prisma.ticketLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organisationId: 'org-001',
          OR: [
            { ticketId: 'INC-1001' },
            { relatedTicketId: 'INC-1001' },
          ],
        },
      })
    );
  });

  test('does not retrieve links for a ticket outside the organisation', async () => {
    prisma.ticket.findFirst.mockResolvedValue(null);

    await expect(
      getTicketLinks('INC-9999', user)
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(prisma.ticketLink.findMany).not.toHaveBeenCalled();
  });
});
