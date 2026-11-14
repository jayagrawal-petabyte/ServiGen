
const express = require('express');

const {
    getProjects,
    getActiveProjects,
    getProjectById,
    updateProject,
    getProjectDependencies,
    addProjectDependency,
    getProjectSubtasks,
    createProjectSubtask,
    updateProjectSubtask,
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
router.patch('/projects/:projectId/subtasks/:taskId', updateProjectSubtask);
router.patch('/projects/:projectId/subtasks/:subtaskId', updateProjectSubtask);
router.get('/projects/:projectId/dependencies', getProjectDependencies);
router.post('/projects/:projectId/dependencies', addProjectDependency);
router.get('/projects/:projectId', getProjectById);
router.patch('/projects/:projectId', updateProject);

module.exports = router;
