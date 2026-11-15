'use strict';

const sanitizeHtml = require('sanitize-html');
const {
  getConfigurationItems,
  getConfigurationItemsByType,
  getConfigurationItemById,
  createConfigurationItemRecord,
  updateConfigurationItemRecord,
  getCiDependencies,
  createCiDependencyRecord,
  deleteCiDependencyRecord,
  getCiTopology,
  getCiImpactData,
} = require('./cmdb.model');
const AppError = require('../../shared/utils/app-error');
const { HTTP_STATUS } = require('../../shared/constants/http.constants');

const VALID_LIFECYCLE_STATUSES = [
  'Ordered',
  'In Stock',
  'Deployed',
  'Maintenance',
  'Retired',
];

const ALLOWED_LIFECYCLE_TRANSITIONS = {
  Ordered: ['In Stock', 'Retired'],
  'In Stock': ['Deployed', 'Retired'],
  Deployed: ['Maintenance', 'Retired'],
  Maintenance: ['Deployed', 'Retired'],
  Retired: [],
};

const VALID_ENVIRONMENTS = ['Production', 'Staging', 'DR', 'Development'];
const VALID_RELATION_TYPES = ['DEPENDS_ON', 'HOSTED_ON', 'CONNECTS_TO'];
const VALID_IMPACT_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const sanitizeText = (str) => {
  if (typeof str !== 'string') return '';
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
};

const getAllConfigurationItems = async (options = {}) => {
  return await getConfigurationItems(options);
};

const getConfigurationItemsGroupedByType = async (organisationId = null) => {
  return await getConfigurationItemsByType(organisationId);
};

const getConfigurationItemDetail = async (id, organisationId = null) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Valid configuration item ID is required', HTTP_STATUS.BAD_REQUEST);
  }
  return await getConfigurationItemById(id.trim(), organisationId);
};

const createCi = async (payload = {}, organisationId) => {
  if (!organisationId) {
    throw new AppError('Organisation ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const {
    name,
    type,
    tag,
    site = 'Chennai',
    status = 'Active',
    lifecycleStatus = 'Deployed',
    businessOwner = 'Technology',
    environment = 'Production',
    ipAddress,
    operatingSystem,
    supportTeam,
  } = payload;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new AppError('Name is required', HTTP_STATUS.BAD_REQUEST);
  }
  if (name.trim().length > 255) {
    throw new AppError('Name cannot exceed 255 characters', HTTP_STATUS.BAD_REQUEST);
  }

  const effectiveType = (typeof type === 'string' && type.trim())
    ? type.trim()
    : ((typeof payload.category === 'string' && payload.category.trim())
      ? payload.category.trim()
      : ((typeof payload.ciType === 'string' && payload.ciType.trim())
        ? payload.ciType.trim()
        : null));

  if (!effectiveType) {
    throw new AppError('Type is required', HTTP_STATUS.BAD_REQUEST);
  }
  if (effectiveType.length > 100) {
    throw new AppError('Type cannot exceed 100 characters', HTTP_STATUS.BAD_REQUEST);
  }

  const effectiveTag = (typeof tag === 'string' && tag.trim())
    ? tag.trim()
    : ((typeof payload.ciTag === 'string' && payload.ciTag.trim())
      ? payload.ciTag.trim()
      : `CI-${(effectiveType || 'SRV').slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`);

  if (!effectiveTag) {
    throw new AppError('Tag is required', HTTP_STATUS.BAD_REQUEST);
  }
  if (effectiveTag.length > 50) {
    throw new AppError('Tag cannot exceed 50 characters', HTTP_STATUS.BAD_REQUEST);
  }

  if (lifecycleStatus && !VALID_LIFECYCLE_STATUSES.includes(lifecycleStatus)) {
    throw new AppError(`lifecycleStatus must be one of: ${VALID_LIFECYCLE_STATUSES.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  if (environment && !VALID_ENVIRONMENTS.includes(environment)) {
    throw new AppError(`environment must be one of: ${VALID_ENVIRONMENTS.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  // Check unique tag within organisation
  const existingWithTag = await getConfigurationItemById(effectiveTag.trim(), organisationId);
  if (existingWithTag) {
    throw new AppError(`A configuration item with tag "${effectiveTag.trim()}" already exists`, HTTP_STATUS.CONFLICT);
  }

  return createConfigurationItemRecord({
    name: sanitizeText(name),
    type: sanitizeText(effectiveType),
    tag: effectiveTag.trim().toUpperCase(),
    site: sanitizeText(site),
    status: sanitizeText(status),
    lifecycleStatus,
    businessOwner: sanitizeText(businessOwner),
    environment,
    ipAddress: ipAddress ? sanitizeText(ipAddress) : null,
    operatingSystem: operatingSystem ? sanitizeText(operatingSystem) : null,
    supportTeam: supportTeam ? sanitizeText(supportTeam) : null,
    organisationId,
  });
};

const updateCi = async (id, organisationId, patch = {}) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Valid configuration item ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getConfigurationItemDetail(id.trim(), organisationId);
  if (!existing) {
    throw new AppError('Configuration item not found', HTTP_STATUS.NOT_FOUND);
  }

  const cleanPatch = {};

  if (patch.name !== undefined) {
    if (typeof patch.name !== 'string' || !patch.name.trim()) {
      throw new AppError('Name cannot be empty', HTTP_STATUS.BAD_REQUEST);
    }
    if (patch.name.trim().length > 255) {
      throw new AppError('Name cannot exceed 255 characters', HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.name = sanitizeText(patch.name);
  }

  if (patch.type !== undefined) {
    if (typeof patch.type !== 'string' || !patch.type.trim()) {
      throw new AppError('Type cannot be empty', HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.type = sanitizeText(patch.type);
  }

  if (patch.status !== undefined) {
    cleanPatch.status = sanitizeText(patch.status);
  }

  if (patch.lifecycleStatus !== undefined) {
    if (!VALID_LIFECYCLE_STATUSES.includes(patch.lifecycleStatus)) {
      throw new AppError(`lifecycleStatus must be one of: ${VALID_LIFECYCLE_STATUSES.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
    }

    const currentLifecycle = existing.lifecycleStatus || 'Deployed';
    if (patch.lifecycleStatus !== currentLifecycle) {
      const allowedNext = ALLOWED_LIFECYCLE_TRANSITIONS[currentLifecycle] || [];
      if (!allowedNext.includes(patch.lifecycleStatus)) {
        throw new AppError(
          `Invalid lifecycle status transition from "${currentLifecycle}" to "${patch.lifecycleStatus}". Allowed next states: ${allowedNext.join(', ') || 'None'}`,
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }
    cleanPatch.lifecycleStatus = patch.lifecycleStatus;
  }

  if (patch.environment !== undefined) {
    if (!VALID_ENVIRONMENTS.includes(patch.environment)) {
      throw new AppError(`environment must be one of: ${VALID_ENVIRONMENTS.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.environment = patch.environment;
  }

  if (patch.businessOwner !== undefined) {
    cleanPatch.businessOwner = sanitizeText(patch.businessOwner);
  }

  if (patch.ipAddress !== undefined) {
    cleanPatch.ipAddress = sanitizeText(patch.ipAddress);
  }

  if (patch.operatingSystem !== undefined) {
    cleanPatch.operatingSystem = sanitizeText(patch.operatingSystem);
  }

  if (patch.supportTeam !== undefined) {
    cleanPatch.supportTeam = sanitizeText(patch.supportTeam);
  }

  return updateConfigurationItemRecord(existing.id, organisationId, cleanPatch);
};

const getCiRelationships = async (ciId, organisationId = null) => {
  if (!ciId || typeof ciId !== 'string') {
    throw new AppError('Valid configuration item ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getConfigurationItemDetail(ciId.trim(), organisationId);
  if (!existing) {
    throw new AppError('Configuration item not found', HTTP_STATUS.NOT_FOUND);
  }

  return getCiDependencies(existing.id, organisationId);
};

const createCiRelationship = async (sourceCiId, organisationId, payload = {}) => {
  if (!sourceCiId || typeof sourceCiId !== 'string') {
    throw new AppError('Valid source configuration item ID is required', HTTP_STATUS.BAD_REQUEST);
  }
  if (!organisationId) {
    throw new AppError('Organisation ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const { targetCiId, relationType = 'DEPENDS_ON', impactLevel = 'High' } = payload;

  if (!targetCiId || typeof targetCiId !== 'string' || !targetCiId.trim()) {
    throw new AppError('targetCiId is required', HTTP_STATUS.BAD_REQUEST);
  }

  if (sourceCiId.trim() === targetCiId.trim()) {
    throw new AppError('A configuration item cannot depend on itself', HTTP_STATUS.BAD_REQUEST);
  }

  if (!VALID_RELATION_TYPES.includes(relationType)) {
    throw new AppError(`relationType must be one of: ${VALID_RELATION_TYPES.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  if (!VALID_IMPACT_LEVELS.includes(impactLevel)) {
    throw new AppError(`impactLevel must be one of: ${VALID_IMPACT_LEVELS.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  const [sourceCi, targetCi] = await Promise.all([
    getConfigurationItemDetail(sourceCiId.trim(), organisationId),
    getConfigurationItemDetail(targetCiId.trim(), organisationId),
  ]);

  if (!sourceCi) {
    throw new AppError('Source configuration item not found in this organisation', HTTP_STATUS.NOT_FOUND);
  }
  if (!targetCi) {
    throw new AppError('Target configuration item not found in this organisation', HTTP_STATUS.NOT_FOUND);
  }

  return createCiDependencyRecord(sourceCi.id, organisationId, {
    targetCiId: targetCi.id,
    relationType,
    impactLevel,
  });
};

const getCiImpactAnalysis = async (ciId, organisationId = null) => {
  if (!ciId || typeof ciId !== 'string') {
    throw new AppError('Valid configuration item ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getConfigurationItemDetail(ciId.trim(), organisationId);
  if (!existing) {
    throw new AppError('Configuration item not found', HTTP_STATUS.NOT_FOUND);
  }

  return getCiImpactData(existing.id, organisationId);
};

const deleteCiRelationship = async (sourceCiId, targetCiId, organisationId = null) => {
  if (!sourceCiId || typeof sourceCiId !== 'string') {
    throw new AppError('Valid source configuration item ID is required', HTTP_STATUS.BAD_REQUEST);
  }
  if (!targetCiId || typeof targetCiId !== 'string') {
    throw new AppError('Valid target configuration item ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existingSource = await getConfigurationItemDetail(sourceCiId.trim(), organisationId);
  if (!existingSource) {
    throw new AppError('Source configuration item not found in this organisation', HTTP_STATUS.NOT_FOUND);
  }

  const removed = await deleteCiDependencyRecord(existingSource.id, targetCiId.trim(), organisationId);
  if (!removed) {
    throw new AppError('Dependency link not found between these configuration items', HTTP_STATUS.NOT_FOUND);
  }

  return {
    success: true,
    message: 'Relationship dependency removed successfully',
    deletedDependency: removed,
  };
};

const getCiTopologyTree = async (ciId, organisationId = null) => {
  if (!ciId || typeof ciId !== 'string') {
    throw new AppError('Valid configuration item ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getConfigurationItemDetail(ciId.trim(), organisationId);
  if (!existing) {
    throw new AppError('Configuration item not found in this organisation', HTTP_STATUS.NOT_FOUND);
  }

  return getCiTopology(existing.id, organisationId);
};

module.exports = {
  VALID_LIFECYCLE_STATUSES,
  ALLOWED_LIFECYCLE_TRANSITIONS,
  getAllConfigurationItems,
  getConfigurationItemsGroupedByType,
  getConfigurationItemDetail,
  createCi,
  updateCi,
  getCiRelationships,
  createCiRelationship,
  deleteCiRelationship,
  getCiTopologyTree,
  getCiImpactAnalysis,
};
