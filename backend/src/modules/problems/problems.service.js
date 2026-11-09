'use strict';

const sanitizeHtml = require('sanitize-html');
const {
  getProblems,
  getProblemById,
  createProblemRecord,
  updateProblemRecord,
  linkIncidentsToProblem,
} = require('./problems.model');
const AppError = require('../../shared/utils/app-error');
const { HTTP_STATUS } = require('../../shared/constants/http.constants');

const VALID_STATUSES = [
  'Open',
  'Under Investigation',
  'Workaround Found',
  'Resolved',
  'Closed',
];

const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const sanitizeText = (str) => {
  if (typeof str !== 'string') return '';
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
};

const listProblems = async (filters = {}) => {
  return getProblems(filters);
};

const getProblemDetail = async (id, organisationId = null) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Valid problem ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const problem = await getProblemById(id.trim(), organisationId);
  if (!problem) {
    throw new AppError('Problem not found', HTTP_STATUS.NOT_FOUND);
  }
  return problem;
};

const createProblem = async (payload = {}, organisationId) => {
  if (!organisationId) {
    throw new AppError('Organisation ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const {
    summary,
    description,
    category = 'General',
    priority = 'Medium',
    urgency = 'Medium',
    impact = 'Medium',
    rootCause,
    workaround,
    knownError = false,
    assignedAgentId,
    incidentIds = [],
  } = payload;

  if (!summary || typeof summary !== 'string' || !summary.trim()) {
    throw new AppError('Summary is required', HTTP_STATUS.BAD_REQUEST);
  }

  if (summary.trim().length > 255) {
    throw new AppError('Summary cannot exceed 255 characters', HTTP_STATUS.BAD_REQUEST);
  }

  if (description && (typeof description !== 'string' || description.length > 10000)) {
    throw new AppError('Description cannot exceed 10000 characters', HTTP_STATUS.BAD_REQUEST);
  }

  if (rootCause && (typeof rootCause !== 'string' || rootCause.length > 10000)) {
    throw new AppError('Root cause cannot exceed 10000 characters', HTTP_STATUS.BAD_REQUEST);
  }

  if (workaround && (typeof workaround !== 'string' || workaround.length > 10000)) {
    throw new AppError('Workaround cannot exceed 10000 characters', HTTP_STATUS.BAD_REQUEST);
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    throw new AppError(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  const cleanSummary = sanitizeText(summary);
  const cleanDescription = description ? sanitizeText(description) : null;
  const cleanRootCause = rootCause ? sanitizeText(rootCause) : null;
  const cleanWorkaround = workaround ? sanitizeText(workaround) : null;

  return createProblemRecord({
    summary: cleanSummary,
    description: cleanDescription,
    category: sanitizeText(category) || 'General',
    priority,
    urgency,
    impact,
    status: cleanWorkaround ? 'Workaround Found' : 'Open',
    rootCause: cleanRootCause,
    workaround: cleanWorkaround,
    knownError: Boolean(knownError || cleanWorkaround),
    assignedAgentId: assignedAgentId ? String(assignedAgentId).trim() : null,
    organisationId,
    incidentIds: Array.isArray(incidentIds) ? incidentIds.map(String) : [],
  });
};

const updateProblem = async (id, organisationId, patch = {}) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Valid problem ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getProblemById(id.trim(), organisationId);
  if (!existing) {
    throw new AppError('Problem not found', HTTP_STATUS.NOT_FOUND);
  }

  const cleanPatch = {};

  if (patch.summary !== undefined) {
    if (typeof patch.summary !== 'string' || !patch.summary.trim()) {
      throw new AppError('Summary cannot be empty', HTTP_STATUS.BAD_REQUEST);
    }
    if (patch.summary.trim().length > 255) {
      throw new AppError('Summary cannot exceed 255 characters', HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.summary = sanitizeText(patch.summary);
  }

  if (patch.description !== undefined) {
    if (typeof patch.description !== 'string' || patch.description.length > 10000) {
      throw new AppError('Description cannot exceed 10000 characters', HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.description = sanitizeText(patch.description);
  }

  if (patch.status !== undefined) {
    if (!VALID_STATUSES.includes(patch.status)) {
      throw new AppError(`Status must be one of: ${VALID_STATUSES.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.status = patch.status;
  }

  if (patch.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(patch.priority)) {
      throw new AppError(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.priority = patch.priority;
  }

  if (patch.rootCause !== undefined) {
    if (typeof patch.rootCause !== 'string' || patch.rootCause.length > 10000) {
      throw new AppError('Root cause cannot exceed 10000 characters', HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.rootCause = sanitizeText(patch.rootCause);
  }

  if (patch.workaround !== undefined) {
    if (typeof patch.workaround !== 'string' || patch.workaround.length > 10000) {
      throw new AppError('Workaround cannot exceed 10000 characters', HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.workaround = sanitizeText(patch.workaround);
    cleanPatch.knownError = true;
  }

  if (patch.category !== undefined) {
    cleanPatch.category = sanitizeText(patch.category);
  }

  if (patch.assignedAgentId !== undefined) {
    cleanPatch.assignedAgentId = patch.assignedAgentId ? String(patch.assignedAgentId).trim() : null;
  }

  return updateProblemRecord(id.trim(), organisationId, cleanPatch);
};

const addWorkaround = async (id, organisationId, payload = {}) => {
  const { workaround, knownError = true } = payload;
  if (!workaround || typeof workaround !== 'string' || !workaround.trim()) {
    throw new AppError('Workaround text is required', HTTP_STATUS.BAD_REQUEST);
  }
  if (workaround.trim().length > 10000) {
    throw new AppError('Workaround cannot exceed 10000 characters', HTTP_STATUS.BAD_REQUEST);
  }

  const cleanWorkaround = sanitizeText(workaround);
  const existing = await getProblemDetail(id, organisationId);

  const status = ['Open', 'Under Investigation'].includes(existing.status)
    ? 'Workaround Found'
    : existing.status;

  return updateProblemRecord(id.trim(), organisationId, {
    workaround: cleanWorkaround,
    knownError: Boolean(knownError),
    status,
  });
};

const linkIncidents = async (problemId, organisationId, payload = {}) => {
  const { incidentIds } = payload;
  if (!Array.isArray(incidentIds) || incidentIds.length === 0) {
    throw new AppError('incidentIds array is required', HTTP_STATUS.BAD_REQUEST);
  }

  const cleanIds = incidentIds.map((id) => String(id).trim()).filter(Boolean);
  if (cleanIds.length === 0) {
    throw new AppError('At least one valid incident ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getProblemDetail(problemId, organisationId);
  return linkIncidentsToProblem(existing.id, organisationId, cleanIds);
};

module.exports = {
  VALID_STATUSES,
  VALID_PRIORITIES,
  listProblems,
  getProblemDetail,
  createProblem,
  updateProblem,
  addWorkaround,
  linkIncidents,
};
