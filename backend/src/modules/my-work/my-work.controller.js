const {
  getAgentTickets,
  getOnHoldTickets,
  getTicket,
  changeTicketStatus,
  logTicketTime,
} = require('./my-work.service');

/**
 * Standard error responder matching repository conventions
 */
const respondWithError = (res, error, fallbackMessage) => {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : fallbackMessage,
  });
};

/**
 * Extract active agent/user ID from headers or query (defaults to dev mock 'agent-001')
 */
const getAgentIdFromReq = (req) => {
  return req.headers['x-user-id'] || req.query.agentId || 'agent-001';
};

/**
 * GET /my-work - List agent's personal tickets (Active, Pending, Actioned, On Hold)
 */
const listMyWorkTickets = async (req, res) => {
  try {
    const agentId = getAgentIdFromReq(req);
    const tickets = await getAgentTickets(agentId, req.query);
    return res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch personal tickets');
  }
};

/**
 * GET /my-work/on-hold - List tickets currently placed on hold (SCR-008, SCR-016)
 */
const listOnHoldTickets = async (req, res) => {
  try {
    const agentId = getAgentIdFromReq(req);
    const tickets = await getOnHoldTickets(agentId, req.query);
    return res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch on-hold tickets');
  }
};

/**
 * GET /my-work/:ticketId - Retrieve specific ticket details
 */
const getTicketDetails = async (req, res) => {
  try {
    const ticket = await getTicket(req.params.ticketId);
    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch ticket details');
  }
};

/**
 * PATCH /my-work/:ticketId/status - Update ticket queue status & hold reasons
 */
const updateTicketStatusHandler = async (req, res) => {
  try {
    const updated = await changeTicketStatus(req.params.ticketId, req.body);
    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to update ticket status');
  }
};

/**
 * POST /my-work/:ticketId/time - Log work time on ticket
 */
const logTimeHandler = async (req, res) => {
  try {
    const { minutesSpent } = req.body;
    const updated = await logTicketTime(req.params.ticketId, minutesSpent);
    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to log time on ticket');
  }
};

module.exports = {
  listMyWorkTickets,
  listOnHoldTickets,
  getTicketDetails,
  updateTicketStatusHandler,
  logTimeHandler,
};
