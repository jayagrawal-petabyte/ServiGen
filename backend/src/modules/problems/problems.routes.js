'use strict';

const express = require('express');
const {
  getProblemsHandler,
  getProblemByIdHandler,
  createProblemHandler,
  updateProblemHandler,
  addWorkaroundHandler,
  linkIncidentsHandler,
} = require('./problems.controller');

const router = express.Router();

router.get('/problems', getProblemsHandler);
router.post('/problems', createProblemHandler);
router.get('/problems/:id', getProblemByIdHandler);
router.patch('/problems/:id', updateProblemHandler);
router.post('/problems/:id/workaround', addWorkaroundHandler);
router.post('/problems/:id/incidents', linkIncidentsHandler);

module.exports = router;
