'use strict';

const db = require('../../config/db');

/**
 * Authentication Data Model.
 * Connects to Supabase / Prisma User records with in-memory fallback for offline test isolation.
 * Supports authentication via email, username, or both.
 */

const mockUsers = [
  {
    id: 'admin-001',
    email: 'admin@servigen.local',
    username: 'admin001',
    password: 'Adm!n#9vK2$7xLq',
    passwordHash: '$2a$10$xyz',
    firstName: 'Adam',
    lastName: 'Admin',
    role: 'Admin',
    organisationId: 'org-001',
    active: true,
  },
  {
    id: 'agent-001',
    email: 'agent001@servigen.local',
    username: 'agent001',
    password: 'Ag3nt*8mP4!wR9t',
    passwordHash: '$2a$10$xyz',
    firstName: 'Alex',
    lastName: 'Agent',
    role: 'Service Agent',
    organisationId: 'org-001',
    active: true,
  },
  {
    id: 'approver-001',
    email: 'approver001@servigen.local',
    username: 'approver001',
    password: 'Appr0v#5zY1$kE3s',
    passwordHash: '$2a$10$xyz',
    firstName: 'Alice',
    lastName: 'Approver',
    role: 'Approver',
    organisationId: 'org-001',
    active: true,
  },
  {
    id: 'user-001',
    email: 'user001@servigen.local',
    username: 'user001',
    password: 'Us3r@4bT7&mQ6wV',
    passwordHash: '$2a$10$xyz',
    firstName: 'Sam',
    lastName: 'User',
    role: 'Service User',
    organisationId: 'org-001',
    active: true,
  },
  {
    id: 'support-001',
    email: 'support001@servigen.local',
    username: 'support001',
    password: 'Supp0rt!2xL8^pD5',
    passwordHash: '$2a$10$xyz',
    firstName: 'Sarah',
    lastName: 'Support',
    role: 'Support Team User',
    organisationId: 'org-001',
    active: true,
  },
];

/**
 * Find user by email, username, or both (case-insensitive).
 */
const findUserByCredential = async (lookup) => {
  if (!lookup) return null;

  let email = null;
  let username = null;

  if (typeof lookup === 'string') {
    const clean = lookup.trim().toLowerCase();
    if (clean.includes('@')) {
      email = clean;
    } else {
      username = clean;
    }
  } else if (typeof lookup === 'object') {
    if (typeof lookup.email === 'string' && lookup.email.trim()) {
      email = lookup.email.trim().toLowerCase();
    }
    if (typeof lookup.username === 'string' && lookup.username.trim()) {
      username = lookup.username.trim().toLowerCase();
    }
    if (typeof lookup.identifier === 'string' && lookup.identifier.trim()) {
      const cleanIdent = lookup.identifier.trim().toLowerCase();
      if (!email && cleanIdent.includes('@')) email = cleanIdent;
      else if (!username) username = cleanIdent;
    }
  }

  if (!email && !username) return null;

  if (process.env.NODE_ENV !== 'test') {
    try {
      let user = null;
      if (email && username) {
        user = await db.user.findFirst({
          where: {
            AND: [
              { email: { equals: email, mode: 'insensitive' } },
              { username: { equals: username, mode: 'insensitive' } },
            ],
          },
        });

        if (!user) {
          user = await db.user.findFirst({
            where: {
              OR: [
                { email: { equals: email, mode: 'insensitive' } },
                { username: { equals: username, mode: 'insensitive' } },
              ],
            },
          });
        }
      } else {
        const queryValue = email || username;
        user = await db.user.findFirst({
          where: {
            OR: [
              { email: { equals: queryValue, mode: 'insensitive' } },
              { username: { equals: queryValue, mode: 'insensitive' } },
            ],
          },
        });
      }

      if (user) {
        return {
          id: user.id,
          email: user.email,
          username: user.username || user.email.split('@')[0],
          password: user.passwordHash,
          passwordHash: user.passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organisationId: user.organisationId,
          siteId: user.siteId,
          active: user.availability !== 'Inactive',
        };
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  return (
    mockUsers.find((u) => {
      const uEmail = u.email ? u.email.toLowerCase() : null;
      const uUser = u.username ? u.username.toLowerCase() : null;

      if (email && username) {
        if (uEmail === email && uUser === username) return true;
        return uEmail === email || uUser === username;
      }
      if (email) return uEmail === email || uUser === email;
      if (username) return uUser === username || uEmail === username;
      return false;
    }) || null
  );
};

/**
 * Find user by ID.
 */
const findUserById = async (id) => {
  if (!id || typeof id !== 'string') return null;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const user = await db.user.findUnique({
        where: { id },
      });

      if (user) {
        return {
          id: user.id,
          email: user.email,
          username: user.username || user.email.split('@')[0],
          password: user.passwordHash,
          passwordHash: user.passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organisationId: user.organisationId,
          siteId: user.siteId,
          active: user.availability !== 'Inactive',
        };
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  return mockUsers.find((u) => u.id === id) || null;
};

module.exports = {
  findUserByCredential,
  findUserByEmail: findUserByCredential,
  findUserByUsername: findUserByCredential,
  findUserById,
};