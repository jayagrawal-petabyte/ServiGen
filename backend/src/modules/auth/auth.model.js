/**
 * Temporary in-memory authentication data.
 *
 * This is a placeholder until the shared Supabase/Prisma
 * database layer is added by the team.
 */

const users = [
  {
    id: 'user-001',
    username: 'agent001',
    password: 'Password@123',
    firstName: 'Demo',
    role: 'Service Agent',
    organisationId: 'org-001',
    active: true,
  },
  {
    id: 'user-002',
    username: 'user001',
    password: 'Password@123',
    firstName: 'Test',
    role: 'Service User',
    organisationId: 'org-001',
    active: true,
  },
];

/**
 * Find a user by username.
 */
const findUserByUsername = async (username) => {
  return (
    users.find(
      (user) =>
        user.username.toLowerCase() === username.trim().toLowerCase()
    ) || null
  );
};

/**
 * Find a user by ID.
 */
const findUserById = async (id) => {
  return users.find((user) => user.id === id) || null;
};

module.exports = {
  findUserByUsername,
  findUserById,
};