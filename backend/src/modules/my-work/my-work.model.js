/**
 * In-memory data store for the My Work module.
 * Represents an agent's personal ticket queue covering Active, Pending, Actioned, and On-Hold states.
 * Isolated repository pattern to enable future migration to Supabase/Prisma.
 */

const tickets = [
  {
    id: 'INC-1001',
    summary: 'VPN connection dropping intermittently for remote users',
    priority: 'High',
    status: 'Active',
    ticketType: 'Incident',
    organisation: 'Acme Corp',
    site: 'London HQ',
    assignedAgentId: 'agent-001',
    slaTimeLeft: 180,
    timeRecord: 45,
    holdReason: null,
    createdAt: '2026-09-25T08:30:00.000Z',
    updatedAt: '2026-09-25T09:15:00.000Z',
  },
  {
    id: 'REQ-1002',
    summary: 'Request for administrator rights on developer workstation',
    priority: 'Medium',
    status: 'Pending',
    ticketType: 'Service Request',
    organisation: 'Globex Corp',
    site: 'New York',
    assignedAgentId: 'agent-001',
    slaTimeLeft: 360,
    timeRecord: 20,
    holdReason: 'Awaiting manager approval',
    createdAt: '2026-09-25T07:45:00.000Z',
    updatedAt: '2026-09-25T08:10:00.000Z',
  },
  {
    id: 'INC-1003',
    summary: 'Email delivery delayed on EMEA exchange server',
    priority: 'Critical',
    status: 'Actioned',
    ticketType: 'Incident',
    organisation: 'Initech',
    site: 'Frankfurt',
    assignedAgentId: 'agent-001',
    slaTimeLeft: 45,
    timeRecord: 90,
    holdReason: null,
    createdAt: '2026-09-25T06:00:00.000Z',
    updatedAt: '2026-09-25T09:30:00.000Z',
  },
  {
    id: 'INC-1004',
    summary: 'Office 365 licensing renewal for sales department',
    priority: 'Medium',
    status: 'On Hold',
    ticketType: 'Incident',
    organisation: 'Soylent Corp',
    site: 'London HQ',
    assignedAgentId: 'agent-001',
    slaTimeLeft: 420,
    timeRecord: 15,
    holdReason: 'Awaiting vendor quote',
    createdAt: '2026-09-24T14:00:00.000Z',
    updatedAt: '2026-09-25T08:00:00.000Z',
  },
  {
    id: 'REQ-1005',
    summary: 'Hardware replacement: Docking station malfunctioning',
    priority: 'Low',
    status: 'On Hold',
    ticketType: 'Service Request',
    organisation: 'Umbrella Corp',
    site: 'Tokyo',
    assignedAgentId: 'agent-001',
    slaTimeLeft: 540,
    timeRecord: 30,
    holdReason: 'Awaiting hardware shipment',
    createdAt: '2026-09-24T11:20:00.000Z',
    updatedAt: '2026-09-25T07:30:00.000Z',
  },
  {
    id: 'INC-1006',
    summary: 'Database connection timeout during batch reporting',
    priority: 'Critical',
    status: 'Active',
    ticketType: 'Incident',
    organisation: 'Massive Dynamic',
    site: 'London HQ',
    assignedAgentId: 'agent-001',
    slaTimeLeft: 60,
    timeRecord: 60,
    holdReason: null,
    createdAt: '2026-09-25T09:00:00.000Z',
    updatedAt: '2026-09-25T10:00:00.000Z',
  },
  {
    id: 'REQ-1007',
    summary: 'New hire onboarding account provisioning',
    priority: 'Medium',
    status: 'Actioned',
    ticketType: 'Service Request',
    organisation: 'Hooli',
    site: 'Singapore',
    assignedAgentId: 'agent-002',
    slaTimeLeft: 240,
    timeRecord: 35,
    holdReason: null,
    createdAt: '2026-09-25T08:00:00.000Z',
    updatedAt: '2026-09-25T09:45:00.000Z',
  },
];

const getTickets = async (filters = {}) => {
  return tickets.filter((ticket) => {
    const matchesAgent =
      !filters.assignedAgentId || ticket.assignedAgentId === filters.assignedAgentId;
    const matchesStatus =
      !filters.status || ticket.status.toLowerCase() === filters.status.toLowerCase();
    const matchesPriority =
      !filters.priority || ticket.priority.toLowerCase() === filters.priority.toLowerCase();
    const matchesType =
      !filters.ticketType || ticket.ticketType.toLowerCase() === filters.ticketType.toLowerCase();

    return matchesAgent && matchesStatus && matchesPriority && matchesType;
  });
};

const getTicketById = async (id) => {
  return tickets.find((ticket) => ticket.id.toLowerCase() === id.toLowerCase()) || null;
};

const saveTicket = async (ticket) => {
  tickets.push(ticket);
  return ticket;
};

const updateTicket = async (id, changes) => {
  const ticket = await getTicketById(id);

  if (!ticket) {
    return null;
  }

  Object.assign(ticket, changes, { updatedAt: new Date().toISOString() });
  return ticket;
};

module.exports = {
  getTickets,
  getTicketById,
  saveTicket,
  updateTicket,
};
