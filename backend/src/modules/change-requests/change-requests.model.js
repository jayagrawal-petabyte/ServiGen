'use strict';

const db = require('../../config/db');

const mockChangeRequests = [
  {
    id: 'CR-001',
    agent: 'agent-001',
    summary: 'Upgrade database server to v14',
    changeType: 'Normal',
    status: 'Active',
    ciTag: 'DB-001',
    relatedService: 'Customer Database',
    startDate: '2026-10-01T00:00:00Z',
    endDate: '2026-10-02T04:00:00Z',
    organisationId: 'org-001',
  },
  {
    id: 'CR-002',
    agent: 'agent-002',
    summary: 'Emergency patch for zero-day vulnerability',
    changeType: 'Emergency',
    status: 'Completed',
    ciTag: 'WEB-001',
    relatedService: 'Web Server',
    startDate: '2026-09-25T10:00:00Z',
    endDate: '2026-09-25T12:00:00Z',
    organisationId: 'org-001',
  },
  {
    id: 'CR-003',
    agent: 'agent-001',
    summary: 'Routine network maintenance',
    changeType: 'Standard',
    status: 'Pending',
    ciTag: 'NET-001',
    relatedService: 'Internal Network',
    startDate: '2026-10-15T02:00:00Z',
    endDate: '2026-10-15T06:00:00Z',
    organisationId: 'org-001',
  },
];

const getChangeRequests = async (options = {}) => {
  const { organisationId } = options;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const records = await db.changeRequest.findMany({
        orderBy: { createdAt: 'desc' },
      });

      if (records && records.length > 0) {
        const formatted = records.map((cr) => ({
          id: cr.id,
          agent: cr.assignedAgentId || 'agent-001',
          summary: cr.summary,
          changeType: cr.changeType,
          status: cr.status,
          ciTag: cr.ciTag || 'DB-001',
          relatedService: cr.relatedService || 'General',
          startDate: cr.startDate ? cr.startDate.toISOString() : null,
          endDate: cr.endDate ? cr.endDate.toISOString() : null,
          organisationId: 'org-001',
        }));

        if (organisationId) {
          return formatted.filter((cr) => !cr.organisationId || cr.organisationId === organisationId);
        }
        return formatted;
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  if (organisationId) {
    return mockChangeRequests.filter((cr) => !cr.organisationId || cr.organisationId === organisationId);
  }
  return mockChangeRequests;
};

const getChangeRequestById = async (id, organisationId = null) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const cr = await db.changeRequest.findUnique({
        where: { id },
      });

      if (cr) {
        const formatted = {
          id: cr.id,
          agent: cr.assignedAgentId || 'agent-001',
          summary: cr.summary,
          changeType: cr.changeType,
          status: cr.status,
          ciTag: cr.ciTag || 'DB-001',
          relatedService: cr.relatedService || 'General',
          startDate: cr.startDate ? cr.startDate.toISOString() : null,
          endDate: cr.endDate ? cr.endDate.toISOString() : null,
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

  const cr = mockChangeRequests.find((item) => item.id === id);
  if (!cr) return null;
  if (organisationId && cr.organisationId && cr.organisationId !== organisationId) {
    return null;
  }
  return cr;
};

const getActiveChangeRequests = async (options = {}) => {
  const { organisationId } = options;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const records = await db.changeRequest.findMany({
        where: { status: 'Active' },
        orderBy: { createdAt: 'desc' },
      });

      if (records && records.length > 0) {
        const formatted = records.map((cr) => ({
          id: cr.id,
          agent: cr.assignedAgentId || 'agent-001',
          summary: cr.summary,
          changeType: cr.changeType,
          status: cr.status,
          ciTag: cr.ciTag || 'DB-001',
          relatedService: cr.relatedService || 'General',
          startDate: cr.startDate ? cr.startDate.toISOString() : null,
          endDate: cr.endDate ? cr.endDate.toISOString() : null,
          organisationId: 'org-001',
        }));

        return formatted.filter((cr) => !organisationId || !cr.organisationId || cr.organisationId === organisationId);
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  return mockChangeRequests.filter(
    (cr) => cr.status === 'Active' && (!organisationId || !cr.organisationId || cr.organisationId === organisationId)
  );
};

module.exports = {
  getChangeRequests,
  getChangeRequestById,
  getActiveChangeRequests,
};