const {
  getMajorIncidents,
  getMajorIncidentById,
  saveMajorIncident,
  updateMajorIncident,
  addIncidentUpdate,
} = require('./major-incidents.model');

const VALID_STATUSES = ['Investigating', 'Identified', 'Monitoring', 'Resolved'];
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

const requireNonBlankString = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw createValidationError(`${field} must be a non-empty string`);
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

  if (!VALID_PRIORITIES.includes(priority)) {
    const error = new Error('priority must be P1 or P2');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const incident = {
    id: nextIncidentId(),
    title,
    description,
    status: 'Investigating',
    priority,
    impact,
    affectedServices,
    commander: payload.commander || 'Unassigned',
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
    if (['title', 'description', 'impact', 'commander'].includes(field)) {
      requireNonBlankString(value, field);
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

    changes[field] = value;
  }

  if (changes.status === 'Resolved' && !changes.resolvedAt) {
    changes.resolvedAt = new Date().toISOString();
  }

  return updateMajorIncident(id, changes);
};

const createIncidentUpdate = async (id, payload) => {
  if (!payload.message) {
    const error = new Error('message is required');
    error.statusCode = 400;
    throw error;
  }

  const update = {
    id: nextIncidentUpdateId(id),
    message: payload.message,
    author: payload.author || 'Unassigned',
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
};
