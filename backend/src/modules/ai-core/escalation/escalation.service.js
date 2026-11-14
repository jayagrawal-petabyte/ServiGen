const {
  evaluateEscalation,
  createEscalationHandoff,
  analyzeEscalationRisk,
  getTicketForEscalation,
} = require('./escalation.model');


const checkEscalation = async (requestData) => {
  if (
    !requestData ||
    typeof requestData !== 'object' ||
    Array.isArray(requestData)
  ) {
    throw new Error('Request data is required');
  }

  if (typeof requestData.resolved !== 'boolean') {
    throw new Error('resolved must be a boolean');
  }

  return evaluateEscalation(requestData);
};

const checkEscalationRisk = async (requestData) => {
  if (
    !requestData ||
    typeof requestData !== 'object' ||
    Array.isArray(requestData)
  ) {
    throw new Error('Risk analysis data is required');
  }

  return analyzeEscalationRisk(requestData);
};

const checkTicketEscalationRisk = async (
  ticketId,
  organisationId = null
) => {
  if (
    typeof ticketId !== 'string' ||
    !ticketId.trim()
  ) {
    throw new Error('Valid ticket ID is required');
  }

  const ticket = await getTicketForEscalation(
    ticketId.trim(),
    organisationId
  );

  if (!ticket) {
    const error = new Error('Ticket not found');
    error.code = 'TICKET_NOT_FOUND';
    throw error;
  }

  if (!Number.isInteger(ticket.slaTimeLeft)) {
    const error = new Error('Ticket SLA time is unavailable');
    error.code = 'TICKET_SLA_UNAVAILABLE';
    throw error;
  }

  const riskData = {
    summary: ticket.summary,
    description: ticket.description,
    slaTimeLeft: ticket.slaTimeLeft,
    ...(Number.isInteger(ticket.reopenCount)
      ? { reopenCount: ticket.reopenCount }
      : {}),
  };

  const riskResult = await analyzeEscalationRisk(riskData);

  return {
    ticketId: ticket.id,
    ...riskResult,
  };
};

const prepareTicketRiskHandoff = async (
  ticketId,
  organisationId,
  actorId,
  conversationId = null
) => {
  if (typeof ticketId !== 'string' || !ticketId.trim()) {
    throw new Error('Valid ticket ID is required');
  }

  if (typeof actorId !== 'string' || !actorId.trim()) {
    throw new Error('Authenticated actor ID is required');
  }

  if (
    conversationId !== null &&
    typeof conversationId !== 'string'
  ) {
    throw new Error('Conversation ID must be a string');
  }

  const ticket = await getTicketForEscalation(
    ticketId.trim(),
    organisationId
  );

  if (!ticket) {
    const error = new Error('Ticket not found');
    error.code = 'TICKET_NOT_FOUND';
    throw error;
  }

  if (!Number.isInteger(ticket.slaTimeLeft)) {
    const error = new Error('Ticket SLA time is unavailable');
    error.code = 'TICKET_SLA_UNAVAILABLE';
    throw error;
  }

  const riskData = {
    summary: ticket.summary,
    description: ticket.description,
    slaTimeLeft: ticket.slaTimeLeft,
    ...(Number.isInteger(ticket.reopenCount)
      ? { reopenCount: ticket.reopenCount }
      : {}),
  };

  const riskResult = await analyzeEscalationRisk(riskData);

  if (riskResult.recommendation !== 'ESCALATE_TO_TIER_2') {
    return {
      ticketId: ticket.id,
      ...riskResult,
      handoff: {
        required: false,
        targetTier: null,
        status: 'NOT_REQUIRED',
      },
    };
  }

  if (!ticket.requesterId) {
    const error = new Error('Ticket requester is unavailable');
    error.code = 'TICKET_REQUESTER_UNAVAILABLE';
    throw error;
  }

  return {
    ticketId: ticket.id,
    ...riskResult,
    handoff: {
      required: true,
      targetTier: 'TIER_2',
      actorId: actorId.trim(),
      requesterId: ticket.requesterId,
      summary: ticket.summary,
      conversationId,
      reason: riskResult.reasons.join('; '),
      status: 'READY_FOR_TIER_2_HANDOFF',
    },
  };
};

const prepareRiskHandoff = async (requestData) => {
  if (
    !requestData ||
    typeof requestData !== 'object' ||
    Array.isArray(requestData)
  ) {
    throw new Error('Risk handoff data is required');
  }

  const { actorId, requesterId, summary, conversationId } = requestData;

  if (typeof actorId !== 'string' || !actorId.trim()) {
    throw new Error('actorId is required');
  }

  if (typeof requesterId !== 'string' || !requesterId.trim()) {
    throw new Error('requesterId is required');
  }

  if (typeof summary !== 'string' || !summary.trim()) {
    throw new Error('Ticket summary is required');
  }

  if (
    conversationId !== undefined &&
    conversationId !== null &&
    typeof conversationId !== 'string'
  ) {
    throw new Error('conversationId must be a string');
  }

  const riskResult = await analyzeEscalationRisk(requestData);

  const requiresHandoff =
    riskResult.recommendation === 'ESCALATE_TO_TIER_2';

  const handoff = requiresHandoff
    ? {
        required: true,
        targetTier: 'TIER_2',
        actorId: actorId.trim(),
        requesterId: requesterId.trim(),
        summary: summary.trim(),
        conversationId: conversationId || null,
        reason: riskResult.reasons.join('; '),
        status: 'READY_FOR_TIER_2_HANDOFF',
      }
    : {
        required: false,
        targetTier: null,
        status: 'NOT_REQUIRED',
      };

  return {
    ...riskResult,
    handoff,
  };
};

const prepareHandoff = async (requestData) => {
  if (
    !requestData ||
    typeof requestData !== 'object' ||
    Array.isArray(requestData)
  ) {
    throw new Error('Request data is required');
  }

  if (!requestData.actorId) {
    throw new Error('actorId is required');
  }

  if (!requestData.requesterId) {
    throw new Error('requesterId is required');
  }

  if (!requestData.summary) {
    throw new Error('summary is required');
  }

  if (typeof requestData.resolved !== 'boolean') {
    throw new Error('resolved must be a boolean');
  }

  const escalationResult = await evaluateEscalation(requestData);

  if (!escalationResult.escalate) {
    return {
      handoff: false,
      ticketCreationRequested: false,
      decision: escalationResult.decision,
      reason: escalationResult.reason,
    };
  }

  return createEscalationHandoff({
    ...requestData,
    reason: escalationResult.reason,
  });
};

module.exports = {
  checkEscalation,
  prepareHandoff,
  checkEscalationRisk,
  checkTicketEscalationRisk,
  prepareRiskHandoff,
  prepareTicketRiskHandoff,
};