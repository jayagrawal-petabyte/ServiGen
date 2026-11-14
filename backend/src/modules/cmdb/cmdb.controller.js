'use strict';

const {
  getAllConfigurationItems,
  getConfigurationItemsGroupedByType,
  getConfigurationItemDetail,
  createNewConfigurationItem,
  updateConfigurationItemDetail,
  linkCiRelationship,
  unlinkCiRelationship,
  getCiTopologyGraph,
} = require('./cmdb.service');

const getEffectiveOrgId = (req) => {
  if (req.user && req.user.role === 'Admin' && typeof req.query.organisationId === 'string') {
    return req.query.organisationId.trim();
  }
  return req.user?.organisationId || req.headers['x-org-id'] || null;
};

const getConfigurationItems = async (req, res) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const configurationItems = await getAllConfigurationItems({ organisationId });

    res.status(200).json({
      success: true,
      data: configurationItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration items',
    });
  }
};

const getConfigurationItemsByType = async (req, res) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const groupedItems = await getConfigurationItemsGroupedByType(organisationId);

    res.status(200).json({
      success: true,
      data: groupedItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration items by type',
    });
  }
};

const getConfigurationItemById = async (req, res) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !id.trim() || id.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration item ID format',
      });
    }

    const organisationId = getEffectiveOrgId(req);
    const item = await getConfigurationItemDetail(id.trim(), organisationId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Configuration item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration item details',
    });
  }
};

const createConfigurationItem = async (req, res) => {
  try {
    const { name, type } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Configuration item name is required',
      });
    }

    if (!type || typeof type !== 'string' || !type.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Configuration item type is required',
      });
    }

    const organisationId = getEffectiveOrgId(req);
    const newCi = await createNewConfigurationItem(req.body, organisationId);

    res.status(201).json({
      success: true,
      data: newCi,
      message: 'Configuration item registered successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create configuration item',
    });
  }
};

const updateConfigurationItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !id.trim() || id.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration item ID format',
      });
    }

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Update payload must be an object',
      });
    }

    const organisationId = getEffectiveOrgId(req);
    const updated = await updateConfigurationItemDetail(id.trim(), req.body, organisationId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Configuration item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Configuration item updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration item',
    });
  }
};

const addCiRelationship = async (req, res) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !id.trim() || id.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration item ID format',
      });
    }

    const relationshipData = req.body || {};
    const targetKey =
      relationshipData.targetId ||
      relationshipData.targetCiId ||
      relationshipData.targetCiTag;

    if (!targetKey || typeof targetKey !== 'string' || !targetKey.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Target configuration item identifier (targetId) is required',
      });
    }

    const organisationId = getEffectiveOrgId(req);
    const result = await linkCiRelationship(id.trim(), relationshipData, organisationId);

    if (result.error === 'SOURCE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Source configuration item not found',
      });
    }

    if (result.error === 'TARGET_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Target configuration item not found',
      });
    }

    if (result.error === 'SELF_LINK') {
      return res.status(400).json({
        success: false,
        message: 'Cannot link a configuration item to itself',
      });
    }

    res.status(201).json({
      success: true,
      data: result.relationships,
      message: 'Relationship established successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add configuration item relationship',
    });
  }
};

const removeCiRelationship = async (req, res) => {
  try {
    const { id, targetId } = req.params;
    if (typeof id !== 'string' || !id.trim() || id.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid source configuration item ID format',
      });
    }

    if (typeof targetId !== 'string' || !targetId.trim() || targetId.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target configuration item ID format',
      });
    }

    const organisationId = getEffectiveOrgId(req);
    const result = await unlinkCiRelationship(id.trim(), targetId.trim(), organisationId);

    if (result.error === 'SOURCE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Source configuration item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: result.relationships,
      message: 'Relationship removed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove configuration item relationship',
    });
  }
};

const getCiTopology = async (req, res) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !id.trim() || id.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration item ID format',
      });
    }

    const organisationId = getEffectiveOrgId(req);
    const topology = await getCiTopologyGraph(id.trim(), organisationId);

    if (!topology) {
      return res.status(404).json({
        success: false,
        message: 'Configuration item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: topology,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate configuration item topology',
    });
  }
};

const getServiceCis = async (req, res) => {
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
    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service CIs',
    });
  }
};

module.exports = {
  getConfigurationItems,
  getConfigurationItemsByType,
  getConfigurationItemById,
  createConfigurationItem,
  updateConfigurationItem,
  addCiRelationship,
  removeCiRelationship,
  getCiTopology,
  getServiceCis,
};
