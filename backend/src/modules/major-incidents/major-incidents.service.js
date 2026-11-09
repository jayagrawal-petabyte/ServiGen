const {
  getMajorIncidents,
  getMajorIncidentById,
  saveMajorIncident,
  updateMajorIncident,
  addIncidentUpdate,
} = require('./major-incidents.model');

const VALID_STATUSES = [
  'Started',
  'Escalated',
  'Mitigated',
  'Resolved',
  'Closed',
];
const ALLOWED_STATUS_TRANSITIONS = {
  Started: ['Escalated'],
  Escalated: ['Mitigated'],
  Mitigated: ['Resolved'],
  Resolved: ['Closed'],
  Closed: [],
};
const VALID_PRIORITIES = ['P1', 'P2'];
const EDITABLE_FIELDS = new Set([
  'title',
  'description',
  'status',
  'priority',
  'impact',
  'affectedServices',
  'commander',
]);

let incidentSequence = 0;
let incidentUpdateSequence = 0;

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const sanitizeInputText = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const requireNonBlankString = (value, field, maxLength = 10000) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw createValidationError(`${field} must be a non-empty string`);
  }
  if (value.trim().length > maxLength) {
    throw createValidationError(`${field} must not exceed ${maxLength} characters`);
  }
};

const sanitizeRequiredText = (value, field, maxLength) => {
  if (typeof value !== 'string') {
    throw createValidationError(`${field} must be a non-empty string`);
  }
  const sanitized = sanitizeInputText(value);
  requireNonBlankString(sanitized, field, maxLength);
  return sanitized;
};

const sanitizeAffectedServices = (value) => {
  if (!Array.isArray(value) || value.some((service) => typeof service !== 'string')) {
    throw createValidationError('affectedServices must be an array of service names');
  }
  return value.map((service) => sanitizeRequiredText(service, 'affectedServices item', 255));
};

const createConflictError = (message) => {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
};

const nextIncidentId = () => `MI-${Date.now()}-${++incidentSequence}`;
const nextIncidentUpdateId = (incidentId) => `${incidentId}-U${Date.now()}-${++incidentUpdateSequence}`;

const createMajorIncident = async (payload) => {
  const { title, description, priority, impact, affectedServices } = payload;

  if (!title || !description || !priority || !impact || !Array.isArray(affectedServices)) {
    const error = new Error('title, description, priority, impact, and affectedServices are required');
    error.statusCode = 400;
    throw error;
  }

  const sanitizedTitle = sanitizeRequiredText(title, 'title', 255);
  const sanitizedDescription = sanitizeRequiredText(description, 'description', 10000);
  const sanitizedImpact = sanitizeRequiredText(impact, 'impact', 500);
  const sanitizedAffectedServices = sanitizeAffectedServices(affectedServices);

  if (!VALID_PRIORITIES.includes(priority)) {
    const error = new Error('priority must be P1 or P2');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const incident = {
    id: nextIncidentId(),
    organisationId: payload.organisationId || null,
    title: sanitizedTitle,
    description: sanitizedDescription,
    // Status and commander are system-controlled on create to prevent mass-assignment flaws
    status: 'Started',
    priority,
    impact: sanitizedImpact,
    affectedServices: sanitizedAffectedServices,
    commander: 'Unassigned',
    version: 1,
    startedAt: now,
    resolvedAt: null,
    updates: [],
  };

  return saveMajorIncident(incident);
};

const changeMajorIncident = async (id, payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createValidationError('incident changes must be an object');
  }

  const { version: expectedVersion, ...requestedChanges } = payload;
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    throw createValidationError('version must be a positive integer');
  }

  const existing = await getMajorIncidentById(id);
  if (!existing) return null;

  if ((existing.version || 1) !== expectedVersion) {
    throw createConflictError('Major incident has been modified; refresh and retry with the latest version');
  }

  const unsupportedFields = Object.keys(requestedChanges).filter((field) => !EDITABLE_FIELDS.has(field));
  if (unsupportedFields.length) {
    throw createValidationError(`cannot update protected fields: ${unsupportedFields.join(', ')}`);
  }

  const changes = {};
  for (const [field, value] of Object.entries(requestedChanges)) {
    if (['impact', 'commander'].includes(field)) {
      changes[field] = sanitizeRequiredText(value, field, 500);
    }

    if (field === 'title') {
      changes.title = sanitizeRequiredText(value, 'title', 255);
    }

    if (field === 'description') {
      changes.description = sanitizeRequiredText(value, 'description', 10000);
    }

    if (field === 'status' && (typeof value !== 'string' || !VALID_STATUSES.includes(value))) {
      throw createValidationError(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    if (field === 'priority' && (typeof value !== 'string' || !VALID_PRIORITIES.includes(value))) {
      throw createValidationError('priority must be P1 or P2');
    }

    if (field === 'affectedServices') {
      changes.affectedServices = sanitizeAffectedServices(value);
    }

    if (!['title', 'description', 'impact', 'commander'].includes(field)) {
      changes[field] = value;
    }
  }

  if (['Resolved', 'Closed'].includes(changes.status) && changes.resolvedAt === undefined) {
    changes.resolvedAt = new Date().toISOString();
  }

  if (
    changes.status &&
    changes.status !== existing.status &&
    !ALLOWED_STATUS_TRANSITIONS[existing.status]?.includes(changes.status)
  ) {
    throw createConflictError(`Invalid status transition from ${existing.status} to ${changes.status}`);
  }

  return updateMajorIncident(id, changes, expectedVersion);
};

const createIncidentUpdate = async (id, payload, authenticatedAuthor = 'Unassigned') => {
  if (!payload || typeof payload.message !== 'string' || !payload.message.trim()) {
    const error = new Error('message must be a non-empty string');
    error.statusCode = 400;
    throw error;
  }

  if (payload.message.trim().length > 2000) {
    const error = new Error('message must not exceed 2000 characters');
    error.statusCode = 400;
    throw error;
  }

  const message = sanitizeRequiredText(payload.message, 'message', 2000);
  const update = {
    id: nextIncidentUpdateId(id),
    message,
    author: authenticatedAuthor,
    createdAt: new Date().toISOString(),
  };

  return addIncidentUpdate(id, update);
};

module.exports = {
  VALID_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
  getMajorIncidents,
  getMajorIncidentById,
  createMajorIncident,
  changeMajorIncident,
  createIncidentUpdate,
  sanitizeInputText,
};
