
jest.mock('../../config/db', () => ({
  ticket: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  team: {
    findUnique: jest.fn(),
  },
  teamMembership: {
    findMany: jest.fn(),
  },
}));

const db = require('../../config/db');

const {
  TEAM_NAMES,
  listTeamIncidents,
  getTeamAgents,
  getTeamIncidentById,
} = require('./incidents.support.service');

const createTicket = (overrides = {}) => ({
  id: 'INC-1001',
  summary: 'Network connection issue',
  description: 'User cannot connect to the network',
  ticketType: 'Incident',
  priority: 'High',
  status: 'Active',
  organisationId: 'org-001',
  organisation: { name: 'Acme' },
  siteName: 'Head Office',
  assignedAgentId: 'agent-001',
  assignedAgent: {
    id: 'agent-001',
    firstName: 'Alex',
    lastName: 'Smith',
    email: 'alex@example.com',
    availability: 'Available',
  },
  teamId: 'team-001',
  team: { name: '1st Line Support' },
  assignedTeam: '1st Line Support',
  slaTimeLeft: 150,
  createdAt: new Date('2026-10-10T10:00:00Z'),
  updatedAt: new Date('2026-10-10T11:00:00Z'),
  incident: {
    category: 'Network',
    impact: 'High',
    urgency: 'High',
  },
  ...overrides,
});

const staffUser = {
  id: 'agent-001',
  role: 'Service Agent',
  organisationId: 'org-001',
};

describe('Incidents Support Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listTeamIncidents', () => {
    test('filters by team and authenticated organisation', async () => {
      db.ticket.findMany.mockResolvedValue([createTicket()]);

      const result = await listTeamIncidents(
        TEAM_NAMES.FIRST_LINE,
        staffUser,
        {}
      );

      expect(db.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { ticketType: 'Incident' },
              {
                status: {
                  in: ['Active', 'Pending', 'Actioned', 'On Hold'],
                },
              },
              { organisationId: 'org-001' },
            ]),
          }),
        })
      );

      expect(result.incidents).toHaveLength(1);
      expect(result.incidents[0].id).toBe('INC-1001');
    });

    test('sorts by priority and includes formatted SLA details', async () => {
      db.ticket.findMany.mockResolvedValue([
        createTicket({
          id: 'INC-LOW',
          priority: 'Low',
          slaTimeLeft: 45,
        }),
        createTicket({
          id: 'INC-CRITICAL',
          priority: 'Critical',
          slaTimeLeft: 0,
        }),
        createTicket({
          id: 'INC-HIGH',
          priority: 'High',
          slaTimeLeft: 150,
        }),
      ]);

      const result = await listTeamIncidents(
        TEAM_NAMES.FIRST_LINE,
        staffUser,
        { page: '1', limit: '2' }
      );

      expect(result.incidents.map((item) => item.id)).toEqual([
        'INC-CRITICAL',
        'INC-HIGH',
      ]);

      expect(result.incidents[0].slaFormatted).toBe('SLA Breached');
      expect(result.incidents[0].slaBreach).toBe(true);
      expect(result.incidents[1].slaFormatted).toBe('2h 30m');

      expect(result.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });

    test('rejects an unsupported team name', async () => {
      await expect(
        listTeamIncidents('Unknown Team', staffUser, {})
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(db.ticket.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getTeamAgents', () => {
    test('returns team agents with availability, scoped to organisation', async () => {
      db.team.findUnique.mockResolvedValue({
        id: 'team-001',
        name: '1st Line Support',
      });

      db.teamMembership.findMany.mockResolvedValue([
        {
          user: {
            id: 'agent-001',
            firstName: 'Alex',
            lastName: 'Smith',
            email: 'alex@example.com',
            role: 'Service Agent',
            availability: 'Available',
            organisationId: 'org-001',
          },
        },
        {
          user: {
            id: 'agent-002',
            firstName: 'Sam',
            lastName: 'Jones',
            email: 'sam@example.com',
            role: 'Service Agent',
            availability: 'Busy',
            organisationId: 'org-002',
          },
        },
        {
          user: {
            id: 'user-003',
            firstName: 'Taylor',
            lastName: 'Lee',
            email: 'taylor@example.com',
            role: 'Service User',
            availability: 'Available',
            organisationId: 'org-001',
          },
        },
      ]);

      const result = await getTeamAgents(
        TEAM_NAMES.FIRST_LINE,
        staffUser
      );

      expect(db.teamMembership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teamId: 'team-001' },
        })
      );

      expect(result.total).toBe(1);
      expect(result.agents[0]).toEqual({
        id: 'agent-001',
        firstName: 'Alex',
        lastName: 'Smith',
        email: 'alex@example.com',
        availability: 'Available',
      });
    });
  });

  describe('getTeamIncidentById', () => {
    test('returns a matching team incident with SLA details', async () => {
      db.ticket.findFirst.mockResolvedValue(createTicket());

      const result = await getTeamIncidentById(
        TEAM_NAMES.FIRST_LINE,
        'inc-1001',
        staffUser
      );

      expect(db.ticket.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              {
                id: {
                  equals: 'inc-1001',
                  mode: 'insensitive',
                },
              },
            ]),
          }),
        })
      );

      expect(result.id).toBe('INC-1001');
      expect(result.category).toBe('Network');
      expect(result.slaFormatted).toBe('2h 30m');
    });

    test('returns null when the ticket does not match', async () => {
      db.ticket.findFirst.mockResolvedValue(null);

      const result = await getTeamIncidentById(
        TEAM_NAMES.SECOND_LINE,
        'INC-MISSING',
        staffUser
      );

      expect(result).toBeNull();
    });
  });
});
