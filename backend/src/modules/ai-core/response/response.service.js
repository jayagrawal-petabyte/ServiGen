'use strict';

const sanitizeInputText = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim();
};

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

/**
 * Summarizes long ticket activity, work notes, and customer conversation threads.
 */
const summarizeTicketTimeline = (payload = {}) => {
  const { ticketId, notes, conversation, description, text } = payload;
  const rawInput = text || description || (Array.isArray(notes) ? notes.map(n => n.content || n.message || n).join('\n') : '') || (Array.isArray(conversation) ? conversation.map(c => c.message || c.text || c).join('\n') : '');

  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    const err = new Error('Text or conversation content is required for summarisation');
    err.statusCode = 400;
    throw err;
  }

  if (rawInput.length > 20000) {
    const err = new Error('Input text must not exceed 20000 characters');
    err.statusCode = 400;
    throw err;
  }

  const cleanInput = sanitizeInputText(rawInput);
  const lower = cleanInput.toLowerCase();

  // Detect urgency
  const isUrgent = /(outage|down|critical|blocker|breach|p1|emergency|sev-1)/i.test(cleanInput);
  const urgencyLevel = isUrgent ? 'High' : 'Normal';

  // Extract key points
  const sentences = cleanInput.split(/[.\n]+/).map(s => s.trim()).filter(Boolean);
  const keyPoints = sentences.slice(0, 4);

  let currentStatus = 'In Progress';
  if (lower.includes('resolved') || lower.includes('completed') || lower.includes('fixed')) {
    currentStatus = 'Pending Verification';
  } else if (lower.includes('waiting for customer') || lower.includes('on hold')) {
    currentStatus = 'On Hold';
  }

  let recommendedAction = 'Continue investigation and monitor response times';
  if (isUrgent) {
    recommendedAction = 'Escalate to Major Incident commander or Tier 2 support team';
  } else if (lower.includes('access') || lower.includes('permission')) {
    recommendedAction = 'Verify IAM permissions and assign to Access Management';
  } else if (lower.includes('laptop') || lower.includes('hardware')) {
    recommendedAction = 'Check asset inventory and schedule hardware replacement';
  }

  return {
    ticketId: ticketId || null,
    summary: sentences[0] || 'Ticket discussion thread analyzed.',
    keyPoints: keyPoints.length > 0 ? keyPoints : ['Initial inquiry submitted'],
    currentStatus,
    urgencyLevel,
    recommendedAction,
    analyzedLength: cleanInput.length,
    generatedAt: new Date().toISOString()
  };
};

/**
 * Generates contextual resolution recommendations based on incident symptoms and ITIL category.
 */
const generateResolutionSuggestions = (payload = {}) => {
  const { ticketId, summary, category, symptoms } = payload;
  const rawContext = [summary, symptoms].filter(Boolean).join(' ');

  if (!rawContext || typeof rawContext !== 'string' || !rawContext.trim()) {
    const err = new Error('Summary or symptoms are required to generate resolution suggestions');
    err.statusCode = 400;
    throw err;
  }

  if (rawContext.length > 5000) {
    const err = new Error('Context must not exceed 5000 characters');
    err.statusCode = 400;
    throw err;
  }

  const cleanContext = sanitizeInputText(rawContext);
  const lower = cleanContext.toLowerCase();

  const suggestions = [];
  const relevantArticles = [];

  if (lower.includes('vpn') || lower.includes('network') || lower.includes('connect')) {
    suggestions.push(
      { step: 1, action: 'Verify VPN certificate and MFA token status in Okta/Entra' },
      { step: 2, action: 'Restart local DNS cache (ipconfig /flushdns) and retry' },
      { step: 3, action: 'Check firewall egress on UDP 443 / IPsec ports' }
    );
    relevantArticles.push(
      { id: 'KB-NET-101', title: 'Remote Access VPN Troubleshooting Guide' }
    );
  } else if (lower.includes('password') || lower.includes('locked') || lower.includes('login')) {
    suggestions.push(
      { step: 1, action: 'Trigger self-service password reset email' },
      { step: 2, action: 'Verify account is not temporarily locked in directory service' }
    );
    relevantArticles.push(
      { id: 'KB-AUTH-202', title: 'Account Lockout Resolution & Policy Guide' }
    );
  } else if (lower.includes('database') || lower.includes('postgres') || lower.includes('sql') || lower.includes('timeout')) {
    suggestions.push(
      { step: 1, action: 'Inspect connection pooler utilization and active transaction count' },
      { step: 2, action: 'Check for long-running locks or blocked queries' },
      { step: 3, action: 'Verify PostgreSQL extensions and search_path configuration' }
    );
    relevantArticles.push(
      { id: 'KB-DB-303', title: 'Database Pooler Latency & TLS Connection Checklist' }
    );
  } else {
    suggestions.push(
      { step: 1, action: 'Collect application log traces and reproduction steps' },
      { step: 2, action: 'Verify user permissions and tenant assignment' },
      { step: 3, action: 'Search knowledge base for matching error codes' }
    );
    relevantArticles.push(
      { id: 'KB-GEN-001', title: 'Standard Incident Triage & Resolution Procedure' }
    );
  }

  return {
    ticketId: ticketId || null,
    category: category || 'General',
    confidence: 0.88,
    suggestions,
    relevantArticles,
    generatedAt: new Date().toISOString()
  };
};

module.exports = {
  structureResponse,
  summarizeTicketTimeline,
  generateResolutionSuggestions,
  sanitizeInputText,
};
