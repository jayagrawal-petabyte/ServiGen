'use strict';

// Implementation Summary: Data model for AI Intent Classification.
// Performs whole-word keyword matching, accumulates match counts per rule,
// and selects the candidate with the highest (confidence × match density)
// score — eliminating the previous first-match ordering bias (OQ-05).

// ─── Intent Taxonomy ─────────────────────────────────────────────────────────
// Categories aligned with FRD routing targets (OQ-05).
// Final list is pending PM confirmation; keyword corpus is extensible.
const intentCategories = [
  'Frontend',
  'Backend',
  'React Native',
  'UI/UX',
  'Cybersecurity',
  'BA',
];

const FALLBACK_CATEGORY = 'General Support';
const CONFIDENCE_THRESHOLD = 0.75;

// ─── Keyword Rule Corpus ──────────────────────────────────────────────────────
// Each rule defines: base confidence when ANY keyword matches, and the full
// keyword list. Scoring uses: score = confidence × (matchCount / keywordCount)
// so a rule that matches more of its own keywords ranks higher than a rule
// that matches fewer keywords of a nominally higher-confidence category.
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
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Whole-word boundary match (BI-17).
 * Prevents substring collisions: "ui" inside "build", "ba" inside "database".
 *
 * @param {string} text     Normalised input text
 * @param {string} keyword  Keyword to test (may contain spaces for phrases)
 * @returns {boolean}
 */
const matchesKeyword = (text, keyword) => {
  const escaped = escapeRegex(keyword.trim().toLowerCase()).replace(/\s+/g, '\\s+');
  const pattern = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
  return pattern.test(text);
};

/**
 * Score a rule against the input text.
 *
 * Score = baseConfidence × (matchedKeywords / totalKeywords)
 *
 * Rationale: A rule that matches 3 of its 5 keywords outranks one that
 * matches 1 of 1, even if the latter has a higher base confidence.
 * This eliminates ordering-bias from intentRules.find().
 *
 * @param {object} rule   An entry from intentRules
 * @param {string} text   Normalised input text
 * @returns {{ matchCount: number, score: number }}
 */
const scoreRule = (rule, text) => {
  const matchCount = rule.keywords.filter((kw) => matchesKeyword(text, kw)).length;
  const score = matchCount === 0 ? 0 : rule.confidence * (matchCount / rule.keywords.length);
  return { matchCount, score };
};

// ─── Core Classification ──────────────────────────────────────────────────────

/**
 * Classify the intent of a text input.
 *
 * BUG FIX (Rule Ordering Bias):
 *   Previously: intentRules.find() returned the FIRST rule with ANY match.
 *   A prompt like "security vulnerability in the backend API" would resolve
 *   to 'Backend' simply because its rule appears before 'Cybersecurity' in
 *   the array — despite Cybersecurity having the highest base confidence.
 *
 *   Now: All rules are scored, and the rule with the highest
 *   (confidence × match-density) score wins. Ties fall to higher base
 *   confidence. No result (all scores = 0) falls back to FALLBACK_CATEGORY.
 *
 * @param {string} text  Raw (already-validated) user input text
 * @returns {Promise<{
 *   category: string,
 *   originalDetectedCategory: string,
 *   confidence: number,
 *   meetsThreshold: boolean,
 *   requiresRouting: boolean,
 *   matchedKeywords: number,
 * }>}
 */
const analyzeTextIntent = async (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Valid text input is required');
  }

  const trimmedText = text.trim();
  if (trimmedText.length > 2000) {
    throw new Error('Text input must not exceed 2000 characters');
  }

  // Score every rule; select the highest-scoring candidate.
  let bestRule = null;
  let bestScore = 0;
  let bestMatchCount = 0;

  for (const rule of intentRules) {
    const { matchCount, score } = scoreRule(rule, trimmedText);
    // Prefer strictly higher score; on exact tie prefer higher base confidence.
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
