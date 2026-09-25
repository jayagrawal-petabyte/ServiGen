const {
    getProjects,
    getActiveProjects,
    getSubtasksByProject,
} = require('./projects.model');

const calculateCompletionPercentage = (subtasks = []) => {
    if (subtasks.length === 0) {
        return 0;
    }

    const completed = subtasks.filter(
        (subtask) => subtask.status === 'COMPLETED'
    ).length;

  return Math.round((completed / subtasks.length) * 100);
};

const getAllProjects = async () => {
    return await getProjects();
};

const getActiveProjectsData = async () => {
    const activeProjects = await getActiveProjects();

    return activeProjects.map((project) => ({
        ...project,
        completionPercentage: calculateCompletionPercentage(project.subtasks),
    }));
};

const getProjectSubtasks = async (projectId) => {
    return await getSubtasksByProject(projectId);
};

module.exports = {
    getAllProjects,
    getActiveProjectsData,
    getProjectSubtasks,
};