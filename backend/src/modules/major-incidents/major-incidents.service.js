const {
  getMajorIncidents,
  getMajorIncidentById,
  saveMajorIncident,
  updateMajorIncident,
  addIncidentUpdate,
} = require('./major-incidents.model');

const VALID_STATUSES = ['Investigating', 'Identified', 'Monitoring', 'Resolved'];
const VALID_PRIORITIES = ['P1', 'P2'];

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
    id: `MI-${String(Date.now()).slice(-6)}`,
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
  if (payload.status && !VALID_STATUSES.includes(payload.status)) {
    const error = new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (payload.priority && !VALID_PRIORITIES.includes(payload.priority)) {
    const error = new Error('priority must be P1 or P2');
    error.statusCode = 400;
    throw error;
  }

  const changes = { ...payload };
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
    id: `${id}-U${Date.now()}`,
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
