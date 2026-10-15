const {
  getAllProjects,
  getActiveProjectsData,
  getProjectDetail,
  getProjectSubtasks: getProjectSubtasksService,
} = require('./projects.service');

const getEffectiveOrgId = (req) => {
  if (req.user && req.user.role === 'Admin' && typeof req.query.organisationId === 'string') {
    return req.query.organisationId.trim();
  }
  return req.user?.organisationId || req.headers['x-org-id'] || null;
};

const getProjects = async (req, res) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const projects = await getAllProjects({ organisationId });

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
    });
  }
};

const getActiveProjects = async (req, res) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const projects = await getActiveProjectsData({ organisationId });

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active projects',
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (typeof projectId !== 'string' || !projectId.trim() || projectId.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    const organisationId = getEffectiveOrgId(req);
    const project = await getProjectDetail(projectId.trim(), organisationId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project details',
    });
  }
};

const getProjectSubtasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (typeof projectId !== 'string' || !projectId.trim() || projectId.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    const organisationId = getEffectiveOrgId(req);
    const subtasks = await getProjectSubtasksService(projectId.trim(), organisationId);

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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project subtasks',
    });
  }
};

module.exports = {
  getProjects,
  getActiveProjects,
  getProjectById,
  getProjectSubtasks,
};