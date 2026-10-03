const {
  getTickets,
  getTicketById,
  saveTicket,
  updateTicket,
} = require('./my-work.model');

const VALID_STATUSES = ['Active', 'Pending', 'Actioned', 'On Hold'];
const VALID_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const DEFAULT_PAGE_SIZE = 20;

/**
 * Parse and validate pagination query params (page, limit)
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE));
  return { page, limit };
};

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
 * Compute how long a ticket has been on hold from holdStartedAt to now.
 * Returns a human-readable string (e.g. "1h 45m") or null if not on hold.
 */
const formatHoldDuration = (holdStartedAt) => {
  if (!holdStartedAt) return null;
  const diffMs = Date.now() - new Date(holdStartedAt).getTime();
  if (diffMs < 0) return null;
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

/**
 * Attach all computed SLA and hold-duration fields to a raw ticket object.
 * Used consistently across every service response to guarantee a uniform contract.
 */
const formatTicket = (t) => ({
  ...t,
  slaFormatted: formatSla(t.slaTimeLeft),
  slaBreach: typeof t.slaTimeLeft === 'number' && t.slaTimeLeft <= 0,
  holdDuration: formatHoldDuration(t.holdStartedAt),
});

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

  if (query.organisation) {
    filters.organisation = query.organisation.trim();
  }

  const allMatched = await getTickets(filters);
  const total = allMatched.length;

  const { page, limit } = parsePagination(query);
  const startIndex = (page - 1) * limit;
  const paginated = allMatched.slice(startIndex, startIndex + limit);

  const tickets = paginated.map(formatTicket);

  return {
    tickets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Retrieve On-Hold tickets with hold reasons and SLA remaining details (SCR-008, SCR-016)
 */
const getOnHoldTickets = async (agentId = 'agent-001', query = {}) => {
  return getAgentTickets(agentId, { ...query, status: 'On Hold' });
};

/**
 * Retrieve Active tickets for the agent's current working queue (SCR-004)
 */
const getActiveTickets = async (agentId = 'agent-001', query = {}) => {
  return getAgentTickets(agentId, { ...query, status: 'Active' });
};

/**
 * Retrieve Pending tickets awaiting action or approval (SCR-004)
 */
const getPendingTickets = async (agentId = 'agent-001', query = {}) => {
  return getAgentTickets(agentId, { ...query, status: 'Pending' });
};

/**
 * Retrieve Actioned tickets that have been worked and resolved (SCR-004)
 */
const getActionedTickets = async (agentId = 'agent-001', query = {}) => {
  return getAgentTickets(agentId, { ...query, status: 'Actioned' });
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

  return formatTicket(ticket);
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

  return formatTicket(updatedTicket);
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

  return formatTicket(updatedTicket);
};

module.exports = {
  VALID_STATUSES,
  VALID_PRIORITIES,
  formatSla,
  formatHoldDuration,
  formatTicket,
  getAgentTickets,
  getActiveTickets,
  getPendingTickets,
  getActionedTickets,
  getOnHoldTickets,
  getTicket,
  changeTicketStatus,
  logTicketTime,
};
