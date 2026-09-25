const {
  getTickets,
  getTicketById,
  saveTicket,
  updateTicket,
} = require('./my-work.model');

const VALID_STATUSES = ['Active', 'Pending', 'Actioned', 'On Hold'];
const VALID_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

/**
 * Format minutes into human-readable SLA string (e.g. "2h 30m" or "Breached")
 */
const formatSla = (minutes) => {
  if (minutes === null || minutes === undefined) return 'N/A';
  if (minutes <= 0) return 'SLA Breached';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
};

/**
 * Retrieve personal tickets for an agent, optionally filtered by queue status or priority
 */
const getAgentTickets = async (agentId = 'agent-001', query = {}) => {
  const filters = { assignedAgentId: agentId };

  if (query.status) {
    const formattedStatus = query.status.trim();
    const matched = VALID_STATUSES.find(
      (s) => s.toLowerCase() === formattedStatus.toLowerCase()
    );
    if (!matched) {
      const error = new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    filters.status = matched;
  }

  if (query.priority) {
    const matchedPriority = VALID_PRIORITIES.find(
      (p) => p.toLowerCase() === query.priority.trim().toLowerCase()
    );
    if (!matchedPriority) {
      const error = new Error(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    filters.priority = matchedPriority;
  }

  if (query.ticketType) {
    filters.ticketType = query.ticketType.trim();
  }

  const rawTickets = await getTickets(filters);

  return rawTickets.map((t) => ({
    ...t,
    slaFormatted: formatSla(t.slaTimeLeft),
  }));
};

/**
 * Retrieve On-Hold tickets with hold reasons and SLA remaining details (SCR-008, SCR-016)
 */
const getOnHoldTickets = async (agentId = 'agent-001', query = {}) => {
  return getAgentTickets(agentId, { ...query, status: 'On Hold' });
};

/**
 * Retrieve a specific ticket by ID
 */
const getTicket = async (ticketId) => {
  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    const error = new Error(`Ticket with ID '${ticketId}' not found`);
    error.statusCode = 404;
    throw error;
  }

  return {
    ...ticket,
    slaFormatted: formatSla(ticket.slaTimeLeft),
  };
};

/**
 * Update the status of a ticket (e.g. moving between Active, Pending, On Hold, Actioned)
 */
const changeTicketStatus = async (ticketId, payload = {}) => {
  const { status, holdReason } = payload;

  if (!status) {
    const error = new Error('status is required');
    error.statusCode = 400;
    throw error;
  }

  const matchedStatus = VALID_STATUSES.find(
    (s) => s.toLowerCase() === status.trim().toLowerCase()
  );

  if (!matchedStatus) {
    const error = new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const existingTicket = await getTicketById(ticketId);
  if (!existingTicket) {
    const error = new Error(`Ticket with ID '${ticketId}' not found`);
    error.statusCode = 404;
    throw error;
  }

  const updates = {
    status: matchedStatus,
    holdReason: matchedStatus === 'On Hold' ? holdReason || 'Pending external input' : null,
  };

  const updatedTicket = await updateTicket(ticketId, updates);

  return {
    ...updatedTicket,
    slaFormatted: formatSla(updatedTicket.slaTimeLeft),
  };
};

/**
 * Log time worked on a ticket
 */
const logTicketTime = async (ticketId, minutesSpent) => {
  const parsedMinutes = Number(minutesSpent);

  if (isNaN(parsedMinutes) || parsedMinutes <= 0) {
    const error = new Error('minutesSpent must be a positive number');
    error.statusCode = 400;
    throw error;
  }

  const existingTicket = await getTicketById(ticketId);
  if (!existingTicket) {
    const error = new Error(`Ticket with ID '${ticketId}' not found`);
    error.statusCode = 404;
    throw error;
  }

  const newTotalTime = (existingTicket.timeRecord || 0) + parsedMinutes;
  const updatedTicket = await updateTicket(ticketId, { timeRecord: newTotalTime });

  return {
    ...updatedTicket,
    slaFormatted: formatSla(updatedTicket.slaTimeLeft),
  };
};

module.exports = {
  VALID_STATUSES,
  VALID_PRIORITIES,
  formatSla,
  getAgentTickets,
  getOnHoldTickets,
  getTicket,
  changeTicketStatus,
  logTicketTime,
};
