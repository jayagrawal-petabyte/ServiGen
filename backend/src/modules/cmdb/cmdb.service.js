const {
  getConfigurationItems,
  getConfigurationItemsByType,
} = require('./cmdb.model');

const getAllConfigurationItems = async () => {
  return await getConfigurationItems();
};

const getConfigurationItemsGroupedByType = async () => {
  return await getConfigurationItemsByType();
};

module.exports = {
  getAllConfigurationItems,
  getConfigurationItemsGroupedByType,
};