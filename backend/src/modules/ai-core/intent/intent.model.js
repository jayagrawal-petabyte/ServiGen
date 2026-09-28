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

// Simulates intent classification for a given text input.

const analyzeTextIntent = async (text) => {
  // Here I implemented a temporary workaround with keyword matching to simulate AI intent classification, since the Bedrock Titan integration is pending.
  if (!text || typeof text !== 'string') {
    throw new Error('Valid text input is required');
  }

  const lowerText = text.toLowerCase();

  let detectedCategory = fallbackCategory;
  let confidence = 0.40;

  // Optimized keyword matching using array iteration
  const matchedRule = intentRules.find(rule => 
    rule.keywords.some(keyword => lowerText.includes(keyword))
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
