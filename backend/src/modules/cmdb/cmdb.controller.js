const {
  getAllConfigurationItems,
  getConfigurationItemsGroupedByType,
  getConfigurationItemDetail,
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

module.exports = {
  getConfigurationItems,
  getConfigurationItemsByType,
  getConfigurationItemById,
};