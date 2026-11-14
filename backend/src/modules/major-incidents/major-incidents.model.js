'use strict';

const db = require('../../config/db');
const {
  handleDbError,
  recordDbSuccess,
} = require('../../shared/utils/db-guard');

const mockMajorIncidents = [
  {
    id: 'MI-001',
    organisationId: 'org-001',
    title: 'Customer portal unavailable',
    description: 'Customers cannot access the self-service portal.',
    status: 'Started',
    priority: 'P1',
    impact: 'Customer-facing portal is unavailable.',
    affectedServices: ['Customer Portal', 'Authentication API'],
    commander: 'Unassigned',
    version: 1,
    startedAt: '2026-09-25T08:00:00.000Z',
    resolvedAt: null,
    updates: [
      {
        id: 'MI-001-U1',
        message: 'Incident declared and investigation started.',
        author: 'System',
        createdAt: '2026-09-25T08:05:00.000Z',
      },
    ],
  },
];

const getMajorIncidents = async (filters = {}) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const where = {};
      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;
      if (filters.organisationId) where.organisationId = filters.organisationId;

      const records = await db.majorIncident.findMany({
        where,
        include: { updates: true },
        orderBy: { startedAt: 'desc' },
      });

      return records.map((mi) => ({
        id: mi.id,
        organisationId: mi.organisationId || null,
        title: mi.title,
        description: mi.description,
        status: mi.status,
        priority: mi.priority,
        impact: mi.impact,
        affectedServices: mi.affectedServices,
        commander: mi.commander,
        version: mi.version,
        startedAt: mi.startedAt ? mi.startedAt.toISOString() : null,
        resolvedAt: mi.resolvedAt ? mi.resolvedAt.toISOString() : null,
        updates: (mi.updates || []).map((u) => ({
          id: u.id,
          message: u.message,
          author: u.author,
          createdAt: u.timestamp ? u.timestamp.toISOString() : new Date().toISOString(),
        })),
      }));
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return mockMajorIncidents.filter((incident) => {
    const matchesStatus = !filters.status || incident.status === filters.status;
    const matchesPriority = !filters.priority || incident.priority === filters.priority;
    const matchesOrg = !filters.organisationId || incident.organisationId === filters.organisationId;

    return matchesStatus && matchesPriority && matchesOrg;
  });
};

const getMajorIncidentById = async (id) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const mi = await db.majorIncident.findUnique({
        where: { id },
        include: { updates: true },
      });

      if (mi) {
        return {
          id: mi.id,
          organisationId: mi.organisationId || null,
          title: mi.title,
          description: mi.description,
          status: mi.status,
          priority: mi.priority,
          impact: mi.impact,
          affectedServices: mi.affectedServices,
          commander: mi.commander,
          version: mi.version,
          startedAt: mi.startedAt ? mi.startedAt.toISOString() : null,
          resolvedAt: mi.resolvedAt ? mi.resolvedAt.toISOString() : null,
          updates: (mi.updates || []).map((u) => ({
            id: u.id,
            message: u.message,
            author: u.author,
            createdAt: u.timestamp ? u.timestamp.toISOString() : new Date().toISOString(),
          })),
        };
      }
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return mockMajorIncidents.find((incident) => incident.id === id) || null;
};

const saveMajorIncident = async (incident) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await db.majorIncident.create({
        data: {
          id: incident.id,
          organisationId: incident.organisationId || null,
          title: incident.title,
          description: incident.description,
          status: incident.status || 'Started',
          priority: incident.priority,
          impact: incident.impact || 'High',
          affectedServices: incident.affectedServices || [],
          commander: incident.commander || 'Unassigned',
          version: incident.version || 1,
        },
      });
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  mockMajorIncidents.push(incident);
  return incident;
};

const updateMajorIncident = async (id, changes, expectedVersion) => {
  let updatedInDatabase = false;
  if (process.env.NODE_ENV !== 'test') {
    try {
      const data = { ...changes };
      if ('resolvedAt' in data) {
        data.resolvedAt = data.resolvedAt ? new Date(data.resolvedAt) : null;
      }
      data.version = { increment: 1 };
      const result = await db.majorIncident.updateMany({
        where: { id, version: expectedVersion },
        data,
      });
      if (result.count === 0) {
        const current = await db.majorIncident.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!current) return null;
        const error = new Error('Major incident has been modified; refresh and retry with the latest version');
        error.statusCode = 409;
        throw error;
      }
      updatedInDatabase = true;
    } catch (_err) {
      if (_err.statusCode) throw _err;
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  // The database version was incremented atomically above. Re-read the mapped
  // record rather than applying the patch to a potentially stale in-memory copy.
  if (updatedInDatabase) {
    return getMajorIncidentById(id);
  }

  const incident = await getMajorIncidentById(id);
  if (!incident) return null;
  if ((incident.version || 1) !== expectedVersion) {
    const error = new Error('Major incident has been modified; refresh and retry with the latest version');
    error.statusCode = 409;
    throw error;
  }
  Object.assign(incident, changes);
  incident.version = (incident.version || 1) + 1;
  return incident;
};

const addIncidentUpdate = async (id, update) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await db.majorIncidentUpdate.create({
        data: {
          id: update.id,
          majorIncidentId: id,
          message: update.message,
          author: update.author || 'System',
        },
      });

      recordDbSuccess();
    } catch (err) {
      handleDbError(
        'major-incidents.addIncidentUpdate',
        err,
        { allowFallback: false },
      );
    }
  }

  const incident = await getMajorIncidentById(id);
  if (!incident) return null;

  if (!incident.updates.some((u) => u.id === update.id)) {
    incident.updates.push(update);
  }

  return incident;
};

module.exports = {
  getMajorIncidents,
  getMajorIncidentById,
  saveMajorIncident,
  updateMajorIncident,
  addIncidentUpdate,
};
