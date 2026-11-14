'use strict';

const express = require('express');

const {
  getConfigurationItems,
  getConfigurationItemsByType,
  getConfigurationItemById,
  createConfigurationItem,
  updateConfigurationItem,
  getCiRelationshipsHandler,
  createCiRelationshipHandler,
  getCiImpactHandler,
  getServiceCis,
} = require('./cmdb.controller');

const router = express.Router();

router.get('/configuration-items', getConfigurationItems);
router.post('/configuration-items', createConfigurationItem);
router.get('/service-cis', getServiceCis);

router.get('/configuration-items/grouped-by-type', getConfigurationItemsByType);

router.get('/configuration-items/:id', getConfigurationItemById);
router.patch('/configuration-items/:id', updateConfigurationItem);

router.get('/configuration-items/:id/relationships', getCiRelationshipsHandler);
router.post('/configuration-items/:id/relationships', createCiRelationshipHandler);

router.get('/configuration-items/:id/impact', getCiImpactHandler);

module.exports = router;
