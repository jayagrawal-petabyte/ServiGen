'use strict';

const sanitizeHtml = require('sanitize-html');
const {
  getProblems,
  getProblemById,
  createProblemRecord,
  updateProblemRecord,
  deleteProblemRecord,
  linkIncidentsToProblem,
  unlinkIncidentFromProblem,
  linkCiToProblemRecord,
  unlinkCiFromProblemRecord,
  addProblemLogEntry,
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

const VALID_STAGES = [
  'Investigation',
  'Workaround',
  'Known Error Review',
  'Resolved',
  'Closed',
];

const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    team,
    incidentIds = [],
    ciIds = [],
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
    stage: cleanWorkaround ? 'Workaround' : 'Investigation',
    team: team ? sanitizeText(team) : null,
    causeStatus: cleanRootCause ? 'Identified' : 'Unknown',
    rootCause: cleanRootCause,
    workaround: cleanWorkaround,
    knownError: Boolean(knownError || cleanWorkaround),
    assignedAgentId: assignedAgentId ? String(assignedAgentId).trim() : null,
    organisationId,
    incidentIds: Array.isArray(incidentIds) ? incidentIds.map(String) : [],
    ciIds: Array.isArray(ciIds) ? ciIds.map(String) : [],
  });
};

const updateProblem = async (id, organisationId, patch = {}) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Valid problem ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getProblemDetail(id, organisationId);

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

  if (patch.stage !== undefined) {
    if (!VALID_STAGES.includes(patch.stage)) {
      throw new AppError(`Stage must be one of: ${VALID_STAGES.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.stage = patch.stage;
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
    cleanPatch.causeStatus = cleanPatch.rootCause ? 'Identified' : 'Unknown';
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

  if (patch.team !== undefined) {
    cleanPatch.team = patch.team ? sanitizeText(patch.team) : null;
  }

  const agent = patch.agent || patch.assignedAgentId;
  if (agent !== undefined) {
    cleanPatch.assignedAgentId = agent ? String(agent).trim() : null;
  }

  return updateProblemRecord(existing.id, organisationId, cleanPatch);
};

const updateProblemStage = async (id, organisationId, payload = {}) => {
  const { stage } = payload;
  if (!stage || !VALID_STAGES.includes(stage)) {
    throw new AppError(`Stage is required and must be one of: ${VALID_STAGES.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getProblemDetail(id, organisationId);

  const stageToStatus = {
    Investigation: 'Under Investigation',
    Workaround: 'Workaround Found',
    'Known Error Review': 'Workaround Found',
    Resolved: 'Resolved',
    Closed: 'Closed',
  };

  const status = stageToStatus[stage] || existing.status;

  await addProblemLogEntry(existing.id, organisationId, {
    author: 'System',
    content: `Stage updated from "${existing.stage || 'Investigation'}" to "${stage}".`,
    type: 'system',
  });

  return updateProblemRecord(existing.id, organisationId, {
    stage,
    status,
  });
};

const reassignProblem = async (id, organisationId, payload = {}) => {
  const agent = payload.assignedAgentId || payload.agent;
  const team = payload.team;

  if (!agent && !team) {
    throw new AppError('Either assignedAgentId or team is required for reassignment', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getProblemDetail(id, organisationId);
  const patch = {};

  if (agent !== undefined) {
    patch.assignedAgentId = agent ? String(agent).trim() : null;
  }
  if (team !== undefined) {
    patch.team = team ? sanitizeText(team) : null;
  }

  await addProblemLogEntry(existing.id, organisationId, {
    author: 'System',
    content: `Reassigned: agent="${patch.assignedAgentId || existing.assignedAgentId}", team="${patch.team || existing.team}".`,
    type: 'system',
  });

  return updateProblemRecord(existing.id, organisationId, patch);
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

  await addProblemLogEntry(existing.id, organisationId, {
    author: payload.author || 'System',
    content: `Workaround added/updated: ${cleanWorkaround.slice(0, 80)}...`,
    type: 'note',
  });

  return updateProblemRecord(existing.id, organisationId, {
    workaround: cleanWorkaround,
    knownError: Boolean(knownError),
    status,
    stage: existing.stage === 'Investigation' ? 'Workaround' : existing.stage,
  });
};

const updateRootCause = async (id, organisationId, payload = {}) => {
  const { causeStatus = 'Identified', rootCause } = payload;
  if (!['Identified', 'Unknown'].includes(causeStatus)) {
    throw new AppError('causeStatus must be "Identified" or "Unknown"', HTTP_STATUS.BAD_REQUEST);
  }

  if (causeStatus === 'Identified' && (!rootCause || typeof rootCause !== 'string' || !rootCause.trim())) {
    throw new AppError('rootCause description is required when causeStatus is "Identified"', HTTP_STATUS.BAD_REQUEST);
  }

  const cleanRootCause = rootCause ? sanitizeText(rootCause) : null;
  const existing = await getProblemDetail(id, organisationId);

  await addProblemLogEntry(existing.id, organisationId, {
    author: payload.author || 'System',
    content: `Cause status updated to ${causeStatus}.`,
    type: 'system',
  });

  return updateProblemRecord(existing.id, organisationId, {
    causeStatus,
    rootCause: cleanRootCause,
  });
};

const getLinkedIncidents = async (id, organisationId) => {
  const problem = await getProblemDetail(id, organisationId);
  return problem.linkedIncidentIds || [];
};

const linkIncidents = async (problemId, organisationId, payload = {}) => {
  let incidentIds = payload.incidentIds;
  if (!incidentIds && payload.incidentId) {
    incidentIds = [payload.incidentId];
  }

  if (!Array.isArray(incidentIds) || incidentIds.length === 0) {
    throw new AppError('incidentIds array or incidentId is required', HTTP_STATUS.BAD_REQUEST);
  }

  const cleanIds = incidentIds.map((id) => String(id).trim()).filter(Boolean);
  if (cleanIds.length === 0) {
    throw new AppError('At least one valid incident ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getProblemDetail(problemId, organisationId);
  const updated = await linkIncidentsToProblem(existing.id, organisationId, cleanIds);

  await addProblemLogEntry(existing.id, organisationId, {
    author: 'System',
    content: `Linked child incidents: ${cleanIds.join(', ')}`,
    type: 'system',
  });

  return updated;
};

const unlinkIncident = async (problemId, organisationId, incidentId) => {
  if (!incidentId || typeof incidentId !== 'string' || !incidentId.trim()) {
    throw new AppError('Valid incidentId is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getProblemDetail(problemId, organisationId);
  const updated = await unlinkIncidentFromProblem(existing.id, organisationId, incidentId.trim());

  await addProblemLogEntry(existing.id, organisationId, {
    author: 'System',
    content: `Unlinked child incident: ${incidentId.trim()}`,
    type: 'system',
  });

  return updated;
};

const bulkResolveChildIncidents = async (problemId, organisationId, payload = {}) => {
  const existing = await getProblemDetail(problemId, organisationId);
  const resolutionNote = payload.resolutionNote || existing.workaround || 'Resolved via root problem resolution.';

  const resolvedIds = [...(existing.linkedIncidentIds || [])];

  await addProblemLogEntry(existing.id, organisationId, {
    author: payload.author || 'System',
    content: `Bulk resolved ${resolvedIds.length} child incident(s): ${resolutionNote.slice(0, 100)}`,
    type: 'system',
  });

  return {
    success: true,
    problemId: existing.id,
    resolvedIncidentCount: resolvedIds.length,
    resolvedIncidentIds: resolvedIds,
    resolutionNote: sanitizeText(resolutionNote),
  };
};

const getLinkedCis = async (id, organisationId) => {
  const problem = await getProblemDetail(id, organisationId);
  return problem.linkedCiIds || [];
};

const linkCi = async (problemId, organisationId, payload = {}) => {
  const ciId = payload.ciId || payload.configurationItemId;
  if (!ciId || typeof ciId !== 'string' || !ciId.trim()) {
    throw new AppError('ciId is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getProblemDetail(problemId, organisationId);
  const updated = await linkCiToProblemRecord(existing.id, organisationId, ciId.trim());

  await addProblemLogEntry(existing.id, organisationId, {
    author: 'System',
    content: `Linked CMDB CI: ${ciId.trim()}`,
    type: 'system',
  });

  return updated;
};

const unlinkCi = async (problemId, organisationId, ciId) => {
  if (!ciId || typeof ciId !== 'string' || !ciId.trim()) {
    throw new AppError('Valid ciId is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getProblemDetail(problemId, organisationId);
  const updated = await unlinkCiFromProblemRecord(existing.id, organisationId, ciId.trim());

  await addProblemLogEntry(existing.id, organisationId, {
    author: 'System',
    content: `Unlinked CMDB CI: ${ciId.trim()}`,
    type: 'system',
  });

  return updated;
};

const getProblemLogs = async (id, organisationId) => {
  const problem = await getProblemDetail(id, organisationId);
  return problem.logs || [];
};

const postProblemLog = async (id, organisationId, payload = {}) => {
  const { author = 'Agent', content, type = 'note' } = payload;
  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new AppError('Log content is required', HTTP_STATUS.BAD_REQUEST);
  }
  if (content.length > 10000) {
    throw new AppError('Log content cannot exceed 10000 characters', HTTP_STATUS.BAD_REQUEST);
  }

  const cleanContent = sanitizeText(content);
  const cleanAuthor = sanitizeText(author) || 'Agent';

  const existing = await getProblemDetail(id, organisationId);
  return addProblemLogEntry(existing.id, organisationId, {
    author: cleanAuthor,
    content: cleanContent,
    type: ['note', 'system', 'email'].includes(type) ? type : 'note',
  });
};

const sendProblemEmail = async (id, organisationId, payload = {}) => {
  const to = payload.to || payload.recipient;
  const subject = payload.subject;
  const body = payload.body || payload.message;

  if (!to || typeof to !== 'string' || !EMAIL_REGEX.test(to.trim())) {
    throw new AppError('Valid recipient email address is required', HTTP_STATUS.BAD_REQUEST);
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    throw new AppError('Email subject is required', HTTP_STATUS.BAD_REQUEST);
  }

  if (!body || typeof body !== 'string' || !body.trim()) {
    throw new AppError('Email body is required', HTTP_STATUS.BAD_REQUEST);
  }

  const cleanSubject = sanitizeText(subject);
  const cleanBody = sanitizeText(body);
  const cleanTo = sanitizeText(to);

  const existing = await getProblemDetail(id, organisationId);

  const logEntry = await addProblemLogEntry(existing.id, organisationId, {
    author: payload.author || 'Service Desk',
    content: `Email sent to ${cleanTo} | Subject: ${cleanSubject}\n\n${cleanBody}`,
    type: 'email',
  });

  return {
    success: true,
    messageId: `msg-${Date.now()}`,
    to: cleanTo,
    subject: cleanSubject,
    logId: logEntry.id,
  };
};

const deleteProblem = async (id, organisationId) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Valid problem ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getProblemDetail(id, organisationId);
  return deleteProblemRecord(existing.id, organisationId);
};

module.exports = {
  VALID_STATUSES,
  VALID_STAGES,
  VALID_PRIORITIES,
  listProblems,
  getProblemDetail,
  createProblem,
  updateProblem,
  updateProblemStage,
  reassignProblem,
  addWorkaround,
  updateRootCause,
  getLinkedIncidents,
  linkIncidents,
  unlinkIncident,
  bulkResolveChildIncidents,
  getLinkedCis,
  linkCi,
  unlinkCi,
  getProblemLogs,
  postProblemLog,
  sendProblemEmail,
  deleteProblem,
};
