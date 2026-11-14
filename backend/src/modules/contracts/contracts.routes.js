'use strict';

const express = require('express');
const {
  getContractsHandler,
  getExpiringSoonHandler,
  getContractByIdHandler,
  createContractHandler,
  updateContractHandler,
  deleteContractHandler,
  getLinkedCisHandler,
  linkCiHandler,
  unlinkCiHandler,
} = require('./contracts.controller');

const router = express.Router();

router.get('/', getContractsHandler);
router.post('/', createContractHandler);

router.get('/expiring-soon', getExpiringSoonHandler);

router.get('/:id', getContractByIdHandler);
router.patch('/:id', updateContractHandler);
router.delete('/:id', deleteContractHandler);

router.get('/:id/linked-cis', getLinkedCisHandler);
router.post('/:id/linked-cis', linkCiHandler);
router.delete('/:id/linked-cis/:ciId', unlinkCiHandler);

module.exports = router;
