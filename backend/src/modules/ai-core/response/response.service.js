/**
 * Structures the retrieved knowledge and intent into a consistent response payload.
 *
 * @param {string} query - The original user query
 * @param {string} intent - The classified intent (e.g., 'service_request', 'troubleshoot')
 * @param {Array} knowledge - Array of retrieved context objects
 * @param {Array} recommendations - Array of recommended actions or items
 * @returns {Object} Structured response payload
 */
const structureResponse = (query, intent, knowledge, recommendations) => {
  // Generate a formatted message based on intent
  let message = '';
  if (intent === 'service_request') {
    message = `Based on your request "${query}", here are the recommended services you can apply for.`;
  } else if (intent === 'troubleshooting') {
    message = `I found some helpful articles in our knowledge base regarding "${query}". Please check the recommended steps.`;
  } else {
    message = `Here is what I found for "${query}".`;
  }

  // Structure the final payload
  return {
    type: intent,
    message,
    knowledge: knowledge.map(k => ({
      id: k.id,
      title: k.title,
      summary: k.content || k.summary
    })),
    recommendations: recommendations.map(r => ({
      action: r.action,
      targetId: r.targetId,
      description: r.description
    })),
    metadata: {
      processedAt: new Date().toISOString()
    }
  };
};

module.exports = {
  structureResponse
};
