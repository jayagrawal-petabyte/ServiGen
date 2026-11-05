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
  'Diagnosed',
  'Mitigated',
  'Resolved',
  'Closed',
];
const VALID_PRIORITIES = ['P1', 'P2'];
const EDITABLE_FIELDS = new Set([
  'title',
  'description',
  'status',
  'priority',
  'impact',
  'affectedServices',
  'commander',
  'resolvedAt',
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
  return str.replace(/[<>]/g, '').trim();
};

const requireNonBlankString = (value, field, maxLength = 10000) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw createValidationError(`${field} must be a non-empty string`);
  }
  if (value.trim().length > maxLength) {
    throw createValidationError(`${field} must not exceed ${maxLength} characters`);
  }
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

  requireNonBlankString(title, 'title', 500);
  requireNonBlankString(description, 'description', 10000);

  if (!VALID_PRIORITIES.includes(priority)) {
    const error = new Error('priority must be P1 or P2');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const incident = {
    id: nextIncidentId(),
    organisationId: payload.organisationId || null,
    title: sanitizeInputText(title),
    description: sanitizeInputText(description),
    // Status and commander are system-controlled on create to prevent mass-assignment flaws
    status: 'Started',
    priority,
    impact,
    affectedServices,
    commander: 'Unassigned',
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

  const unsupportedFields = Object.keys(payload).filter((field) => !EDITABLE_FIELDS.has(field));
  if (unsupportedFields.length) {
    throw createValidationError(`cannot update protected fields: ${unsupportedFields.join(', ')}`);
  }

  const changes = {};
  for (const [field, value] of Object.entries(payload)) {
    if (['impact', 'commander'].includes(field)) {
      requireNonBlankString(value, field, 500);
      changes[field] = sanitizeInputText(value);
    }

    if (field === 'title') {
      requireNonBlankString(value, 'title', 500);
      changes.title = sanitizeInputText(value);
    }

    if (field === 'description') {
      requireNonBlankString(value, 'description', 10000);
      changes.description = sanitizeInputText(value);
    }

    if (field === 'status' && (typeof value !== 'string' || !VALID_STATUSES.includes(value))) {
      throw createValidationError(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    if (field === 'priority' && (typeof value !== 'string' || !VALID_PRIORITIES.includes(value))) {
      throw createValidationError('priority must be P1 or P2');
    }

    if (field === 'affectedServices' && !Array.isArray(value)) {
      throw createValidationError('affectedServices must be an array');
    }

    if (field === 'resolvedAt') {
      if (value !== null && typeof value !== 'string') {
        throw createValidationError('resolvedAt must be an ISO date string or null');
      }
    }

    if (!['title', 'description', 'impact', 'commander'].includes(field)) {
      changes[field] = value;
    }
  }

  if (['Resolved', 'Closed'].includes(changes.status) && changes.resolvedAt === undefined) {
    changes.resolvedAt = new Date().toISOString();
  }

  return updateMajorIncident(id, changes);
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

  const update = {
    id: nextIncidentUpdateId(id),
    message: sanitizeInputText(payload.message),
    author: authenticatedAuthor,
    createdAt: new Date().toISOString(),
  };

  return addIncidentUpdate(id, update);
};

module.exports = {
  VALID_STATUSES,
  getMajorIncidents,
  getMajorIncidentById,
  createMajorIncident,
  changeMajorIncident,
  createIncidentUpdate,
  sanitizeInputText,
};
