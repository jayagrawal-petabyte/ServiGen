/**
 * Temporary in-memory organisation user data.
 *
 * This is a placeholder until the shared Supabase/Prisma
 * database layer is added by the team.
 */

const users = [
  {
    id: 'user-001',
    username: 'agent001',
    site: 'Chennai',
    email: 'agent001@halohq.com',
    phone: '+91-9000000001',
    networkLogin: 'agent001',
    role: 'Service Agent',
    organisationId: 'org-001',
    active: true,
  },
  {
    id: 'user-002',
    username: 'user001',
    site: 'Chennai',
    email: 'user001@halohq.com',
    phone: '+91-9000000002',
    networkLogin: 'user001',
    role: 'Service User',
    organisationId: 'org-001',
    active: true,
  },
];

/**
 * Get users belonging to an organisation.
 */
const getOrganisationUsers = async (organisationId) => {
  return users.filter(
    (user) => user.organisationId === organisationId
  );
};

/**
 * Find a user by ID.
 */
const getUserById = async (id) => {
  return users.find((user) => user.id === id) || null;
};

module.exports = {
  getOrganisationUsers,
  getUserById,
};