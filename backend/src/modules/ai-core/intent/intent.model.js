// Implementation Summary: Data model for AI Intent Classification, containing keyword-based analysis logic to determine user intent categories and confidence scores.

// Here I used mock data for intent categories based on FRD routing examples, as the final list of intents is still open (OQ-05).
const intentCategories = [
  'Frontend',
  'Backend',
  'React Native',
  'UI/UX',
  'Cybersecurity',
  'BA',
];

const fallbackCategory = 'General Support';
const defaultConfidenceThreshold = 0.75;

// Pre-defined mapping for intent keywords to optimize execution and avoid large if-else chains
const intentRules = [
  { keywords: ['ui', 'button', 'frontend'], category: 'Frontend', confidence: 0.85 },
  { keywords: ['api', 'database', 'server', 'backend'], category: 'Backend', confidence: 0.90 },
  { keywords: ['mobile', 'app', 'react native'], category: 'React Native', confidence: 0.88 },
  { keywords: ['design', 'layout', 'ux'], category: 'UI/UX', confidence: 0.82 },
  { keywords: ['security', 'breach', 'vulnerability'], category: 'Cybersecurity', confidence: 0.95 },
  { keywords: ['requirement', 'business', 'ba'], category: 'BA', confidence: 0.78 },
];

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const matchesKeyword = (text, keyword) => {
  const escaped = escapeRegex(keyword.trim().toLowerCase()).replace(/\s+/g, '\\s+');
  const pattern = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
  return pattern.test(text);
};

// Simulates intent classification for a given text input.
const analyzeTextIntent = async (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Valid text input is required');
  }

  const trimmedText = text.trim();
  if (trimmedText.length > 2000) {
    throw new Error('Text input must not exceed 2000 characters');
  }

  let detectedCategory = fallbackCategory;
  let confidence = 0.40;

  // BI-17: Whole-word boundary matching prevents substring collisions (e.g. "ui" inside "build")
  const matchedRule = intentRules.find(rule =>
    rule.keywords.some(keyword => matchesKeyword(trimmedText, keyword))
  );

  if (matchedRule) {
    detectedCategory = matchedRule.category;
    confidence = matchedRule.confidence;
  }

  const meetsThreshold = confidence >= defaultConfidenceThreshold;

  return {
    category: meetsThreshold ? detectedCategory : fallbackCategory,
    originalDetectedCategory: detectedCategory,
    confidence,
    meetsThreshold,
    requiresRouting: true,
  };
};

module.exports = {
  intentCategories,
  analyzeTextIntent,
};
