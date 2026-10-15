const {
  getOrganisationUsers,
  getUserById,
} = require('./organisations.model');

/**
 * Get users belonging to an organisation.
 *
 * Temporary implementation:
 * Uses the in-memory model until the shared
 * Supabase/Prisma layer is available.
 */
const getUsers = async (organisationId) => {
  if (!organisationId || typeof organisationId !== 'string') {
    const error = new Error('Organisation ID is required');
    error.statusCode = 400;
    throw error;
  }

  const users = await getOrganisationUsers(organisationId);

  return users.map(({ id, username, site, email, phone, networkLogin, role }) => ({
    id,
    username,
    site,
    email,
    phone,
    networkLogin,
    role,
  }));
};

/**
 * Get a specific organisation user.
 */
const getUser = async (organisationId, userId) => {
  if (!organisationId || typeof organisationId !== 'string') {
    const error = new Error('Organisation ID is required');
    error.statusCode = 400;
    throw error;
  }

  if (!userId || typeof userId !== 'string') {
    const error = new Error('User ID is required');
    error.statusCode = 400;
    throw error;
  }

  const user = await getUserById(userId);

  if (!user || user.organisationId !== organisationId) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const {
    id,
    username,
    site,
    email,
    phone,
    networkLogin,
    role,
  } = user;

  return {
    id,
    username,
    site,
    email,
    phone,
    networkLogin,
    role,
  };
};

module.exports = {
  getUsers,
  getUser,
};