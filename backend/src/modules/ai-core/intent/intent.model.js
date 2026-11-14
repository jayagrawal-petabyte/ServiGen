'use strict';

// Implementation Summary: Data model for AI Intent Classification.
// Performs whole-word keyword matching, accumulates match counts per rule,
// and selects the candidate with the highest (confidence × match density)
// score — eliminating the previous first-match ordering bias (OQ-05).

// ─── Intent Taxonomy ─────────────────────────────────────────────────────────
const intentCategories = [
  'Frontend',
  'Backend',
  'React Native',
  'UI/UX',
  'Cybersecurity',
  'BA',
  'Infrastructure',
];

const FALLBACK_CATEGORY = 'General Support';
const CONFIDENCE_THRESHOLD = 0.75;

// ─── Keyword Rule Corpus ──────────────────────────────────────────────────────
const intentRules = [
  {
    category: 'Frontend',
    confidence: 0.85,
    keywords: ['ui', 'button', 'frontend', 'html', 'css', 'dom', 'react', 'component', 'render'],
  },
  {
    category: 'Backend',
    confidence: 0.90,
    keywords: ['api', 'database', 'server', 'backend', 'endpoint', 'query', 'rest', 'graphql', 'orm', 'migration'],
  },
  {
    category: 'React Native',
    confidence: 0.88,
    keywords: ['mobile', 'react native', 'ios', 'android', 'expo', 'native module'],
  },
  {
    category: 'UI/UX',
    confidence: 0.82,
    keywords: ['design', 'layout', 'ux', 'wireframe', 'prototype', 'figma', 'accessibility', 'user experience'],
  },
  {
    category: 'Cybersecurity',
    confidence: 0.95,
    keywords: ['security', 'breach', 'vulnerability', 'exploit', 'malware', 'phishing', 'firewall', 'intrusion', 'pen test'],
  },
  {
    category: 'BA',
    confidence: 0.78,
    keywords: ['requirement', 'business', 'ba', 'stakeholder', 'acceptance criteria', 'user story', 'backlog', 'analysis'],
  },
  {
    category: 'Infrastructure',
    confidence: 0.90,
    keywords: ['cloud', 'aws', 'docker', 'kubernetes', 'k8s', 'linux', 'virtual machine', 'vm', 'router', 'dns', 'cluster', 'load balancer', 'nginx', 'devops', 'terraform'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Whole-word boundary match (BI-17).
 * Prevents substring collisions: "ui" inside "build", "ba" inside "database".
 */
const matchesKeyword = (text, keyword) => {
  const escaped = escapeRegex(keyword.trim().toLowerCase()).replace(/\s+/g, '\\s+');
  const pattern = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
  return pattern.test(text);
};

/**
 * Score a rule against the input text.
 * Score = baseConfidence × (matchedKeywords / totalKeywords)
 */
const scoreRule = (rule, text) => {
  const matchCount = rule.keywords.filter((kw) => matchesKeyword(text, kw)).length;
  const score = matchCount === 0 ? 0 : rule.confidence * (matchCount / rule.keywords.length);
  return { matchCount, score };
};

// ─── Core Classification ──────────────────────────────────────────────────────

const analyzeTextIntent = async (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Valid text input is required');
  }

  const trimmedText = text.replace(/[<>]/g, '').trim();
  if (trimmedText.length > 2000) {
    throw new Error('Text input must not exceed 2000 characters');
  }

  let bestRule = null;
  let bestScore = 0;
  let bestMatchCount = 0;

  for (const rule of intentRules) {
    const { matchCount, score } = scoreRule(rule, trimmedText);
    if (
      score > bestScore ||
      (score === bestScore && score > 0 && rule.confidence > (bestRule?.confidence ?? 0))
    ) {
      bestRule = rule;
      bestScore = score;
      bestMatchCount = matchCount;
    }
  }

  const detectedCategory = bestRule ? bestRule.category : FALLBACK_CATEGORY;
  const confidence = bestRule ? bestRule.confidence : 0.40;
  const meetsThreshold = bestRule !== null && confidence >= CONFIDENCE_THRESHOLD;

  return {
    category: meetsThreshold ? detectedCategory : FALLBACK_CATEGORY,
    originalDetectedCategory: detectedCategory,
    confidence,
    meetsThreshold,
    requiresRouting: true,
    matchedKeywords: bestMatchCount,
  };
};

module.exports = {
  intentCategories,
  CONFIDENCE_THRESHOLD,
  analyzeTextIntent,
};
