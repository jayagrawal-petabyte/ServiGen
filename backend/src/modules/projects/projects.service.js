const {
    getProjects,
    getActiveProjects,
    getProjectById,
    getSubtasksByProject,
} = require('./projects.model');

const calculateCompletionPercentage = (subtasks = []) => {
    if (!Array.isArray(subtasks) || subtasks.length === 0) {
        return 0;
    }

    const completed = subtasks.filter(
        (subtask) => subtask && subtask.status === 'COMPLETED'
    ).length;

  return Math.round((completed / subtasks.length) * 100);
};

const getAllProjects = async (options = {}) => {
    return await getProjects(options);
};

const getActiveProjectsData = async (options = {}) => {
    const activeProjects = await getActiveProjects(options);

    return activeProjects.map((project) => ({
        ...project,
        completionPercentage: calculateCompletionPercentage(project.subtasks),
    }));
};

const getProjectDetail = async (projectId, organisationId = null) => {
    const project = await getProjectById(projectId, organisationId);
    if (!project) return null;
    return {
        ...project,
        completionPercentage: calculateCompletionPercentage(project.subtasks),
    };
};

const getProjectSubtasks = async (projectId, organisationId = null) => {
    return await getSubtasksByProject(projectId, organisationId);
};

module.exports = {
    getAllProjects,
    getActiveProjectsData,
    getProjectDetail,
    getProjectSubtasks,
};