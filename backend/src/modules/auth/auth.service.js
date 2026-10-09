const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const {
  findUserByUsername,
  findUserById,
} = require('./auth.model');
const { generateToken } = require('../../shared');

const safePasswordCompare = async (supplied, stored) => {
  if (typeof supplied !== 'string' || typeof stored !== 'string') return false;
  if (/^\$2[aby]\$\d{2}\$/.test(stored)) {
    try {
      return await bcrypt.compare(supplied, stored);
    } catch {
      return false;
    }
  }
  const suppliedBuf = Buffer.from(supplied);
  const storedBuf = Buffer.from(stored);
  if (suppliedBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(suppliedBuf, storedBuf);
};

/**
 * Authenticate a user using username and password.
 *
 * Temporary implementation:
 * Uses the in-memory model until the shared
 * Supabase/Prisma layer is available.
 */
const login = async (username, password) => {
  if (typeof username !== 'string' || !username.trim()) {
    const error = new Error('Username must be a non-empty string');
    error.statusCode = 400;
    throw error;
  }

  if (typeof password !== 'string' || !password) {
    const error = new Error('Password is required');
    error.statusCode = 400;
    throw error;
  }

  const user = await findUserByUsername(username);
  const isPasswordValid = user && user.active && (await safePasswordCompare(password, user.password));

  if (!user || !user.active || !isPasswordValid) {
    const error = new Error('Invalid username or password');
    error.statusCode = 401;
    throw error;
  }

  // Never return the password to the controller/client.
  const { password: _, ...safeUser } = user;

  const token = generateToken({
    id: safeUser.id,
    role: safeUser.role,
    organisationId: safeUser.organisationId,
  });

  return {
    ...safeUser,
    token,
  };
};

/**
 * Load the currently authenticated user's session.
 *
 * Temporary implementation:
 * The user ID is supplied by the client/session layer.
 */
const getSession = async (userId) => {
  if (!userId) {
    const error = new Error('User ID is required');
    error.statusCode = 401;
    throw error;
  }

  const user = await findUserById(userId);

  if (!user || !user.active) {
    const error = new Error('Invalid or expired session');
    error.statusCode = 401;
    throw error;
  }

  const { password: _, ...safeUser } = user;

  return safeUser;
};

module.exports = {
  login,
  getSession,
};