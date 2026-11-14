
jest.mock('./incidents.service', () => ({
  listIncidents: jest.fn(),
  getIncident: jest.fn(),
  getPriorityAnalytics: jest.fn(),
  getCategoryAnalytics: jest.fn(),
  getRecentIncidents: jest.fn(),
  getNewTickets: jest.fn(),
}));

jest.mock('./incidents.support.service', () => ({
  TEAM_NAMES: {
    FIRST_LINE: '1st Line Support',
    SECOND_LINE: '2nd Line Support',
  },
  listTeamIncidents: jest.fn(),
  getTeamAgents: jest.fn(),
  getTeamIncidentById: jest.fn(),
}));

const supportService = require('./incidents.support.service');

const {
  getFirstLineIncidents,
  getFirstLineAgents,
  getFirstLineIncident,
  getSecondLineIncidents,
  getSecondLineAgents,
  getSecondLineIncident,
} = require('./incidents.controller');

const router = require('./incidents.routes');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const user = {
  id: 'agent-001',
  role: 'Service Agent',
  organisationId: 'org-001',
};

describe('Incidents Support Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists first-line incidents using the authenticated user', async () => {
    const result = { incidents: [], pagination: { total: 0 } };
    supportService.listTeamIncidents.mockResolvedValue(result);

    const req = { user, query: { page: '1' } };
    const res = createResponse();

    await getFirstLineIncidents(req, res);

    expect(supportService.listTeamIncidents).toHaveBeenCalledWith(
      '1st Line Support',
      user,
      req.query
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: result,
    });
  });

  test('returns first-line agent availability', async () => {
    const result = {
      team: '1st Line Support',
      agents: [{ id: 'agent-001', availability: 'Available' }],
      total: 1,
    };
    supportService.getTeamAgents.mockResolvedValue(result);

    const res = createResponse();

    await getFirstLineAgents({ user }, res);

    expect(supportService.getTeamAgents).toHaveBeenCalledWith(
      '1st Line Support',
      user
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('returns first-line incident details', async () => {
    const incident = { id: 'INC-1001', slaFormatted: '30m' };
    supportService.getTeamIncidentById.mockResolvedValue(incident);

    const res = createResponse();

    await getFirstLineIncident(
      { user, params: { ticketId: 'INC-1001' } },
      res
    );

    expect(supportService.getTeamIncidentById).toHaveBeenCalledWith(
      '1st Line Support',
      'INC-1001',
      user
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: incident,
    });
  });

  test('returns 404 for missing first-line incident details', async () => {
    supportService.getTeamIncidentById.mockResolvedValue(null);

    const res = createResponse();

    await getFirstLineIncident(
      { user, params: { ticketId: 'INC-MISSING' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('lists second-line incidents using the authenticated user', async () => {
    const result = { incidents: [], pagination: { total: 0 } };
    supportService.listTeamIncidents.mockResolvedValue(result);

    const req = { user, query: {} };
    const res = createResponse();

    await getSecondLineIncidents(req, res);

    expect(supportService.listTeamIncidents).toHaveBeenCalledWith(
      '2nd Line Support',
      user,
      req.query
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('returns second-line agent list', async () => {
    supportService.getTeamAgents.mockResolvedValue({
      team: '2nd Line Support',
      agents: [],
      total: 0,
    });

    const res = createResponse();

    await getSecondLineAgents({ user }, res);

    expect(supportService.getTeamAgents).toHaveBeenCalledWith(
      '2nd Line Support',
      user
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('returns second-line ticket details', async () => {
    const ticket = { id: 'INC-2001' };
    supportService.getTeamIncidentById.mockResolvedValue(ticket);

    const res = createResponse();

    await getSecondLineIncident(
      { user, params: { ticketId: 'INC-2001' } },
      res
    );

    expect(supportService.getTeamIncidentById).toHaveBeenCalledWith(
      '2nd Line Support',
      'INC-2001',
      user
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('registers all six support routes', () => {
    const registeredRoutes = router.stack
      .filter((layer) => layer.route)
      .map((layer) => layer.route.path);

    const expectedRoutes = [
      '/support/first-line',
      '/support/first-line/agents',
      '/support/first-line/:ticketId',
      '/support/second-line',
      '/support/second-line/agents',
      '/support/second-line/:ticketId',
    ];

    for (const path of expectedRoutes) {
      expect(registeredRoutes).toContain(path);
    }
  });
});
