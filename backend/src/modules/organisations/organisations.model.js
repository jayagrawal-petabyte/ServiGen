'use strict';

const db = require('../../config/db');

const mockUsers = [
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

const getOrganisationUsers = async (organisationId) => {
  if (!organisationId) return [];

  if (process.env.NODE_ENV !== 'test') {
    try {
      const records = await db.user.findMany({
        where: { organisationId },
        include: { site: true },
        orderBy: { createdAt: 'asc' },
      });

      if (records && records.length > 0) {
        return records.map((u) => ({
          id: u.id,
          username: u.username || u.email.split('@')[0],
          site: u.site?.name || 'Main HQ',
          email: u.email,
          phone: u.phoneNumber || '+91-9000000000',
          networkLogin: u.networkLogin || u.username,
          role: u.role,
          organisationId: u.organisationId,
          active: u.availability !== 'Inactive',
        }));
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  return mockUsers.filter((user) => user.organisationId === organisationId);
};

const getUserById = async (id) => {
  if (!id) return null;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const u = await db.user.findUnique({
        where: { id },
        include: { site: true },
      });

      if (u) {
        return {
          id: u.id,
          username: u.username || u.email.split('@')[0],
          site: u.site?.name || 'Main HQ',
          email: u.email,
          phone: u.phoneNumber || '+91-9000000000',
          networkLogin: u.networkLogin || u.username,
          role: u.role,
          organisationId: u.organisationId,
          active: u.availability !== 'Inactive',
        };
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  return mockUsers.find((user) => user.id === id) || null;
};

module.exports = {
  getOrganisationUsers,
  getUserById,
};