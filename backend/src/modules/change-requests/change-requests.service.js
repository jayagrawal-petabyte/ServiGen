const {
  VALID_CHANGE_TYPES,
  VALID_STATUSES,
  getChangeRequests,
  getChangeRequestById,
  getActiveChangeRequests,
  createChangeRequest,
  updateChangeRequest,
} = require('./change-requests.model');

const getAllChangeRequests = async (options = {}) => {
  return await getChangeRequests(options);
};

const getChangeRequestDetails = async (id, organisationId = null) => {
  return await getChangeRequestById(id, organisationId);
};

const getActiveChangeRequestsData = async (options = {}) => {
  return await getActiveChangeRequests(options);
};

/**
 * Validate and create a new Change Request.
 * Enforces required fields, changeType enum, and blocks callers from
 * supplying `id` or `status` (prevents privilege escalation).
 *
 * @param {object} body            Parsed request body
 * @param {string} organisationId  Caller's org (from JWT) — informational only on create
 * @throws {Error}  For invalid or missing fields
 * @returns {Promise<object>}  The formatted new record
 */
const createNewChangeRequest = async (body, organisationId) => {
  const { summary, changeType, ciId, ciTag, assignedAgentId, relatedService, startDate, endDate } = body;

  // ─── Validation ─────────────────────────────────────────────────────────────────
  if (!summary || typeof summary !== 'string' || !summary.trim()) {
    throw new Error('summary is required and must be a non-empty string');
  }
  if (summary.trim().length > 500) {
    throw new Error('summary must not exceed 500 characters');
  }
  if (!changeType || !VALID_CHANGE_TYPES.includes(changeType)) {
    throw new Error(`changeType must be one of: ${VALID_CHANGE_TYPES.join(', ')}`);
  }
  if (startDate && isNaN(Date.parse(startDate))) {
    throw new Error('startDate must be a valid ISO 8601 date string');
  }
  if (endDate && isNaN(Date.parse(endDate))) {
    throw new Error('endDate must be a valid ISO 8601 date string');
  }
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    throw new Error('startDate must not be after endDate');
  }

  return createChangeRequest({
    summary: summary.trim(),
    changeType,
    ciId: ciId || null,
    ciTag: ciTag || null,
    assignedAgentId: assignedAgentId || null,
    relatedService: relatedService || null,
    startDate: startDate || null,
    endDate: endDate || null,
  });
};

/**
 * Validate and apply a partial update to a Change Request.
 * Only `status` is patchable. Enforces tenant isolation before mutating.
 *
 * @param {string}      id
 * @param {object}      body           Parsed request body
 * @param {string|null} organisationId Caller's org (from JWT)
 * @throws {Error}  For invalid patch fields
 * @returns {Promise<object|null>}  Updated record or null if not found / blocked
 */
const updateChangeRequestData = async (id, body, organisationId) => {
  const { status } = body;

  // ─── Validation ─────────────────────────────────────────────────────────────────
  if (status === undefined) {
    throw new Error('Request body must include at least one patchable field: status');
  }
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  return updateChangeRequest(id, organisationId, { status });
};

module.exports = {
  getAllChangeRequests,
  getChangeRequestDetails,
  getActiveChangeRequestsData,
  createNewChangeRequest,
  updateChangeRequestData,
};
