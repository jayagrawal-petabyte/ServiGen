const {
  getAllProjects,
  getActiveProjectsData,
  getProjectSubtasks: getProjectSubtasksService,
} = require('./projects.service');

const getProjects = async (req, res) => {
try {
        const projects = await getAllProjects();

        res.status(200).json({
        success: true,
        data: projects,
        });
} 
catch (error) {
        console.error(error);

        res.status(500).json({
        success: false,
        message: 'Failed to fetch projects',
        });
}
};
const getActiveProjects = async (req, res) => {
try {
        const projects = await getActiveProjectsData();

        res.status(200).json({
        success: true,
        data: projects,
    });
} catch (error) {
        console.error(error);

        res.status(500).json({
        success: false,
        message: 'Failed to fetch active projects',
    });
}
};

const getProjectSubtasks = async (req, res) => {
try {
        const { projectId } = req.params;

        const subtasks = await getProjectSubtasksService(projectId);

        if (!subtasks) {
        return res.status(404).json({
            success: false,
            message: 'Project not found',
        });
        }

        res.status(200).json({
        success: true,
        data: subtasks,
    });
} 
catch (error) {
        console.error(error);

        res.status(500).json({
        success: false,
        message: 'Failed to fetch project subtasks',
    });
}
};

module.exports = {
getProjects,
getActiveProjects,
getProjectSubtasks,
};