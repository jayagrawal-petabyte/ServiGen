'use strict';

const express = require('express');
const {
  getContractsList,
  getContractById,
  createContractHandler,
  updateContractHandler,
  deleteContractHandler,
  getExpiringSoonHandler,
} = require('./contracts.controller');

const router = express.Router();

router.get('/expiring-soon', getExpiringSoonHandler);
router.get('/', getContractsList);
router.get('/:id', getContractById);
router.post('/', createContractHandler);
router.patch('/:id', updateContractHandler);
router.delete('/:id', deleteContractHandler);

module.exports = router;
