jest.mock('./incidents.service', () => ({
  listIncidents: jest.fn(),
  getIncident: jest.fn(),
  getPriorityAnalytics: jest.fn(),
  getCategoryAnalytics: jest.fn(),
  getRecentIncidents: jest.fn(),
  getNewTickets: jest.fn(),
}));

const {
  listIncidents,
  getIncident,
} = require('./incidents.service');

const {
  listIncidentRecords,
  getIncidentRecord,
} = require('./incidents.controller');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('Incidents Controller - Tenant Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getIncidentRecord', () => {
    test('allows a user to access an incident in their organisation', async () => {
      getIncident.mockResolvedValue({
        id: 'INC-1001',
        organisationId: 'org-001',
        organisation: 'Acme',
      });

      const req = {
        params: { incidentId: 'INC-1001' },
        user: {
          role: 'Staff',
          organisationId: 'org-001',
        },
      };

      const res = createResponse();

      await getIncidentRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'INC-1001',
        }),
      });
    });

    test('blocks access to another organisation incident', async () => {
      getIncident.mockResolvedValue({
        id: 'INC-1002',
        organisationId: 'org-002',
        organisation: 'Globex',
      });

      const req = {
        params: { incidentId: 'INC-1002' },
        user: {
          role: 'Staff',
          organisationId: 'org-001',
        },
      };

      const res = createResponse();

      await getIncidentRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Incident not found',
      });
    });

    test('blocks access when the user organisation ID is missing', async () => {
      getIncident.mockResolvedValue({
        id: 'INC-1001',
        organisationId: 'org-001',
      });

      const req = {
        params: { incidentId: 'INC-1001' },
        user: {
          role: 'Staff',
        },
      };

      const res = createResponse();

      await getIncidentRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('allows an Admin to access an incident from another organisation', async () => {
      getIncident.mockResolvedValue({
        id: 'INC-1002',
        organisationId: 'org-002',
      });

      const req = {
        params: { incidentId: 'INC-1002' },
        user: {
          role: 'Admin',
          organisationId: 'org-001',
        },
      };

      const res = createResponse();

      await getIncidentRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('listIncidentRecords', () => {
    test('enforces the authenticated user organisation ID', async () => {
      listIncidents.mockResolvedValue({
        incidents: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });

      const req = {
        query: {
          priority: 'High',
          organisationId: 'org-002',
        },
        user: {
          role: 'Staff',
          organisationId: 'org-001',
        },
      };

      const res = createResponse();

      await listIncidentRecords(req, res);

      expect(listIncidents).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'High',
          organisationId: 'org-001',
        })
      );
    });

    test('uses a safe organisation filter when the user organisation ID is missing', async () => {
      listIncidents.mockResolvedValue({
        incidents: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });

      const req = {
        query: {},
        user: {
          role: 'Staff',
        },
      };

      const res = createResponse();

      await listIncidentRecords(req, res);

      expect(listIncidents).toHaveBeenCalledWith(
        expect.objectContaining({
          organisationId: '__unassigned_organisation__',
        })
      );
    });
  });
});