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
  // BI-11: Validate collection types before any .map() call.
  //        Non-array knowledge or recommendations → INVALID_COLLECTION (400).
  if (!Array.isArray(knowledge)) {
    const err = new Error('"knowledge" must be an array');
    err.code = 'INVALID_COLLECTION';
    throw err;
  }
  if (!Array.isArray(recommendations)) {
    const err = new Error('"recommendations" must be an array');
    err.code = 'INVALID_COLLECTION';
    throw err;
  }

  // Validate individual entries are plain objects (not null, arrays, or primitives)
  for (const entry of knowledge) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      const err = new Error('Each knowledge entry must be a plain object');
      err.code = 'INVALID_COLLECTION';
      throw err;
    }
  }
  for (const entry of recommendations) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      const err = new Error('Each recommendations entry must be a plain object');
      err.code = 'INVALID_COLLECTION';
      throw err;
    }
  }

  // Generate a formatted message based on intent and result availability
  let message = '';
  const hasResults = knowledge.length > 0 || recommendations.length > 0;

  if (!hasResults) {
    // CR: Use a no-results message when the corresponding arrays are empty
    message = `No results were found for "${query}".`;
  } else if (intent === 'service_request') {
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
