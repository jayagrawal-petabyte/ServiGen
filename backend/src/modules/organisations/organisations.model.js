'use strict';

const db = require('../../config/db');
const { handleDbError } = require('../../shared/utils/db-guard');

const mockUsers = [
  {
    id: 'user-001',
    username: 'agent001',
    site: 'Chennai',
    email: 'agent001@halohq.com',
    phone: '+91-9000000001',
    networkLogin: 'agent001',
    role: 'Service Agent',
    department: 'IT Service Desk',
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
    department: 'Finance',
    organisationId: 'org-001',
    active: true,
  },
  {
    id: 'user-003',
    username: 'admin001',
    site: 'London HQ',
    email: 'admin001@halohq.com',
    phone: '+44-20-7946-0958',
    networkLogin: 'admin001',
    role: 'Admin',
    department: 'Information Technology',
    organisationId: 'org-001',
    active: true,
  },
];

const mockSites = [
  {
    id: 'site-001',
    name: 'Chennai HQ',
    timezone: 'Asia/Kolkata',
    organisationId: 'org-001',
    userCount: 15,
    ciCount: 4,
  },
  {
    id: 'site-002',
    name: 'Bangalore Office',
    timezone: 'Asia/Kolkata',
    organisationId: 'org-001',
    userCount: 8,
    ciCount: 2,
  },
  {
    id: 'site-003',
    name: 'London HQ',
    timezone: 'Europe/London',
    organisationId: 'org-001',
    userCount: 12,
    ciCount: 5,
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
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
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
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return mockUsers.find((user) => user.id === id) || null;
};

const getOrganisationSites = async (organisationId) => {
  if (!organisationId) return [];

  if (process.env.NODE_ENV !== 'test') {
    try {
      const sites = await db.site.findMany({
        where: { organisationId },
        include: {
          _count: {
            select: { users: true, configurationItems: true },
          },
        },
      });

      return sites.map((s) => ({
        id: s.id,
        name: s.name,
        timezone: s.timezone || 'UTC',
        organisationId: s.organisationId,
        userCount: s._count?.users || 0,
        ciCount: s._count?.configurationItems || 0,
      }));
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return mockSites.filter((site) => site.organisationId === organisationId);
};

const getOrganisationContacts = async (organisationId) => {
  const users = await getOrganisationUsers(organisationId);
  return users.map((u) => ({
    id: u.id,
    name: u.username,
    email: u.email,
    phone: u.phone,
    role: u.role,
    department: u.department || 'General',
    site: u.site,
    isVip: ['Admin', 'Approver'].includes(u.role),
    active: u.active,
  }));
};

module.exports = {
  getOrganisationUsers,
  getUserById,
  getOrganisationSites,
  getOrganisationContacts,
};
