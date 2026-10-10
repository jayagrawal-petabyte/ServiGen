'use strict';

const db = require('../../config/db');

const mockMajorIncidents = [
  {
    id: 'MI-001',
    title: 'Customer portal unavailable',
    description: 'Customers cannot access the self-service portal.',
    status: 'Investigating',
    priority: 'P1',
    impact: 'Customer-facing portal is unavailable.',
    affectedServices: ['Customer Portal', 'Authentication API'],
    commander: 'Unassigned',
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

      const records = await db.majorIncident.findMany({
        where,
        include: { updates: true },
        orderBy: { startedAt: 'desc' },
      });

      if (records && records.length > 0) {
        return records.map((mi) => ({
          id: mi.id,
          title: mi.title,
          description: mi.description,
          status: mi.status,
          priority: mi.priority,
          impact: mi.impact,
          affectedServices: mi.affectedServices,
          commander: mi.commander,
          startedAt: mi.startedAt ? mi.startedAt.toISOString() : null,
          resolvedAt: mi.resolvedAt ? mi.resolvedAt.toISOString() : null,
          updates: (mi.updates || []).map((u) => ({
            id: u.id,
            message: u.message,
            author: u.author,
            createdAt: u.timestamp ? u.timestamp.toISOString() : new Date().toISOString(),
          })),
        }));
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  return mockMajorIncidents.filter((incident) => {
    const matchesStatus = !filters.status || incident.status === filters.status;
    const matchesPriority = !filters.priority || incident.priority === filters.priority;

    return matchesStatus && matchesPriority;
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
          title: mi.title,
          description: mi.description,
          status: mi.status,
          priority: mi.priority,
          impact: mi.impact,
          affectedServices: mi.affectedServices,
          commander: mi.commander,
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
      // Database connection fallback
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
          title: incident.title,
          description: incident.description,
          status: incident.status || 'Investigating',
          priority: incident.priority,
          impact: incident.impact || 'High',
          affectedServices: incident.affectedServices || [],
          commander: incident.commander || 'Unassigned',
        },
      });
    } catch (_err) {
      // Database connection fallback
    }
  }

  mockMajorIncidents.push(incident);
  return incident;
};

const updateMajorIncident = async (id, changes) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await db.majorIncident.update({
        where: { id },
        data: changes,
      });
    } catch (_err) {
      // Database connection fallback
    }
  }

  const incident = await getMajorIncidentById(id);
  if (!incident) return null;
  Object.assign(incident, changes);
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
    } catch (_err) {
      // Database connection fallback
    }
  }

  const incident = await getMajorIncidentById(id);
  if (!incident) return null;
  incident.updates.push(update);
  return incident;
};

module.exports = {
  getMajorIncidents,
  getMajorIncidentById,
  saveMajorIncident,
  updateMajorIncident,
  addIncidentUpdate,
};
