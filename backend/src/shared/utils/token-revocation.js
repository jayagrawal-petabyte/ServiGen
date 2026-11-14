'use strict';

/**
 * In-memory token revocation store (blacklist) for revoked JWT tokens.
 * Tracks revoked tokens with TTL for single-use token rotation and server-side logout.
 */
const revokedTokens = new Map();

/**
 * Add a token to the revoked tokens store.
 * @param {string} token - The raw JWT token string
 * @param {number} ttlMs - Time to live in milliseconds (defaults to 7 days)
 */
const revokeToken = (token, ttlMs = 7 * 24 * 60 * 60 * 1000) => {
  if (typeof token !== 'string' || !token.trim()) return;
  const clean = token.trim();
  const expiresAt = Date.now() + ttlMs;
  revokedTokens.set(clean, expiresAt);
};

/**
 * Check whether a token has been revoked.
 * Automatically evicts expired revocation records.
 * @param {string} token - The raw JWT token string
 * @returns {boolean}
 */
const isTokenRevoked = (token) => {
  if (typeof token !== 'string' || !token.trim()) return false;
  const clean = token.trim();
  const expiresAt = revokedTokens.get(clean);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    revokedTokens.delete(clean);
    return false;
  }
  return true;
};

/**
 * Clear all revoked tokens (used in testing).
 */
const clearRevokedTokens = () => {
  revokedTokens.clear();
};

module.exports = {
  revokeToken,
  isTokenRevoked,
  clearRevokedTokens,
};

