const {
  getAllProjects,
  getActiveProjectsData,
  getProjectDetail,
  getProjectDependenciesData,
  createProjectDependency,
  getProjectResourcesData,
  getProjectSubtasks: getProjectSubtasksService,
  createProjectSubtask: createProjectSubtaskService,
  createProject: createProjectService,
} = require('./projects.service');



const getEffectiveOrgId = (req, res) => {
  if (!req.user || !req.user.id || !req.user.role) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return undefined;
  }

  if (req.user.role === 'Admin') {
    const organisationId = req.query.organisationId;

    return typeof organisationId === 'string' && organisationId.trim()
      ? organisationId.trim()
      : null;
  }

  const organisationId = req.user.organisationId;

  if (typeof organisationId !== 'string' || !organisationId.trim()) {
    res.status(403).json({
      success: false,
      message: 'Organisation access is required',
    });
    return undefined;
  }

  return organisationId.trim();
};

const getProjects = async (req, res) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const projects = await getAllProjects({ organisationId });

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
    });
  }
};

const getActiveProjects = async (req, res) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const projects = await getActiveProjectsData({ organisationId });

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active projects',
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId || projectId.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const project = await getProjectDetail(projectId.trim(), organisationId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch project details',
    });
  }
};

const getProjectSubtasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId || projectId.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const subtasks = await getProjectSubtasksService(
      projectId.trim(),
      organisationId
    );

    if (subtasks === null) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: subtasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch project subtasks',
    });
  }
};

const createProjectSubtask = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId || projectId.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const subtask = await createProjectSubtaskService(
      projectId.trim(),
      organisationId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: 'Subtask created successfully',
      data: subtask,
    });
  } catch (error) {
    if (error.code === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (error.message && !error.code) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create subtask',
    });
  }
};

const createProject = async (req, res) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    if (!organisationId) {
      return res.status(400).json({
        success: false,
        message: 'Organisation ID is required for project creation',
      });
    }

    const project = await createProjectService({
      ...req.body,
      organisationId,
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    if (
      error.code === 'P2002'
    ) {
      return res.status(409).json({
        success: false,
        message: 'A project with this code already exists in the organisation',
      });
    }

    if (error.message && !error.code) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create project',
    });
  }
};


const getProjectDependencies = async (req, res) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    if (!organisationId) {
      return res.status(400).json({
        success: false,
        message: 'Organisation ID is required',
      });
    }

    const dependencies = await getProjectDependenciesData(
      req.params.projectId,
      organisationId
    );

    return res.status(200).json({
      success: true,
      data: dependencies,
    });
  } catch (error) {
    if (error.code === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch project dependencies',
    });
  }
};

const addProjectDependency = async (req, res) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    if (!organisationId) {
      return res.status(400).json({
        success: false,
        message: 'Organisation ID is required',
      });
    }

    const result = await createProjectDependency(
      req.params.projectId,
      organisationId,
      req.body
    );

    const isCreated = result.operation === 'CREATED';

    return res.status(isCreated ? 201 : 200).json({
      success: true,
      message: isCreated
        ? 'Project dependency created successfully'
        : 'Project dependency updated successfully',
      operation: result.operation,
      data: result.dependency,
    });
  } catch (error) {
    if (error.code === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Dependency conflict occurred',
      });
    }

    if (error.name === 'Error') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create or update project dependency',
    });
  }
};

const getProjectResources = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (
      typeof projectId !== 'string' ||
      !projectId.trim() ||
      projectId.length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const resources = await getProjectResourcesData(
      projectId.trim(),
      organisationId
    );

    return res.status(200).json({
      success: true,
      data: resources,
    });
  } catch (error) {
    if (error.code === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch project resources',
    });
  }
};

module.exports = {
  getProjects,
  getActiveProjects,
  getProjectById,
  getProjectDependencies,
  addProjectDependency,
  getProjectSubtasks,
  createProjectSubtask,
  createProject,
  getProjectResources,
};
