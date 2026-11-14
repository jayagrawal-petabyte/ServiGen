'use strict';

jest.mock('../../shared', () => ({
  prisma: {
    ticket: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const { prisma } = require('../../shared');
const {
  listTickets,
  getTicketById,
  updateTicketStatus,
} = require('./tickets.controller');

const staffUser = {
  id: 'agent-001',
  role: 'Service Agent',
  organisationId: 'org-001',
};

const createIncident = (overrides = {}) => ({
  id: 'INC-1001',
  ticketType: 'Incident',
  organisationId: 'org-001',
  priority: 'High',
  status: 'Active',
  summary: 'Network issue',
  description: 'Network unavailable',
  createdAt: new Date('2026-10-10T10:00:00.000Z'),
  updatedAt: new Date('2026-10-10T10:00:00.000Z'),
  holdStartedAt: null,
  responseTargetAt: null,
  resolutionTargetAt: null,
  responseMetAt: null,
  resolutionCode: null,
  resolutionNotes: null,
  rootCauseSummary: null,
  ...overrides,
});

const createResponse = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
};

describe('Tickets Controller security and status governance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.ticket.count.mockResolvedValue(0);
    prisma.ticket.findMany.mockResolvedValue([]);
    prisma.ticket.findFirst.mockResolvedValue(null);
    prisma.ticket.update.mockResolvedValue({});
  });

  test('ticket list fails closed when a non-admin has no organisation ID', async () => {
    const req = {
      user: { id: 'agent-001', role: 'Service Agent' },
      query: {},
    };
    const res = createResponse();
    const next = jest.fn();

    await listTickets(req, res, next);

    expect(prisma.ticket.count).toHaveBeenCalledWith({
      where: { organisationId: '__unassigned_organisation__' },
    });
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organisationId: '__unassigned_organisation__' },
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  test('ticket detail is scoped to the authenticated organisation', async () => {
    const req = {
      user: staffUser,
      params: { id: 'INC-1001' },
    };
    const res = createResponse();
    const next = jest.fn();

    await getTicketById(req, res, next);

    expect(prisma.ticket.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'INC-1001',
          organisationId: 'org-001',
        },
      })
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  test('ticket detail fails closed when a non-admin has no organisation ID', async () => {
    const req = {
      user: { id: 'agent-001', role: 'Service Agent' },
      params: { id: 'INC-1001' },
    };
    const res = createResponse();
    const next = jest.fn();

    await getTicketById(req, res, next);

    expect(prisma.ticket.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'INC-1001',
          organisationId: '__unassigned_organisation__',
        },
      })
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('rejects unsupported status values', async () => {
    const req = {
      user: staffUser,
      params: { id: 'INC-1001' },
      body: { status: 'In Progress' },
    };
    const res = createResponse();
    const next = jest.fn();

    await updateTicketStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.ticket.findFirst).not.toHaveBeenCalled();
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  test('prevents direct resolution through the status endpoint', async () => {
    prisma.ticket.findFirst.mockResolvedValue(createIncident());

    const req = {
      user: staffUser,
      params: { id: 'INC-1001' },
      body: { status: 'Resolved' },
    };
    const res = createResponse();
    const next = jest.fn();

    await updateTicketStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('prevents closing an incident before it has been resolved', async () => {
    prisma.ticket.findFirst.mockResolvedValue(createIncident());

    const req = {
      user: staffUser,
      params: { id: 'INC-1001' },
      body: { status: 'Closed' },
    };
    const res = createResponse();
    const next = jest.fn();

    await updateTicketStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  test('allows a valid On Hold transition and records the pause time', async () => {
    const existing = createIncident();
    prisma.ticket.findFirst.mockResolvedValue(existing);
    prisma.ticket.update.mockImplementation(async ({ data }) => ({
      ...existing,
      ...data,
    }));

    const req = {
      user: staffUser,
      params: { id: 'INC-1001' },
      body: { status: 'on-hold', holdReason: 'Awaiting maintenance' },
    };
    const res = createResponse();
    const next = jest.fn();

    await updateTicketStatus(req, res, next);

    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'INC-1001' },
        data: expect.objectContaining({
          status: 'On Hold',
          holdReason: 'Awaiting maintenance',
          holdStartedAt: expect.any(Date),
        }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  test('allows Admin ticket detail lookup without an organisation filter', async () => {
    prisma.ticket.findFirst.mockResolvedValue(null);

    const req = {
      user: { id: 'admin-001', role: 'Admin' },
      params: { id: 'INC-1001' },
    };
    const res = createResponse();
    const next = jest.fn();

    await getTicketById(req, res, next);

    expect(prisma.ticket.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'INC-1001' },
      })
    );
  });
});