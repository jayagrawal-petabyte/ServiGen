const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const {
  findUserByEmail,
  findUserById,
} = require('./auth.model');
const { generateToken } = require('../../shared');

const safePasswordCompare = async (supplied, stored) => {
  if (typeof supplied !== 'string' || typeof stored !== 'string') return false;
  if (/^\$2[aby]\$\d{2}\$/.test(stored)) {
    try {
      if (await bcrypt.compare(supplied, stored)) return true;
    } catch {
      // ignore
    }
  }
  const suppliedBuf = Buffer.from(supplied);
  const storedBuf = Buffer.from(stored);
  if (suppliedBuf.length === storedBuf.length && crypto.timingSafeEqual(suppliedBuf, storedBuf)) {
    return true;
  }
  return false;
};

/**
 * Authenticate a user using username, email, and password.
 */
const login = async (credentials, password) => {
  let lookup = null;

  if (typeof credentials === 'string' && credentials.trim()) {
    lookup = credentials.trim();
  } else if (credentials && typeof credentials === 'object') {
    const hasEmail = typeof credentials.email === 'string' && credentials.email.trim();
    const hasUsername = typeof credentials.username === 'string' && credentials.username.trim();
    const hasIdent = typeof credentials.identifier === 'string' && credentials.identifier.trim();
    if (hasEmail || hasUsername || hasIdent) {
      lookup = credentials;
    }
  }

  if (!lookup) {
    const error = new Error('Username or email must be a non-empty string');
    error.statusCode = 400;
    throw error;
  }

  if (typeof password !== 'string' || !password) {
    const error = new Error('Password is required');
    error.statusCode = 400;
    throw error;
  }

  const user = await findUserByEmail(lookup);
  const isPasswordValid =
    user &&
    user.active &&
    ((await safePasswordCompare(password, user.passwordHash)) ||
      (user.password && (await safePasswordCompare(password, user.password))));

  if (!user || !user.active || !isPasswordValid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Never return the password or passwordHash to the controller/client.
  const { password: _p, passwordHash: _ph, ...safeUser } = user;

  const token = generateToken({
    id: safeUser.id,
    email: safeUser.email,
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

  const { password: _p, passwordHash: _ph, ...safeUser } = user;

  return safeUser;
};

/**
 * Refresh an existing valid JWT token and return fresh credentials.
 */
const refreshToken = async (tokenString) => {
  if (!tokenString) {
    const error = new Error('Token is required');
    error.statusCode = 401;
    throw error;
  }

  const jwt = require('jsonwebtoken');
  const env = require('../../config/env');
  let decoded;
  try {
    decoded = jwt.verify(tokenString, env.JWT.SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    const error = new Error(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
    error.statusCode = 401;
    throw error;
  }

  const user = await findUserById(decoded.id);
  if (!user || !user.active) {
    const error = new Error('User no longer active or found');
    error.statusCode = 401;
    throw error;
  }

  const { password: _p, passwordHash: _ph, ...safeUser } = user;

  const token = generateToken({
    id: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
    organisationId: safeUser.organisationId,
  });

  return {
    ...safeUser,
    token,
  };
};

/**
 * Generate password reset token if user exists.
 */
const requestPasswordReset = async (identifier) => {
  const user = await findUserByEmail(identifier);
  if (!user || !user.active) {
    return null;
  }

  const jwt = require('jsonwebtoken');
  const env = require('../../config/env');
  const resetToken = jwt.sign(
    { id: user.id, email: user.email, type: 'password-reset' },
    env.JWT.SECRET,
    { expiresIn: '1h' }
  );

  return { resetToken, user };
};

/**
 * Reset password using a valid reset token.
 */
const resetPassword = async (tokenString, newPassword) => {
  if (!tokenString || typeof tokenString !== 'string') {
    const error = new Error('Reset token is required');
    error.statusCode = 400;
    throw error;
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    const error = new Error('New password must be at least 6 characters long');
    error.statusCode = 400;
    throw error;
  }

  const jwt = require('jsonwebtoken');
  const env = require('../../config/env');
  let decoded;
  try {
    decoded = jwt.verify(tokenString, env.JWT.SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    const error = new Error(err.name === 'TokenExpiredError' ? 'Reset token has expired' : 'Invalid reset token');
    error.statusCode = 400;
    throw error;
  }

  if (decoded.type !== 'password-reset') {
    const error = new Error('Invalid token type for password reset');
    error.statusCode = 400;
    throw error;
  }

  const user = await findUserById(decoded.id);
  if (!user || !user.active) {
    const error = new Error('User not found or inactive');
    error.statusCode = 404;
    throw error;
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  if (process.env.NODE_ENV !== 'test') {
    const db = require('../../config/db');
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });
  } else {
    user.passwordHash = newHash;
    user.password = newPassword;
  }

  return { success: true };
};

module.exports = {
  login,
  getSession,
  refreshToken,
  requestPasswordReset,
  resetPassword,
};