'use strict';

const {
  VALID_CHANGE_TYPES,
  VALID_STATUSES,
  getChangeRequests,
  getChangeRequestById,
  getActiveChangeRequests,
  createChangeRequest,
  updateChangeRequest,
  getFreezeWindows,
} = require('./change-requests.model');

const sanitizeInputText = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim();
};

const calculateRisk = ({ changeType, impact = 'Medium', urgency = 'Medium', relatedService }) => {
  let typeWeight = 2;
  if (changeType === 'Emergency') typeWeight = 4;
  else if (changeType === 'Standard') typeWeight = 1;

  let impactWeight = 2;
  if (impact === 'High') impactWeight = 3;
  else if (impact === 'Low') impactWeight = 1;

  let urgencyWeight = 2;
  if (urgency === 'High') urgencyWeight = 3;
  else if (urgency === 'Low') urgencyWeight = 1;

  let criticalBonus = 0;
  if (relatedService && /database|payment|auth|core|gateway/i.test(relatedService)) {
    criticalBonus = 2;
  }

  const riskScore = (typeWeight * 2) + (impactWeight * 2) + (urgencyWeight * 2) + criticalBonus;
  let riskLevel = 'Medium';
  if (riskScore >= 16) riskLevel = 'Critical';
  else if (riskScore >= 12) riskLevel = 'High';
  else if (riskScore <= 7) riskLevel = 'Low';

  return { riskScore, riskLevel, impact, urgency };
};

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
 * Validate and create a new Change Request with risk scoring and implementation plan.
 */
const createNewChangeRequest = async (body, organisationId) => {
  const {
    summary,
    changeType,
    ciId,
    ciTag,
    assignedAgentId,
    relatedService,
    startDate,
    endDate,
    impact = 'Medium',
    urgency = 'Medium',
    implementationSteps = [],
    rollbackPlan = null,
    preImplementationTestingNotes = null,
  } = body;

  // ─── Validation & Field Normalization ───────────────────────────────────────────
  const effectiveSummary = (typeof summary === 'string' && summary.trim())
    ? summary.trim()
    : ((typeof body?.title === 'string' && body.title.trim())
      ? body.title.trim()
      : ((typeof body?.changeTitle === 'string' && body.changeTitle.trim())
        ? body.changeTitle.trim()
        : null));

  if (!effectiveSummary) {
    throw new Error('summary is required and must be a non-empty string');
  }
  if (effectiveSummary.length > 500) {
    throw new Error('summary must not exceed 500 characters');
  }

  let normalizedChangeType = changeType;
  if (typeof changeType === 'string') {
    const match = VALID_CHANGE_TYPES.find((t) => t.toLowerCase() === changeType.trim().toLowerCase());
    if (match) normalizedChangeType = match;
  }
  if (!normalizedChangeType || !VALID_CHANGE_TYPES.includes(normalizedChangeType)) {
    throw new Error(`changeType must be one of: ${VALID_CHANGE_TYPES.join(', ')}`);
  }

  const effectiveStartDate = startDate || body?.scheduledStart || body?.startTime || null;
  const effectiveEndDate = endDate || body?.scheduledEnd || body?.endTime || null;

  if (effectiveStartDate && isNaN(Date.parse(effectiveStartDate))) {
    throw new Error('startDate must be a valid ISO 8601 date string');
  }
  if (effectiveEndDate && isNaN(Date.parse(effectiveEndDate))) {
    throw new Error('endDate must be a valid ISO 8601 date string');
  }
  if (effectiveStartDate && effectiveEndDate && new Date(effectiveStartDate) > new Date(effectiveEndDate)) {
    throw new Error('startDate must not be after endDate');
  }

  const effectiveRollback = rollbackPlan || body?.rollbackStrategy || body?.backoutStrategy || body?.rollbackAndBackoutStrategy || null;
  const effectivePreNotes = preImplementationTestingNotes || body?.testingNotes || body?.preImplementationNotes || null;

  const effectiveCiId = ciId || body?.targetCi || body?.targetCI || null;
  const effectiveCiTag = ciTag || body?.targetCiTag || (typeof effectiveCiId === 'string' && !effectiveCiId.startsWith('ci-') ? effectiveCiId : null);
  const effectiveOrgId = organisationId || body?.organisationId || body?.organisation_id || 'org-001';

  if (effectiveRollback && typeof effectiveRollback === 'string' && effectiveRollback.length > 10000) {
    throw new Error('rollbackPlan must not exceed 10000 characters');
  }
  if (effectivePreNotes && typeof effectivePreNotes === 'string' && effectivePreNotes.length > 10000) {
    throw new Error('preImplementationTestingNotes must not exceed 10000 characters');
  }

  if (Array.isArray(implementationSteps)) {
    for (const step of implementationSteps) {
      if (step.description && step.description.length > 2000) {
        throw new Error('Step description must not exceed 2000 characters');
      }
    }
  }

  const { riskScore, riskLevel } = calculateRisk({
    changeType: normalizedChangeType,
    impact,
    urgency,
    relatedService,
  });

  const sanitizedSteps = Array.isArray(implementationSteps)
    ? implementationSteps.map((step, idx) => ({
        stepNumber: step.stepNumber || idx + 1,
        description: sanitizeInputText(step.description || ''),
        owner: step.owner || 'Unassigned',
        estimatedDurationMinutes: Number(step.estimatedDurationMinutes) || 15,
        status: step.status || 'Pending',
      }))
    : [];

  return createChangeRequest({
    summary: sanitizeInputText(effectiveSummary),
    changeType: normalizedChangeType,
    ciId: effectiveCiId || null,
    ciTag: effectiveCiTag ? sanitizeInputText(effectiveCiTag) : null,
    assignedAgentId: assignedAgentId || null,
    relatedService: relatedService ? sanitizeInputText(relatedService) : null,
    startDate: effectiveStartDate || null,
    endDate: effectiveEndDate || null,
    organisationId: effectiveOrgId || null,
    riskScore,
    riskLevel,
    implementationSteps: sanitizedSteps,
    rollbackPlan: effectiveRollback ? sanitizeInputText(effectiveRollback) : null,
    preImplementationTestingNotes: effectivePreNotes ? sanitizeInputText(effectivePreNotes) : null,
  });
};

/**
 * Validate and apply a partial update to a Change Request.
 * Enforces workflow state machine and prevents status bypass (R4-Bug 2).
 */
const updateChangeRequestData = async (id, body, organisationId) => {
  const {
    status,
    implementationSteps,
    rollbackPlan,
    preImplementationTestingNotes,
  } = body;

  if (status === undefined && implementationSteps === undefined && rollbackPlan === undefined && preImplementationTestingNotes === undefined) {
    throw new Error('Request body must include at least one patchable field: status');
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    throw new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // Enforce workflow state machine guards (R4-Bug 2)
  if (status !== undefined) {
    const existing = await getChangeRequestById(id, organisationId);
    if (!existing) return null;

    // Prevent direct bypass from On Hold, Draft, Closed, or Cancelled to Approved
    if (status === 'Approved' && ['On Hold', 'Draft', 'Closed', 'Cancelled'].includes(existing.status)) {
      throw new Error(`Cannot transition directly from "${existing.status}" to "Approved" (workflow bypass prevented)`);
    }
  }

  const patch = {};
  if (status !== undefined) patch.status = status;
  if (rollbackPlan !== undefined) {
    if (typeof rollbackPlan === 'string' && rollbackPlan.length > 10000) {
      throw new Error('rollbackPlan must not exceed 10000 characters');
    }
    patch.rollbackPlan = sanitizeInputText(rollbackPlan);
  }
  if (preImplementationTestingNotes !== undefined) {
    if (typeof preImplementationTestingNotes === 'string' && preImplementationTestingNotes.length > 10000) {
      throw new Error('preImplementationTestingNotes must not exceed 10000 characters');
    }
    patch.preImplementationTestingNotes = sanitizeInputText(preImplementationTestingNotes);
  }
  if (Array.isArray(implementationSteps)) {
    patch.implementationSteps = implementationSteps.map((step, idx) => ({
      stepNumber: step.stepNumber || idx + 1,
      description: sanitizeInputText(step.description || ''),
      owner: step.owner || 'Unassigned',
      estimatedDurationMinutes: Number(step.estimatedDurationMinutes) || 15,
      status: step.status || 'Pending',
    }));
  }

  return updateChangeRequest(id, organisationId, patch);
};

const getCalendarOverlayData = async (options = {}) => {
  const { startDate, endDate, organisationId } = options;
  const changes = await getAllChangeRequests({ organisationId });

  const validStart = startDate && !isNaN(Date.parse(startDate)) ? new Date(startDate) : null;
  const validEnd = endDate && !isNaN(Date.parse(endDate)) ? new Date(endDate) : null;

  const scheduledChanges = changes.filter((c) => {
    if (!c.startDate && !c.endDate) return false;
    if (validStart && c.endDate && new Date(c.endDate) < validStart) return false;
    if (validEnd && c.startDate && new Date(c.startDate) > validEnd) return false;
    return true;
  });

  const freezeWindows = getFreezeWindows();

  return {
    scheduledChanges,
    freezeWindows,
  };
};

module.exports = {
  getAllChangeRequests,
  getChangeRequestDetails,
  getActiveChangeRequestsData,
  createNewChangeRequest,
  updateChangeRequestData,
  getCalendarOverlayData,
  calculateRisk,
  sanitizeInputText,
};
