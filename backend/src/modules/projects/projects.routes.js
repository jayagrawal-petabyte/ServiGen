
const express = require('express');

const {
    getProjects,
    getActiveProjects,
    getProjectById,
    getProjectDependencies,
    addProjectDependency,
    getProjectSubtasks,
    createProjectSubtask,
    createProject,
    getProjectResources,
} = require('./projects.controller');

const router = express.Router();

router.post('/projects', createProject);

router.get('/projects', getProjects);
router.get('/projects/active', getActiveProjects);
router.get('/projects/:projectId/resources', getProjectResources);
router.get('/projects/:projectId/subtasks', getProjectSubtasks);
router.post('/projects/:projectId/subtasks', createProjectSubtask);
router.get('/projects/:projectId/dependencies', getProjectDependencies);
router.post('/projects/:projectId/dependencies', addProjectDependency);
router.get('/projects/:projectId', getProjectById);

module.exports = router;
