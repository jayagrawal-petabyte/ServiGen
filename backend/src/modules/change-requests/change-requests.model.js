'use strict';

const db = require('../../config/db');

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Map a raw Prisma ChangeRequest record to the public shape.
 * `organisationId` is resolved from the DB record directly — never hardcoded.
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
  organisationId: cr.organisationId || null,
});

/**
 * Apply tenant isolation. Records with no organisationId are treated as
 * globally accessible (e.g. system-level changes). Records whose tenant
 * does not match the authenticated user's org are excluded.
 *
 * @param {object[]} records  Formatted change-request objects
 * @param {string|null} organisationId  Authenticated caller's org
 * @returns {object[]}
 */
const applyTenantFilter = (records, organisationId) => {
  if (!organisationId) return records;
  return records.filter(
    (cr) => !cr.organisationId || cr.organisationId === organisationId
  );
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

  // BUG FIX: Previously the condition `records && records.length > 0` meant
  // an empty live table would silently fall through to mock seed data.
  // Now we distinguish "DB is reachable" from "DB is empty": reachable DB
  // data (even an empty array) is always returned; the mock fallback is only
  // used when a connection error is thrown.
  if (process.env.NODE_ENV !== 'test') {
    try {
      const records = await db.changeRequest.findMany({
        orderBy: { createdAt: 'desc' },
      });
      // `records` is always an array (possibly empty) — return directly.
      return applyTenantFilter(records.map(formatRecord), organisationId);
    } catch (_err) {
      // Database unreachable — fall through to in-memory mock.
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
      const cr = await db.changeRequest.findUnique({ where: { id } });
      if (!cr) return null;

      const formatted = formatRecord(cr);

      // BUG FIX: Tenant isolation now uses the actual `organisationId` from
      // the DB record (via formatRecord), not the previously hardcoded 'org-001'.
      if (organisationId && formatted.organisationId && formatted.organisationId !== organisationId) {
        return null;
      }
      return formatted;
    } catch (_err) {
      // Database unreachable — fall through to in-memory mock.
    }
  }

  const cr = mockChangeRequests.find((item) => item.id === id);
  if (!cr) return null;
  if (organisationId && cr.organisationId && cr.organisationId !== organisationId) {
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
      // BUG FIX: Same empty-array fix applied here as in getChangeRequests.
      const records = await db.changeRequest.findMany({
        where: { status: 'Active' },
        orderBy: { createdAt: 'desc' },
      });
      return applyTenantFilter(records.map(formatRecord), organisationId);
    } catch (_err) {
      // Database unreachable — fall through to in-memory mock.
    }
  }

  return mockChangeRequests.filter(
    (cr) =>
      cr.status === 'Active' &&
      (!organisationId || !cr.organisationId || cr.organisationId === organisationId)
  );
};

module.exports = {
  getChangeRequests,
  getChangeRequestById,
  getActiveChangeRequests,
};