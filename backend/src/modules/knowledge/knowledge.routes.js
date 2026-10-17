'use strict';

const express = require('express');
const router = express.Router();
const knowledgeController = require('./knowledge.controller');

router.get('/', knowledgeController.listArticles);
router.get('/:id', knowledgeController.getArticle);
router.post('/', knowledgeController.createArticle);
router.patch('/:id', knowledgeController.updateArticle);

module.exports = router;
