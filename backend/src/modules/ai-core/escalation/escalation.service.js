const {
  evaluateEscalation,
  createEscalationHandoff,
} = require('./escalation.model');

const checkEscalation = async (requestData) => {
  if (!requestData || typeof requestData !== 'object') {
    throw new Error('Request data is required');
  }

  if (typeof requestData.resolved !== 'boolean') {
    throw new Error('resolved must be a boolean');
  }

  return await evaluateEscalation(requestData);
};

const prepareHandoff = async (requestData) => {
  if (!requestData || typeof requestData !== 'object') {
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

  return await createEscalationHandoff({
    ...requestData,
    reason: escalationResult.reason,
  });
};

module.exports = {
  checkEscalation,
  prepareHandoff,
};