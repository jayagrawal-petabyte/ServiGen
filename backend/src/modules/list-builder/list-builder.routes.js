const express = require('express');

const {
  getLists,
  getListById,
  createList,
} = require('./list-builder.controller');

const router = express.Router();

router.get('/lists', getLists);

router.get('/lists/:id', getListById);

router.post('/lists', createList);

module.exports = router;