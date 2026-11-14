'use strict';

const {
  getConfigurationItems,
  getConfigurationItemsByType,
  getConfigurationItemById,
  createConfigurationItem,
  updateConfigurationItem,
  addCiRelationship,
  removeCiRelationship,
  getCiTopology,
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

const createNewConfigurationItem = async (payload, organisationId = null) => {
  return await createConfigurationItem(payload, organisationId);
};

const updateConfigurationItemDetail = async (id, payload, organisationId = null) => {
  return await updateConfigurationItem(id, payload, organisationId);
};

const linkCiRelationship = async (id, relationshipData, organisationId = null) => {
  return await addCiRelationship(id, relationshipData, organisationId);
};

const unlinkCiRelationship = async (id, targetId, organisationId = null) => {
  return await removeCiRelationship(id, targetId, organisationId);
};

const getCiTopologyGraph = async (id, organisationId = null) => {
  return await getCiTopology(id, organisationId);
};

module.exports = {
  getAllConfigurationItems,
  getConfigurationItemsGroupedByType,
  getConfigurationItemDetail,
  createNewConfigurationItem,
  updateConfigurationItemDetail,
  linkCiRelationship,
  unlinkCiRelationship,
  getCiTopologyGraph,
};
