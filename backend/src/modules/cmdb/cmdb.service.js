const {
  getConfigurationItems,
  getConfigurationItemsByType,
  getConfigurationItemById,
} = require('./cmdb.model');

const getAllConfigurationItems = async (options = {}) => {
  return await getConfigurationItems(options);
};

const getConfigurationItemsGroupedByType = async (organisationId = null) => {
  return await getConfigurationItemsByType(organisationId);
};

const getConfigurationItemDetail = async (id, organisationId = null) => {
  return await getConfigurationItemById(id, organisationId);
};

module.exports = {
  getAllConfigurationItems,
  getConfigurationItemsGroupedByType,
  getConfigurationItemDetail,
};