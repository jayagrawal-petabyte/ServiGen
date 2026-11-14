'use strict';

const { randomUUID } = require('node:crypto');
const db = require('../../config/db');

// ─── Domain Constants ─────────────────────────────────────────────────────────

const VALID_CHANGE_TYPES = Object.freeze(['Standard', 'Normal', 'Emergency']);

// Allowed status transitions. Callers may only move to these values via PATCH.
const VALID_STATUSES = Object.freeze([
  'Draft',
  'Pending Approval',
  'Approved',
  'Active',
  'Scheduled',
  'On Hold',
  'Completed',
  'Rejected',
]);

const calculateDefaultRiskScore = (changeType) => {
  if (changeType === 'Emergency') return 14;
  if (changeType === 'Normal') return 8;
  return 4;
};

const calculateDefaultRiskLevel = (changeType) => {
  if (changeType === 'Emergency') return 'High';
  if (changeType === 'Normal') return 'Medium';
  return 'Low';
};

// ─── Mock Seed Data (dev/test fallback only) ──────────────────────────────────
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
    riskScore: 8,
    riskLevel: 'Medium',
    implementationSteps: [
      { stepNumber: 1, description: 'Backup PostgreSQL database', owner: 'agent-001', estimatedDurationMinutes: 30, status: 'Completed' },
      { stepNumber: 2, description: 'Apply v14 binaries', owner: 'agent-001', estimatedDurationMinutes: 60, status: 'In Progress' }
    ],
    rollbackPlan: 'Restore snapshot from cold backup storage',
    preImplementationTestingNotes: 'Staging environment tested successfully on 2026-09-28',
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
    riskScore: 14,
    riskLevel: 'High',
    implementationSteps: [
      { stepNumber: 1, description: 'Deploy security kernel patch', owner: 'agent-002', estimatedDurationMinutes: 20, status: 'Completed' }
    ],
    rollbackPlan: 'Roll back container to previous image hash',
    preImplementationTestingNotes: 'Lab tested in isolated security sandbox',
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
    riskScore: 4,
    riskLevel: 'Low',
    implementationSteps: [],
    rollbackPlan: 'Revert switch firmware configuration to previous running config',
    preImplementationTestingNotes: 'Standard maintenance procedure #442',
  },
];

const mockFreezeWindows = [
  {
    id: 'FREEZE-Q4',
    name: 'Quarter-End Financial Freeze',
    startDate: '2026-12-24T00:00:00Z',
    endDate: '2027-01-02T23:59:59Z',
    policy: 'Emergency changes only; all standard and normal changes restricted',
    status: 'Upcoming'
  },
  {
    id: 'FREEZE-BLACK-FRIDAY',
    name: 'Black Friday / Peak Traffic Freeze',
    startDate: '2026-11-23T00:00:00Z',
    endDate: '2026-11-30T23:59:59Z',
    policy: 'Complete deployment freeze across production services',
    status: 'Upcoming'
  }
];

// ─── Prisma Query Inclusions ──────────────────────────────────────────────────
const crInclude = {
  assignedAgent: {
    select: { organisationId: true },
  },
  configurationItem: {
    include: {
      site: {
        select: { organisationId: true },
      },
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Map a raw Prisma ChangeRequest record to the public shape.
 */
const formatRecord = (cr) => ({
  id: cr.id,
  agent: cr.assignedAgentId || cr.agent || null,
  summary: cr.summary,
  changeType: cr.changeType,
  status: cr.status,
  ciTag: cr.ciTag || null,
  relatedService: cr.relatedService || null,
  startDate: cr.startDate ? (cr.startDate instanceof Date ? cr.startDate.toISOString() : cr.startDate) : null,
  endDate: cr.endDate ? (cr.endDate instanceof Date ? cr.endDate.toISOString() : cr.endDate) : null,
  organisationId:
    cr.organisationId ||
    cr.assignedAgent?.organisationId ||
    cr.configurationItem?.site?.organisationId ||
    null,
  riskScore: cr.riskScore || calculateDefaultRiskScore(cr.changeType),
  riskLevel: cr.riskLevel || calculateDefaultRiskLevel(cr.changeType),
  implementationSteps: cr.implementationSteps || [],
  rollbackPlan: cr.rollbackPlan || null,
  preImplementationTestingNotes: cr.preImplementationTestingNotes || null,
});

/**
 * Apply tenant isolation.
 */
const applyTenantFilter = (records, organisationId) => {
  if (!organisationId) return records;
  return records.filter((cr) => cr.organisationId === organisationId);
};

// ─── Model Functions ──────────────────────────────────────────────────────────

const getChangeRequests = async (options = {}) => {
  const { organisationId } = options;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const records = await db.changeRequest.findMany({
        include: crInclude,
        orderBy: { createdAt: 'desc' },
      });
      return applyTenantFilter(records.map(formatRecord), organisationId);
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return applyTenantFilter(mockChangeRequests.map(formatRecord), organisationId);
};

const getChangeRequestById = async (id, organisationId = null) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const cr = await db.changeRequest.findUnique({
        where: { id },
        include: crInclude,
      });
      if (!cr) return null;

      const formatted = formatRecord(cr);

      if (organisationId && formatted.organisationId !== organisationId) {
        return null;
      }
      return formatted;
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  const cr = mockChangeRequests.find((item) => item.id === id);
  if (!cr) return null;
  if (organisationId && cr.organisationId !== organisationId) {
    return null;
  }
  return formatRecord(cr);
};

const getActiveChangeRequests = async (options = {}) => {
  const { organisationId } = options;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const records = await db.changeRequest.findMany({
        where: { status: 'Active' },
        include: crInclude,
        orderBy: { createdAt: 'desc' },
      });
      return applyTenantFilter(records.map(formatRecord), organisationId);
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return applyTenantFilter(
    mockChangeRequests.filter((cr) => cr.status === 'Active').map(formatRecord),
    organisationId
  );
};

const createChangeRequest = async (payload) => {
  const {
    summary,
    changeType,
    ciId = null,
    ciTag = null,
    assignedAgentId = null,
    relatedService = null,
    startDate = null,
    endDate = null,
    organisationId = null,
    riskScore = null,
    riskLevel = null,
    implementationSteps = [],
    rollbackPlan = null,
    preImplementationTestingNotes = null,
  } = payload;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const cr = await db.changeRequest.create({
        data: {
          summary,
          changeType,
          status: 'Draft',
          organisationId: organisationId || undefined,
          ciId: ciId || undefined,
          ciTag: ciTag || undefined,
          assignedAgentId: assignedAgentId || undefined,
          relatedService: relatedService || undefined,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        },
        include: crInclude,
      });
      const formatted = formatRecord(cr);
      formatted.riskScore = riskScore || calculateDefaultRiskScore(changeType);
      formatted.riskLevel = riskLevel || calculateDefaultRiskLevel(changeType);
      formatted.implementationSteps = implementationSteps;
      formatted.rollbackPlan = rollbackPlan;
      formatted.preImplementationTestingNotes = preImplementationTestingNotes;
      return formatted;
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  // Mock fallback for test env
  const newRecord = {
    id: `CR-${String(mockChangeRequests.length + 1).padStart(3, '0')}`,
    agent: assignedAgentId,
    summary,
    changeType,
    status: 'Draft',
    ciTag,
    relatedService,
    startDate: startDate ? new Date(startDate).toISOString() : null,
    endDate: endDate ? new Date(endDate).toISOString() : null,
    organisationId,
    riskScore: riskScore || calculateDefaultRiskScore(changeType),
    riskLevel: riskLevel || calculateDefaultRiskLevel(changeType),
    implementationSteps,
    rollbackPlan,
    preImplementationTestingNotes,
  };
  mockChangeRequests.push(newRecord);
  return formatRecord(newRecord);
};

const updateChangeRequest = async (id, organisationId, patch) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const existing = await db.changeRequest.findUnique({
        where: { id },
        include: crInclude,
      });
      if (!existing) return null;

      const formatted = formatRecord(existing);
      if (organisationId && formatted.organisationId !== organisationId) {
        return null;
      }

      const data = {};
      if (patch.status !== undefined) data.status = patch.status;

      const updated = await db.changeRequest.update({
        where: { id },
        data,
        include: crInclude,
      });
      const resFormatted = formatRecord(updated);
      if (patch.implementationSteps !== undefined) resFormatted.implementationSteps = patch.implementationSteps;
      if (patch.rollbackPlan !== undefined) resFormatted.rollbackPlan = patch.rollbackPlan;
      if (patch.preImplementationTestingNotes !== undefined) resFormatted.preImplementationTestingNotes = patch.preImplementationTestingNotes;
      return resFormatted;
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  // Mock fallback
  const idx = mockChangeRequests.findIndex((cr) => cr.id === id);
  if (idx === -1) return null;
  if (organisationId && mockChangeRequests[idx].organisationId !== organisationId) {
    return null;
  }
  mockChangeRequests[idx] = { ...mockChangeRequests[idx], ...patch };
  return formatRecord(mockChangeRequests[idx]);
};

const getFreezeWindows = () => mockFreezeWindows;

module.exports = {
  VALID_CHANGE_TYPES,
  VALID_STATUSES,
  getChangeRequests,
  getChangeRequestById,
  getActiveChangeRequests,
  createChangeRequest,
  updateChangeRequest,
  getFreezeWindows,
  mockChangeRequests,
};
