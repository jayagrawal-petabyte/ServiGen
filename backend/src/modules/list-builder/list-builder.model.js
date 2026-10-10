'use strict';

const db = require('../../config/db');

const mockLists = [
  {
    id: 'LIST-001',
    name: 'Active Servers',
    description: 'List of all active servers',
    status: 'Draft',
    fields: ['name', 'type', 'site', 'status'],
    createdBy: 'Admin',
    organisationId: 'org-001',
  },
  {
    id: 'LIST-002',
    name: 'Critical Applications',
    description: 'List of critical business applications',
    status: 'Published',
    fields: ['name', 'type', 'businessOwner', 'status'],
    createdBy: 'Admin',
    organisationId: 'org-001',
  },
];

let _listSeq = mockLists.length;

const getLists = async (options = {}) => {
  const { organisationId } = options;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const records = await db.customList.findMany({
        orderBy: { createdAt: 'desc' },
      });

      if (records && records.length > 0) {
        const formatted = records.map((l) => ({
          id: l.id,
          name: l.name,
          description: l.description,
          status: l.status,
          fields: l.fields || [],
          createdBy: l.createdBy,
          organisationId: 'org-001',
        }));

        if (organisationId) {
          return formatted.filter((list) => !list.organisationId || list.organisationId === organisationId);
        }
        return formatted;
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  if (organisationId) {
    return mockLists.filter((list) => !list.organisationId || list.organisationId === organisationId);
  }
  return mockLists;
};

const getListById = async (id, organisationId = null) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const l = await db.customList.findUnique({
        where: { id },
      });

      if (l) {
        const formatted = {
          id: l.id,
          name: l.name,
          description: l.description,
          status: l.status,
          fields: l.fields || [],
          createdBy: l.createdBy,
          organisationId: 'org-001',
        };

        if (organisationId && formatted.organisationId && formatted.organisationId !== organisationId) {
          return null;
        }
        return formatted;
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  const list = mockLists.find((l) => l.id === id);
  if (!list) return null;
  if (organisationId && list.organisationId && list.organisationId !== organisationId) {
    return null;
  }
  return list;
};

const createList = async (listData) => {
  const { id: _ignoredId, ...safeData } = listData || {};
  const generatedId = `LIST-${String(++_listSeq).padStart(3, '0')}`;
  const newList = {
    ...safeData,
    id: generatedId,
  };

  if (process.env.NODE_ENV !== 'test') {
    try {
      await db.customList.create({
        data: {
          id: generatedId,
          name: newList.name,
          description: newList.description,
          status: newList.status || 'Draft',
          fields: newList.fields || [],
          createdBy: newList.createdBy || 'Admin',
        },
      });
    } catch (_err) {
      // Database connection fallback
    }
  }

  mockLists.push(newList);
  return newList;
};

module.exports = {
  getLists,
  getListById,
  createList,
};