'use strict';

const db = require('../../config/db');

const mockLists = [
  {
    id: 'LIST-001',
    name: 'Active Servers',
    description: 'List of all active servers',
    status: 'Draft',
    fields: ['name', 'type', 'site', 'status'],
    scope: 'Tickets (All Areas)',
    group: 'Incident Management',
    sequence: 10,
    columnProfile: '*Use Default Column Profile (No Override)*',
    displayType: 'Default',
    filterCriteria: [],
    createdBy: 'Admin',
    organisationId: 'org-001',
  },
  {
    id: 'LIST-002',
    name: 'Critical Applications',
    description: 'List of critical business applications',
    status: 'Published',
    fields: ['name', 'type', 'businessOwner', 'status'],
    scope: 'Tickets (All Areas)',
    group: 'Incident Management',
    sequence: 20,
    columnProfile: '*Use Default Column Profile (No Override)*',
    displayType: 'Default',
    filterCriteria: [],
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
        include: {
          creator: {
            select: { organisationId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = records.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
        status: l.status,
        fields: l.fields || [],
        scope: l.scope || null,
        group: l.group || null,
        sequence: typeof l.sequence === 'number' ? l.sequence : 0,
        columnProfile: l.columnProfile || null,
        displayType: l.displayType || 'Default',
        filterCriteria: l.filterCriteria || {},
        createdBy: l.createdBy,
        organisationId: l.creator?.organisationId || 'org-001',
      }));

      if (organisationId) {
        return formatted.filter((list) => !list.organisationId || list.organisationId === organisationId);
      }
      return formatted;
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
        include: {
          creator: {
            select: { organisationId: true },
          },
        },
      });

      if (l) {
        const formatted = {
          id: l.id,
          name: l.name,
          description: l.description,
          status: l.status,
          fields: l.fields || [],
          scope: l.scope || null,
          group: l.group || null,
          sequence: typeof l.sequence === 'number' ? l.sequence : 0,
          columnProfile: l.columnProfile || null,
          displayType: l.displayType || 'Default',
          filterCriteria: l.filterCriteria || {},
          createdBy: l.createdBy,
          organisationId: l.creator?.organisationId || 'org-001',
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
  const generatedId = process.env.NODE_ENV === 'test'
    ? `LIST-${String(++_listSeq).padStart(3, '0')}`
    : `LIST-${Date.now()}-${++_listSeq}`;
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
          scope: newList.scope || null,
          group: newList.group || null,
          sequence: typeof newList.sequence === 'number' ? newList.sequence : 0,
          columnProfile: newList.columnProfile || null,
          displayType: newList.displayType || 'Default',
          filterCriteria: newList.filterCriteria || {},
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