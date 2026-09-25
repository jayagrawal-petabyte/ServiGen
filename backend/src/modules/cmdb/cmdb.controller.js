const {
  getAllConfigurationItems,
  getConfigurationItemsGroupedByType,
} = require('./cmdb.service');

const getConfigurationItems = async (req, res) => {
  try {
    const configurationItems = await getAllConfigurationItems();

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
    const groupedItems = await getConfigurationItemsGroupedByType();

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

module.exports = {
  getConfigurationItems,
  getConfigurationItemsByType,
};