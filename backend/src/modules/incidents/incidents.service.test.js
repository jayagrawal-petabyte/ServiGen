const {
  listIncidents,
  getIncident,
  getPriorityAnalytics,
  getCategoryAnalytics,
  getRecentIncidents,
  getNewTickets,
} = require('./incidents.service');

describe('Incidents Service', () => {
  describe('listIncidents', () => {
    test('returns incidents with pagination', async () => {
      const result = await listIncidents({
        page: 1,
        limit: 2,
      });

      expect(result).toHaveProperty('incidents');
      expect(result).toHaveProperty('pagination');

      expect(result.incidents).toHaveLength(2);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
    });

    test('sorts incidents by priority', async () => {
      const result = await listIncidents({
        page: 1,
        limit: 20,
      });

      const priorities = result.incidents.map(
        (incident) => incident.priority
      );

      expect(priorities).toEqual([
        'Critical',
        'Critical',
        'High',
        'High',
        'Medium',
      ]);
    });

    test('filters incidents by priority', async () => {
      const result = await listIncidents({
        priority: 'Critical',
        page: 1,
        limit: 20,
      });

      expect(result.incidents).toHaveLength(2);

      result.incidents.forEach((incident) => {
        expect(incident.priority).toBe('Critical');
      });
    });

    test('filters incidents by category', async () => {
      const result = await listIncidents({
        category: 'Software',
        page: 1,
        limit: 20,
      });

      expect(result.incidents).toHaveLength(2);

      result.incidents.forEach((incident) => {
        expect(incident.incident.category).toBe('Software');
      });
    });

    test('filters incidents by support team', async () => {
      const result = await listIncidents({
        assignedTeam: '1st Line Support',
        page: 1,
        limit: 20,
      });

      expect(result.incidents).toHaveLength(3);

      result.incidents.forEach((incident) => {
        expect(incident.assignedTeam).toBe('1st Line Support');
      });
    });

    test('supports search by incident summary', async () => {
      const result = await listIncidents({
        search: 'VPN',
        page: 1,
        limit: 20,
      });

      expect(result.incidents).toHaveLength(1);
      expect(result.incidents[0].id).toBe('INC-1001');
    });
  });

  describe('getIncident', () => {
    test('returns an incident by ID', async () => {
      const incident = await getIncident('INC-1001');

      expect(incident).not.toBeNull();
      expect(incident.id).toBe('INC-1001');
      expect(incident.incident.category).toBe('Network');
    });

    test('returns null for an unknown incident', async () => {
      const incident = await getIncident('INC-9999');

      expect(incident).toBeNull();
    });

    test('handles incident IDs case-insensitively', async () => {
      const incident = await getIncident('inc-1001');

      expect(incident).not.toBeNull();
      expect(incident.id).toBe('INC-1001');
    });
  });

  describe('getPriorityAnalytics', () => {
    test('groups incidents by priority', async () => {
      const result = await getPriorityAnalytics();

      expect(result).toEqual({
        Critical: 2,
        High: 2,
        Medium: 1,
      });
    });
  });

  describe('getCategoryAnalytics', () => {
    test('groups incidents by category', async () => {
      const result = await getCategoryAnalytics();

      expect(result).toEqual({
        Network: 1,
        Software: 2,
        Database: 1,
        'Access & Identity': 1,
      });
    });
  });

  describe('getRecentIncidents', () => {
    test('returns incidents ordered by most recently updated', async () => {
      const result = await getRecentIncidents({
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(5);

      expect(result.items[0].id).toBe('INC-1005');
      expect(result.items[1].id).toBe('INC-1003');
      expect(result.items[2].id).toBe('INC-1002');
    });

    test('supports pagination', async () => {
      const result = await getRecentIncidents({
        page: 1,
        limit: 2,
      });

      expect(result.items).toHaveLength(2);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe('getNewTickets', () => {
    test('returns incident tickets ordered by creation date', async () => {
      const result = await getNewTickets({
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(5);

      expect(result.items[0].id).toBe('INC-1003');
      expect(result.items[1].id).toBe('INC-1001');
    });

    test('supports pagination', async () => {
      const result = await getNewTickets({
        page: 1,
        limit: 2,
      });

      expect(result.items).toHaveLength(2);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.totalPages).toBe(3);
    });
  });
});