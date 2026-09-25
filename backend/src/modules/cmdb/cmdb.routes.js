const express = require('express');

const {
  getConfigurationItems,
  getConfigurationItemsByType,
} = require('./cmdb.controller');

const router = express.Router();

router.get('/configuration-items', getConfigurationItems);

router.get(
  '/configuration-items/grouped-by-type',
  getConfigurationItemsByType
);

module.exports = router;