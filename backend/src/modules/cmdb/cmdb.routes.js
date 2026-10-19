const express = require('express');

const {
  getConfigurationItems,
  getConfigurationItemsByType,
  getConfigurationItemById,
  getServiceCis,
} = require('./cmdb.controller');

const router = express.Router();

router.get('/configuration-items', getConfigurationItems);
router.get('/service-cis', getServiceCis);

router.get(
  '/configuration-items/grouped-by-type',
  getConfigurationItemsByType
);

router.get('/configuration-items/:id', getConfigurationItemById);

module.exports = router;