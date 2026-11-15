'use strict';

const {
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
} = require('./cmdb.service');
const { HTTP_STATUS } = require('../../shared/constants/http.constants');

const getEffectiveOrgId = (req) => {
  if (req.user && req.user.role === 'Admin') {
    if (typeof req.query.organisationId === 'string' && req.query.organisationId.trim()) {
      return req.query.organisationId.trim();
    }
    if (typeof req.body?.organisationId === 'string' && req.body.organisationId.trim()) {
      return req.body.organisationId.trim();
    }
    if (typeof req.body?.organisation_id === 'string' && req.body.organisation_id.trim()) {
      return req.body.organisation_id.trim();
    }
  }
  return req.user?.organisationId || req.headers['x-org-id'] || null;
};

const getConfigurationItems = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const configurationItems = await getAllConfigurationItems({ organisationId });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: configurationItems,
    });
  } catch (error) {
    return next(error);
  }
};

const getConfigurationItemsByType = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const groupedItems = await getConfigurationItemsGroupedByType(organisationId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: groupedItems,
    });
  } catch (error) {
    return next(error);
  }
};

const getConfigurationItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !id.trim() || id.length > 50) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid configuration item ID format',
      });
    }

    const organisationId = getEffectiveOrgId(req);
    const item = await getConfigurationItemDetail(id.trim(), organisationId);

    if (!item) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Configuration item not found',
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: item,
    });
  } catch (error) {
    return next(error);
  }
};

const createConfigurationItem = async (req, res, next) => {
  try {
    let organisationId = getEffectiveOrgId(req);
    if (!organisationId) {
      organisationId = (typeof req.body?.organisationId === 'string' && req.body.organisationId.trim())
        || (typeof req.body?.organisation_id === 'string' && req.body.organisation_id.trim())
        || req.user?.organisationId
        || 'org-001';
    }

    if (!organisationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Organisation ID is required to create a configuration item',
      });
    }

    const created = await createCi(req.body, organisationId);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Configuration item created successfully',
      data: created,
    });
  } catch (error) {
    return next(error);
  }
};

const updateConfigurationItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !id.trim() || id.length > 50) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid configuration item ID format',
      });
    }

    const organisationId = getEffectiveOrgId(req);
    const updated = await updateCi(id.trim(), organisationId, req.body);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Configuration item updated successfully',
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
};

const getCiRelationshipsHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organisationId = getEffectiveOrgId(req);

    const relationships = await getCiRelationships(id, organisationId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: relationships,
    });
  } catch (error) {
    return next(error);
  }
};

const createCiRelationshipHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organisationId = getEffectiveOrgId(req);

    const dependency = await createCiRelationship(id, organisationId, req.body);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Configuration item relationship created successfully',
      data: dependency,
    });
  } catch (error) {
    return next(error);
  }
};

const getCiImpactHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organisationId = getEffectiveOrgId(req);

    const impact = await getCiImpactAnalysis(id, organisationId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: impact,
    });
  } catch (error) {
    return next(error);
  }
};

const getServiceCis = async (req, res, next) => {
  try {
    const { prisma } = require('../../shared');
    const organisationId = getEffectiveOrgId(req);
    const where = {
      type: { in: ['Service', 'Application'] },
    };
    if (organisationId) {
      where.OR = [{ site: { organisationId } }, { siteId: null }];
    }
    const items = await prisma.configurationItem.findMany({ where });
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: items,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteCiRelationshipHandler = async (req, res, next) => {
  try {
    const { id, targetId } = req.params;
    const organisationId = getEffectiveOrgId(req);
    const result = await deleteCiRelationship(id, targetId, organisationId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Relationship removed successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getCiTopologyHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organisationId = getEffectiveOrgId(req);
    const topology = await getCiTopologyTree(id, organisationId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: topology,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getConfigurationItems,
  getConfigurationItemsByType,
  getConfigurationItemById,
  createConfigurationItem,
  updateConfigurationItem,
  getCiRelationshipsHandler,
  createCiRelationshipHandler,
  deleteCiRelationshipHandler,
  getCiTopologyHandler,
  getCiImpactHandler,
  getServiceCis,
};
