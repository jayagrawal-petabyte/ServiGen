const express = require('express');

const {
    getProjects,
    getActiveProjects,
    getProjectSubtasks,
} = require('./projects.controller');

const router = express.Router();

router.get('/projects', getProjects);

router.get('/projects/active', getActiveProjects);

router.get('/projects/:projectId/subtasks', getProjectSubtasks);

module.exports = router;