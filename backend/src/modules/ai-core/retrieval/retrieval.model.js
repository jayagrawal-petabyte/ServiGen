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

/**
 * Retrieve knowledge documents belonging to an organisation.
 */
const getKnowledgeDocuments = async (organisationId) => {
  return knowledgeDocuments.filter(
    (document) => document.organisationId === organisationId
  );
};

/**
 * Find a knowledge document by ID.
 */
const getKnowledgeDocumentById = async (id) => {
  return (
    knowledgeDocuments.find((document) => document.id === id) || null
  );
};

module.exports = {
  getKnowledgeDocuments,
  getKnowledgeDocumentById,
};