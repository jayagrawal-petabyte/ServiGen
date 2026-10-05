/**
 * Temporary in-memory data store for the Incidents module.
 *
 * This follows the same repository/model pattern used by the existing
 * modules and can later be replaced with Prisma queries without changing
 * the service/controller responsibilities.
 */

const incidents = [
  {
    id: 'INC-1001',
    summary: 'VPN connection dropping intermittently for remote users',
    description: 'Remote users are repeatedly disconnected from the corporate VPN.',
    ticketType: 'Incident',
    priority: 'High',
    status: 'Active',
    organisation: 'Acme Corp',
    siteName: 'London HQ',
    requesterId: 'user-001',
    assignedAgentId: 'agent-001',
    teamId: 'team-001',
    assignedTeam: '1st Line Support',
    slaTimeLeft: 180,
    timeRecord: 45,

    incident: {
      id: 'INC-DETAIL-1001',
      category: 'Network',
      impact: 'Remote users are unable to maintain stable VPN sessions.',
      urgency: 'High',
    },

    createdAt: '2026-09-25T08:30:00.000Z',
    updatedAt: '2026-09-25T09:15:00.000Z',
  },

  {
    id: 'INC-1002',
    summary: 'Email delivery delayed on EMEA exchange server',
    description: 'Emails are taking longer than expected to reach EMEA users.',
    ticketType: 'Incident',
    priority: 'Critical',
    status: 'Active',
    organisation: 'Initech',
    siteName: 'Frankfurt',
    requesterId: 'user-002',
    assignedAgentId: 'agent-002',
    teamId: 'team-002',
    assignedTeam: '2nd Line Support',
    slaTimeLeft: 45,
    timeRecord: 90,

    incident: {
      id: 'INC-DETAIL-1002',
      category: 'Software',
      impact: 'Email delivery is delayed for EMEA users.',
      urgency: 'Critical',
    },

    createdAt: '2026-09-25T06:00:00.000Z',
    updatedAt: '2026-09-25T09:30:00.000Z',
  },

  {
    id: 'INC-1003',
    summary: 'Database connection timeout during batch reporting',
    description: 'Batch reporting jobs are failing because of database connection timeouts.',
    ticketType: 'Incident',
    priority: 'Critical',
    status: 'Active',
    organisation: 'Massive Dynamic',
    siteName: 'London HQ',
    requesterId: 'user-003',
    assignedAgentId: 'agent-003',
    teamId: 'team-001',
    assignedTeam: '1st Line Support',
    slaTimeLeft: 60,
    timeRecord: 60,

    incident: {
      id: 'INC-DETAIL-1003',
      category: 'Database',
      impact: 'Reporting jobs are delayed or failing.',
      urgency: 'Critical',
    },

    createdAt: '2026-09-25T09:00:00.000Z',
    updatedAt: '2026-09-25T10:00:00.000Z',
  },

  {
    id: 'INC-1004',
    summary: 'Office 365 access issue for sales department',
    description: 'Several sales users cannot access required Office 365 services.',
    ticketType: 'Incident',
    priority: 'Medium',
    status: 'Pending',
    organisation: 'Soylent Corp',
    siteName: 'London HQ',
    requesterId: 'user-004',
    assignedAgentId: 'agent-001',
    teamId: 'team-001',
    assignedTeam: '1st Line Support',
    slaTimeLeft: 240,
    timeRecord: 15,

    incident: {
      id: 'INC-DETAIL-1004',
      category: 'Access & Identity',
      impact: 'Sales users have limited access to Office 365.',
      urgency: 'Medium',
    },

    createdAt: '2026-09-25T07:00:00.000Z',
    updatedAt: '2026-09-25T08:00:00.000Z',
  },

  {
    id: 'INC-1005',
    summary: 'Payroll application unavailable for finance team',
    description: 'Finance users are unable to open the payroll application.',
    ticketType: 'Incident',
    priority: 'High',
    status: 'Resolved',
    organisation: 'Globex Corp',
    siteName: 'New York',
    requesterId: 'user-005',
    assignedAgentId: 'agent-004',
    teamId: 'team-002',
    assignedTeam: '2nd Line Support',
    slaTimeLeft: 0,
    timeRecord: 120,

    incident: {
      id: 'INC-DETAIL-1005',
      category: 'Software',
      impact: 'Finance users cannot access payroll processing.',
      urgency: 'High',
    },

    createdAt: '2026-09-24T09:00:00.000Z',
    updatedAt: '2026-09-25T11:00:00.000Z',
  },
];

const getIncidents = async () => {
  return [...incidents];
};

const getIncidentById = async (id) => {
  return incidents.find(
    (incident) => incident.id.toLowerCase() === id.toLowerCase()
  ) || null;
};

module.exports = {
  getIncidents,
  getIncidentById,
};