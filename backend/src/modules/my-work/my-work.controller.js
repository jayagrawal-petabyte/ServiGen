const {
  getAgentTickets,
  getActiveTickets,
  getPendingTickets,
  getActionedTickets,
  getOnHoldTickets,
  getTicket,
  changeTicketStatus,
  logTicketTime,
  createAgentTicket,
  updateAgentTicketFields,
  deleteAgentTicket,
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
    const { tickets, pagination } = await getAgentTickets(agentId, req.query);
    return res.status(200).json({
      success: true,
      data: tickets,
      pagination,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch personal tickets');
  }
};

/**
 * GET /my-work/active - List tickets in the Active queue for the acting agent (SCR-004)
 */
const listActiveTickets = async (req, res) => {
  try {
    const agentId = getAgentIdFromReq(req);
    const { tickets, pagination } = await getActiveTickets(agentId, req.query);
    return res.status(200).json({
      success: true,
      data: tickets,
      pagination,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch active tickets');
  }
};

/**
 * GET /my-work/pending - List tickets in the Pending queue for the acting agent (SCR-004)
 */
const listPendingTickets = async (req, res) => {
  try {
    const agentId = getAgentIdFromReq(req);
    const { tickets, pagination } = await getPendingTickets(agentId, req.query);
    return res.status(200).json({
      success: true,
      data: tickets,
      pagination,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch pending tickets');
  }
};

/**
 * GET /my-work/actioned - List tickets in the Actioned queue for the acting agent (SCR-004)
 */
const listActionedTickets = async (req, res) => {
  try {
    const agentId = getAgentIdFromReq(req);
    const { tickets, pagination } = await getActionedTickets(agentId, req.query);
    return res.status(200).json({
      success: true,
      data: tickets,
      pagination,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to fetch actioned tickets');
  }
};

/**
 * GET /my-work/on-hold - List tickets currently placed on hold (SCR-008, SCR-016)
 */
const listOnHoldTickets = async (req, res) => {
  try {
    const agentId = getAgentIdFromReq(req);
    const { tickets, pagination } = await getOnHoldTickets(agentId, req.query);
    return res.status(200).json({
      success: true,
      data: tickets,
      pagination,
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
    // BI-4: Pass agentId so the service can verify ownership.
    const agentId = getAgentIdFromReq(req);
    const ticket = await getTicket(req.params.ticketId, agentId);
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
    // BI-4: Pass agentId so the service can verify ownership before mutating.
    const agentId = getAgentIdFromReq(req);
    const updated = await changeTicketStatus(req.params.ticketId, req.body, agentId);
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
    // BI-4: Pass agentId so the service can verify ownership before mutating.
    const agentId = getAgentIdFromReq(req);
    const updated = await logTicketTime(req.params.ticketId, minutesSpent, agentId);
    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to log time on ticket');
  }
};

/**
 * POST /my-work - Create and assign a new ticket
 */
const createTicketHandler = async (req, res) => {
  try {
    const agentId = getAgentIdFromReq(req);
    const created = await createAgentTicket(req.body, agentId);
    return res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to create ticket');
  }
};

/**
 * PATCH /my-work/:ticketId - Update arbitrary ticket fields (priority, agent, summary)
 */
const updateTicketFieldsHandler = async (req, res) => {
  try {
    const agentId = getAgentIdFromReq(req);
    const updated = await updateAgentTicketFields(req.params.ticketId, req.body, agentId);
    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to update ticket fields');
  }
};

/**
 * DELETE /my-work/:ticketId - Delete a ticket
 */
const deleteTicketHandler = async (req, res) => {
  try {
    const agentId = getAgentIdFromReq(req);
    const result = await deleteAgentTicket(req.params.ticketId, agentId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return respondWithError(res, error, 'Failed to delete ticket');
  }
};

module.exports = {
  listMyWorkTickets,
  listActiveTickets,
  listPendingTickets,
  listActionedTickets,
  listOnHoldTickets,
  getTicketDetails,
  updateTicketStatusHandler,
  logTimeHandler,
  createTicketHandler,
  updateTicketFieldsHandler,
  deleteTicketHandler,
};
