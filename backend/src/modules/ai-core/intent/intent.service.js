// Implementation Summary: Service layer for AI Intent Classification, performing request routing logic based on the intent category threshold.
const { analyzeTextIntent } = require('./intent.model');

//Core business logic for intent classification. Validates request data and determines routing based on confidence.

const classifyIntent = async (requestData) => {
  // Validate that requestData is an object and not an array
  if (!requestData || typeof requestData !== 'object' || Array.isArray(requestData)) {
    throw new Error('Request data is required');
  }

  const { text } = requestData;
  
  // Validate that text input is present and is a non-empty string
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Text input is required for intent classification');
  }

  // Get raw classification results from the model layer
  const result = await analyzeTextIntent(text);

  // Here I added a temporary workaround for the routing decision. This should eventually connect to Farjan's escalation logic and user profile data.
  const routeTo = result.meetsThreshold ? result.category : 'Human Escalation';

  return {
    ...result,
    routingDecision: routeTo,
  };
};

module.exports = {
  classifyIntent,
};
