const escalationRules = {
  escalateWhenUnresolved: true,
  escalateWhenHumanHelpRequested: true,
};

const evaluateEscalation = async (requestData) => {
  const {
    resolved,
    humanHelpRequested = false,
  } = requestData;

  if (resolved === true) {
    return {
      escalate: false,
      decision: 'RESOLVED',
      reason: 'AI resolved the issue',
    };
  }

  if (
    humanHelpRequested === true &&
    escalationRules.escalateWhenHumanHelpRequested
  ) {
    return {
      escalate: true,
      decision: 'ESCALATE',
      reason: 'User requested human assistance',
    };
  }

  if (
    resolved === false &&
    escalationRules.escalateWhenUnresolved
  ) {
    return {
      escalate: true,
      decision: 'ESCALATE',
      reason: 'AI could not resolve the issue',
    };
  }

  return {
    escalate: false,
    decision: 'NO_ACTION',
    reason: 'No escalation condition matched',
  };
};

const createEscalationHandoff = async (requestData) => {
  return {
    handoff: true,
    ticketCreationRequested: true,

    actorId: requestData.actorId,
    requesterId: requestData.requesterId,
    userId: requestData.requesterId,

    request: {
      summary: requestData.summary,
      conversationId: requestData.conversationId || null,
      reason: requestData.reason,
    },

    status: 'READY_FOR_TICKET_CREATION',
  };
};

module.exports = {
  evaluateEscalation,
  createEscalationHandoff,
};