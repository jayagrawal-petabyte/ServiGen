/**
 * Temporary in-memory knowledge base.
 *
 * This is a placeholder until the shared
 * Supabase/pgvector/Prisma data layer is available.
 */

const knowledgeDocuments = [
  {
    id: 'doc-001',
    title: 'Password Reset Procedure',
    content:
      'To reset a user password, verify the user identity and initiate the password reset procedure through the service management system.',
    category: 'Authentication',
    organisationId: 'org-001',
    tags: ['password', 'reset', 'login'],
  },
  {
    id: 'doc-002',
    title: 'VPN Troubleshooting Guide',
    content:
      'If a user cannot connect to the VPN, verify network connectivity, check the VPN client configuration, and confirm that the user account is active.',
    category: 'Network',
    organisationId: 'org-001',
    tags: ['vpn', 'network', 'connectivity'],
  },
  {
    id: 'doc-003',
    title: 'Laptop Incident Procedure',
    content:
      'For laptop incidents, collect the device details, identify the reported problem, check warranty information, and assign the incident to the appropriate support team.',
    category: 'Hardware',
    organisationId: 'org-001',
    tags: ['laptop', 'hardware', 'incident'],
  },
];

const db = require('../../../config/db');
const { formatVectorForPostgres } = require('../embedding/embedding.service');

/**
 * Perform semantic vector similarity search via Supabase pgvector.
 *
 * @param {string} organisationId - Target organisation ID
 * @param {number[]} queryVector - 384-dimensional query vector
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Array | null>} Array of matching documents with relevanceScore or null on fallback
 */
const searchKnowledgeVector = async (organisationId, queryVector, limit = 5) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const vectorLiteral = formatVectorForPostgres(queryVector);
      if (!vectorLiteral) return null;

      const results = await db.$queryRaw`
        SELECT id, title, content, category, "organisationId",
               1 - ("embedding" <=> ${vectorLiteral}::vector) AS "relevanceScore"
        FROM "knowledge_articles"
        WHERE ("organisationId" = ${organisationId} OR "organisationId" IS NULL)
          AND "status" = 'Published'
          AND "embedding" IS NOT NULL
        ORDER BY "embedding" <=> ${vectorLiteral}::vector
        LIMIT ${limit};
      `;

      if (Array.isArray(results) && results.length > 0) {
        return results.map((r) => ({
          id: r.id,
          title: r.title,
          content: r.content,
          category: r.category || 'General',
          organisationId: r.organisationId || organisationId,
          tags: [r.category ? r.category.toLowerCase() : 'general'],
          relevanceScore: Number(r.relevanceScore) || 0,
        }));
      }
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        console.warn('[VectorSearch] pgvector query fell back to keyword search:', _err.message);
      }
    }
  }
  return null;
};

/**
 * Retrieve knowledge documents belonging to an organisation.
 */
const getKnowledgeDocuments = async (organisationId = null) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const where = organisationId
        ? { OR: [{ organisationId }, { organisationId: null }] }
        : {};
      const articles = await db.knowledgeArticle.findMany({
        where,
        take: 50,
      });
      if (articles.length > 0) {
        return articles.map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          category: a.category || 'General',
          organisationId: a.organisationId || organisationId || 'org-001',
          tags: [a.category ? a.category.toLowerCase() : 'general'],
        }));
      }
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return knowledgeDocuments.filter(
    (document) => !organisationId || document.organisationId === organisationId
  );
};

/**
 * Find a knowledge document by ID.
 */
const getKnowledgeDocumentById = async (id) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const a = await db.knowledgeArticle.findUnique({
        where: { id },
      });
      if (a) {
        return {
          id: a.id,
          title: a.title,
          content: a.content,
          category: a.category || 'General',
          organisationId: a.organisationId || 'org-001',
          tags: [a.category ? a.category.toLowerCase() : 'general'],
        };
      }
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return (
    knowledgeDocuments.find((document) => document.id === id) || null
  );
};

module.exports = {
  getKnowledgeDocuments,
  getKnowledgeDocumentById,
  searchKnowledgeVector,
};