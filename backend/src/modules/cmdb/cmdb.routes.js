'use strict';

const express = require('express');

const {
  getConfigurationItems,
  getConfigurationItemsByType,
  getConfigurationItemById,
  createConfigurationItem,
  updateConfigurationItem,
  addCiRelationship,
  removeCiRelationship,
  getCiTopology,
  getServiceCis,
} = require('./cmdb.controller');

const router = express.Router();

router.get('/configuration-items', getConfigurationItems);
router.post('/configuration-items', createConfigurationItem);
router.get('/service-cis', getServiceCis);

router.get(
  '/configuration-items/grouped-by-type',
  getConfigurationItemsByType
);

router.get('/configuration-items/:id', getConfigurationItemById);
router.patch('/configuration-items/:id', updateConfigurationItem);

router.get('/configuration-items/:id/topology', getCiTopology);

router.post('/configuration-items/:id/relationships', addCiRelationship);
router.delete('/configuration-items/:id/relationships/:targetId', removeCiRelationship);

module.exports = router;
