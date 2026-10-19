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

// ─── Mock Seed Data (dev/test fallback only) ──────────────────────────────────
// Used ONLY when NODE_ENV === 'test' or the database connection throws.
// The `organisationId` field on each record reflects the actual tenant value so
// the tenant-isolation filter below works identically for both paths.
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
 * `organisationId` is resolved from the DB record directly, or via its assigned
 * agent or configuration item site relation — never hardcoded.
 *
 * @param {object} cr  Raw Prisma record
 * @returns {object}   Public-facing ChangeRequest shape
 */
const formatRecord = (cr) => ({
  id: cr.id,
  agent: cr.assignedAgentId || null,
  summary: cr.summary,
  changeType: cr.changeType,
  status: cr.status,
  ciTag: cr.ciTag || null,
  relatedService: cr.relatedService || null,
  startDate: cr.startDate ? cr.startDate.toISOString() : null,
  endDate: cr.endDate ? cr.endDate.toISOString() : null,
  organisationId:
    cr.organisationId ||
    cr.assignedAgent?.organisationId ||
    cr.configurationItem?.site?.organisationId ||
    null,
});

/**
 * Apply tenant isolation.
 * When organisationId is specified, only records matching that tenant are returned.
 *
 * @param {object[]} records  Formatted change-request objects
 * @param {string|null} organisationId  Authenticated caller's org
 * @returns {object[]}
 */
const applyTenantFilter = (records, organisationId) => {
  if (!organisationId) return records;
  return records.filter((cr) => cr.organisationId === organisationId);
};

// ─── Model Functions ──────────────────────────────────────────────────────────

/**
 * Retrieve all change requests, filtered by tenant.
 *
 * @param {{ organisationId?: string }} options
 * @returns {Promise<object[]>}
 */
const getChangeRequests = async (options = {}) => {
  const { organisationId } = options;

  // Distinguish "DB is reachable" from "DB is empty": reachable DB
  // data (even an empty array) is always returned; the mock fallback is only
  // used when a connection error is thrown.
  if (process.env.NODE_ENV !== 'test') {
    try {
      const records = await db.changeRequest.findMany({
        include: crInclude,
        orderBy: { createdAt: 'desc' },
      });
      // `records` is always an array (possibly empty) — return directly.
      return applyTenantFilter(records.map(formatRecord), organisationId);
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return applyTenantFilter(mockChangeRequests, organisationId);
};

/**
 * Retrieve a single change request by ID, enforcing tenant isolation.
 *
 * @param {string} id              Change-request ID (e.g. "CR-001")
 * @param {string|null} organisationId
 * @returns {Promise<object|null>}
 */
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
  return cr;
};

/**
 * Retrieve all change requests currently in 'Active' status, scoped by tenant.
 *
 * @param {{ organisationId?: string }} options
 * @returns {Promise<object[]>}
 */
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
    mockChangeRequests.filter((cr) => cr.status === 'Active'),
    organisationId
  );
};

/**
 * Create a new ChangeRequest record.
 * The `id` is auto-generated — callers must not supply one.
 * `status` defaults to 'Draft' on creation — callers cannot self-approve.
 *
 * @param {object} payload
 * @param {string}  payload.summary
 * @param {string}  payload.changeType   Must be in VALID_CHANGE_TYPES
 * @param {string}  [payload.ciId]
 * @param {string}  [payload.ciTag]
 * @param {string}  [payload.assignedAgentId]
 * @param {string}  [payload.relatedService]
 * @param {string}  [payload.startDate]  ISO 8601
 * @param {string}  [payload.endDate]    ISO 8601
 * @returns {Promise<object>} The formatted newly-created record
 */
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
  } = payload;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const cr = await db.changeRequest.create({
        data: {
          summary,
          changeType,
          status: 'Draft',
          ciId: ciId || undefined,
          ciTag: ciTag || undefined,
          assignedAgentId: assignedAgentId || undefined,
          relatedService: relatedService || undefined,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        },
        include: crInclude,
      });
      return formatRecord(cr);
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  // Mock fallback for test env — generate a sequential-looking ID
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
    organisationId: null, // resolved at query time via crInclude in live DB
  };
  mockChangeRequests.push(newRecord);
  return newRecord;
};

/**
 * Update an existing ChangeRequest — strict tenant guard + allowlisted fields.
 * Only `status` may be patched (implementationChecklist pending schema decision).
 *
 * @param {string}      id
 * @param {string|null} organisationId  The caller's org — enforced for IDOR prevention
 * @param {object}      patch           Allowlisted fields only
 * @param {string}      [patch.status]  Must be in VALID_STATUSES
 * @returns {Promise<object|null>} Updated record, or null if not found / IDOR blocked
 */
const updateChangeRequest = async (id, organisationId, patch) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      // 1. Fetch with crInclude so tenant can be verified before mutating
      const existing = await db.changeRequest.findUnique({
        where: { id },
        include: crInclude,
      });
      if (!existing) return null;

      // 2. Tenant isolation — IDOR guard
      const formatted = formatRecord(existing);
      if (organisationId && formatted.organisationId !== organisationId) {
        return null;
      }

      // 3. Build safe update payload — only allowlisted fields
      const data = {};
      if (patch.status !== undefined) data.status = patch.status;

      const updated = await db.changeRequest.update({
        where: { id },
        data,
        include: crInclude,
      });
      return formatRecord(updated);
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
  if (patch.status !== undefined) {
    mockChangeRequests[idx] = { ...mockChangeRequests[idx], status: patch.status };
  }
  return mockChangeRequests[idx];
};

module.exports = {
  VALID_CHANGE_TYPES,
  VALID_STATUSES,
  getChangeRequests,
  getChangeRequestById,
  getActiveChangeRequests,
  createChangeRequest,
  updateChangeRequest,
};