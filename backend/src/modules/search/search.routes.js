'use strict';

const express = require('express');
const { globalSearchHandler } = require('./search.controller');

const router = express.Router();

router.get('/', globalSearchHandler);

module.exports = router;
