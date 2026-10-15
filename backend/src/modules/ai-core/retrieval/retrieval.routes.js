const express = require('express');

const {
  searchKnowledgeHandler,
  getKnowledgeHandler,
} = require('./retrieval.controller');

const router = express.Router();

router.get('/search', searchKnowledgeHandler);
router.get('/:documentId', getKnowledgeHandler);

module.exports = router;