const {
  getKnowledgeDocuments,
  getKnowledgeDocumentById,
  searchKnowledgeVector,
} = require('./retrieval.model');
const { generateEmbedding } = require('../embedding/embedding.service');

/**
 * Calculate a simple keyword relevance score.
 *
 * Used as a fallback when pgvector is unpopulated or offline.
 */
const calculateRelevance = (document, query) => {
  const normalizedQuery = typeof query === 'string' ? query.trim().slice(0, 500).toLowerCase() : '';
  const tags = Array.isArray(document?.tags) ? document.tags : [];

  const searchableText = [
    document?.title || '',
    document?.content || '',
    document?.category || '',
    ...tags,
  ]
    .join(' ')
    .toLowerCase();

  const queryWords = normalizedQuery
    .split(/\s+/)
    .filter(Boolean);

  if (queryWords.length === 0) {
    return 0;
  }

  const matches = queryWords.filter((word) =>
    searchableText.includes(word)
  );

  return matches.length / queryWords.length;
};

/**
 * Search organisational knowledge via pgvector semantic search with keyword fallback.
 */
const searchKnowledge = async (
  organisationId,
  query,
  limit = 5
) => {
  if (!organisationId || typeof organisationId !== 'string') {
    const error = new Error('Organisation ID is required');
    error.statusCode = 400;
    throw error;
  }

  if (!query || typeof query !== 'string' || !query.trim()) {
    const error = new Error('Search query is required');
    error.statusCode = 400;
    throw error;
  }

  if (
    typeof limit !== 'number' ||
    !Number.isInteger(limit) ||
    limit <= 0
  ) {
    const error = new Error('Limit must be a positive integer');
    error.statusCode = 400;
    throw error;
  }

  // 1. Attempt dense vector search via Supabase pgvector
  try {
    const queryVector = await generateEmbedding(query);
    if (queryVector) {
      const vectorResults = await searchKnowledgeVector(
        organisationId,
        queryVector,
        limit
      );
      if (Array.isArray(vectorResults) && vectorResults.length > 0) {
        return vectorResults;
      }
    }
  } catch (_vecErr) {
    // Vector search failed or unpopulated, fallback to keyword search
  }

  // 2. Deterministic keyword matching fallback
  const documents = await getKnowledgeDocuments(
    organisationId
  );

  return documents
    .map((document) => ({
      ...document,
      relevanceScore: calculateRelevance(document, query),
    }))
    .filter((document) => document.relevanceScore > 0)
    .sort(
      (a, b) => b.relevanceScore - a.relevanceScore
    )
    .slice(0, limit);
};

/**
 * Get a specific knowledge document.
 */
const getKnowledge = async (
  organisationId,
  documentId
) => {
  if (!organisationId || typeof organisationId !== 'string') {
    const error = new Error('Organisation ID is required');
    error.statusCode = 400;
    throw error;
  }

  if (!documentId || typeof documentId !== 'string') {
    const error = new Error('Document ID is required');
    error.statusCode = 400;
    throw error;
  }

  const document = await getKnowledgeDocumentById(
    documentId
  );

  if (
    !document ||
    document.organisationId !== organisationId
  ) {
    const error = new Error('Knowledge document not found');
    error.statusCode = 404;
    throw error;
  }

  return document;
};

module.exports = {
  searchKnowledge,
  getKnowledge,
};