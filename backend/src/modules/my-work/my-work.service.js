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
 * Numeric sort weight for each priority level — lower = higher urgency.
 * Used to sort ticket queues so Critical tickets always surface first.
 */
const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

/**
 * SLA escalation thresholds (minutes remaining) per priority.
 * A ticket needs escalation when slaTimeLeft falls at or below this value.
 */
const ESCALATION_THRESHOLDS = { Critical: 60, High: 120, Medium: 240, Low: 480 };

/**
 * On Hold escalation thresholds (hours on hold) per priority.
 * A ticket needs escalation when it has been on hold at or beyond this duration.
 */
const HOLD_ESCALATION_HOURS = { Critical: 4, High: 8, Medium: 24, Low: 48 };

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
 * Determine whether a ticket needs escalation and why.
 * Escalation triggers:
 *   1. SLA time left is at or below the priority threshold (applies to all statuses)
 *   2. On Hold duration exceeds the priority threshold in hours (On Hold only)
 */
const computeEscalation = (t) => {
  const slaThreshold = ESCALATION_THRESHOLDS[t.priority] ?? 60;

  // BI-3 FIX: Remove the `>= 0` guard so already-breached tickets (slaTimeLeft < 0)
  // also trigger escalation — a breached SLA always needs escalation.
  const slaCritical =
    typeof t.slaTimeLeft === 'number' &&
    t.slaTimeLeft <= slaThreshold;

  let holdOverdue = false;
  if (t.status === 'On Hold' && t.holdStartedAt) {
    const hoursOnHold =
      (Date.now() - new Date(t.holdStartedAt).getTime()) / 3600000;
    holdOverdue = hoursOnHold >= (HOLD_ESCALATION_HOURS[t.priority] ?? 24);
  }

  const needsEscalation = slaCritical || holdOverdue;
  const reasons = [];
  if (slaCritical) reasons.push('SLA threshold reached');
  if (holdOverdue) reasons.push('Hold duration exceeded');

  return {
    needsEscalation,
    escalationReason: reasons.length > 0 ? reasons.join('; ') : null,
  };
};

/**
 * Attach all computed SLA, hold-duration, and escalation fields to a raw ticket.
 * Used consistently across every service response to guarantee a uniform contract.
 */
const formatTicket = (t) => ({
  ...t,
  slaFormatted: formatSla(t.slaTimeLeft),
  slaBreach: typeof t.slaTimeLeft === 'number' && t.slaTimeLeft <= 0,
  holdDuration: formatHoldDuration(t.holdStartedAt),
  ...computeEscalation(t),
});

/**
 * Retrieve personal tickets for an agent, optionally filtered by queue status or priority
 */
const getAgentTickets = async (agentId = 'agent-001', query = {}) => {
  const filters = { assignedAgentId: agentId };

  // BI-2 FIX: Guard typeof before calling .trim() — repeated query params arrive
  // as arrays, and non-string values (numbers, objects) crash with a TypeError.
  if (query.status) {
    if (typeof query.status !== 'string') {
      const error = new Error('status must be a string');
      error.statusCode = 400;
      throw error;
    }
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
    if (typeof query.priority !== 'string') {
      const error = new Error('priority must be a string');
      error.statusCode = 400;
      throw error;
    }
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
    // BI-2: Same typeof guard — repeated ?ticketType params arrive as an array.
    if (typeof query.ticketType !== 'string') {
      const error = new Error('ticketType must be a string');
      error.statusCode = 400;
      throw error;
    }
    filters.ticketType = query.ticketType.trim();
  }

  if (query.organisation) {
    // BI-2: Same typeof guard — repeated ?organisation params arrive as an array.
    if (typeof query.organisation !== 'string') {
      const error = new Error('organisation must be a string');
      error.statusCode = 400;
      throw error;
    }
    filters.organisation = query.organisation.trim();
  }

  const allMatched = await getTickets(filters);

  // Sort by priority: Critical → High → Medium → Low
  // Ensures highest-urgency tickets are always on the first page.
  allMatched.sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
  );

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
 * BI-4 FIX: Verify the requesting agent owns the ticket (IDOR / BOLA prevention).
 * The caller passes agentId; we reject with 403 if it does not match assignedAgentId.
 */
const getTicket = async (ticketId, agentId) => {
  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    const error = new Error(`Ticket with ID '${ticketId}' not found`);
    error.statusCode = 404;
    throw error;
  }

  // BI-4: Ownership check — only the assigned agent (or an unscoped system call) may read.
  if (agentId && ticket.assignedAgentId !== agentId) {
    const error = new Error('Access denied: you do not own this ticket');
    error.statusCode = 403;
    throw error;
  }

  return formatTicket(ticket);
};

/**
 * Update the status of a ticket (e.g. moving between Active, Pending, On Hold, Actioned)
 * BI-4 FIX: agentId added so we can verify ownership before mutating.
 */
const changeTicketStatus = async (ticketId, payload = {}, agentId) => {
  const { status, holdReason } = payload;

  if (!status) {
    const error = new Error('status is required');
    error.statusCode = 400;
    throw error;
  }

  // BI-2 FIX: Guard typeof before calling .trim() on payload.status.
  if (typeof status !== 'string') {
    const error = new Error('status must be a string');
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

  // BI-4: Ownership check — only the assigned agent may change ticket status.
  if (agentId && existingTicket.assignedAgentId !== agentId) {
    const error = new Error('Access denied: you do not own this ticket');
    error.statusCode = 403;
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
 * BI-1 FIX: Number(true) === 1 and isNaN('Infinity') === false, so we must
 *   (a) require the raw value to be a finite number type before coercing, and
 *   (b) reject non-finite values (Infinity, -Infinity, NaN) explicitly.
 * BI-4 FIX: agentId added so we can verify ownership before mutating.
 */
const logTicketTime = async (ticketId, minutesSpent, agentId) => {
  // BI-1: Reject non-number types (booleans, strings like 'Infinity', objects, etc.)
  if (typeof minutesSpent !== 'number' || !Number.isFinite(minutesSpent)) {
    const error = new Error('minutesSpent must be a finite number');
    error.statusCode = 400;
    throw error;
  }

  if (minutesSpent <= 0) {
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

  // BI-4: Ownership check — only the assigned agent may log time.
  if (agentId && existingTicket.assignedAgentId !== agentId) {
    const error = new Error('Access denied: you do not own this ticket');
    error.statusCode = 403;
    throw error;
  }

  // BI-5 (noted/deferred): Read-modify-write is safe for the in-memory store;
  // migrate to atomic DB increment (UPDATE ... SET timeRecord = timeRecord + $1) when
  // switching to Postgres/Prisma.
  const newTotalTime = (existingTicket.timeRecord || 0) + minutesSpent;
  const updatedTicket = await updateTicket(ticketId, { timeRecord: newTotalTime });

  return formatTicket(updatedTicket);
};

module.exports = {
  VALID_STATUSES,
  VALID_PRIORITIES,
  PRIORITY_ORDER,
  ESCALATION_THRESHOLDS,
  HOLD_ESCALATION_HOURS,
  formatSla,
  formatHoldDuration,
  formatTicket,
  computeEscalation,
  getAgentTickets,
  getActiveTickets,
  getPendingTickets,
  getActionedTickets,
  getOnHoldTickets,
  getTicket,
  changeTicketStatus,
  logTicketTime,
};
