const { randomUUID } = require('crypto');
const db = require('../../config/db');

const mockProjects = [
  {
    id: 'P-001',
    name: 'Network Upgrade',
    code: 'PRJ-NET-001',
    description: 'Corporate network infrastructure upgrade',
    priority: 'HIGH',
    status: 'ACTIVE',
    startDate: '2026-09-01',
    endDate: '2026-10-15',
    timeSpent: 42,
    organisationId: 'org-001',
    subtasks: [
      {
        id: 'ST-001',
        title: 'Router Configuration',
        status: 'COMPLETED',
      },
      {
        id: 'ST-002',
        title: 'Network Testing',
        status: 'PENDING',
      },
    ],
  },
  {
    id: 'P-002',
    name: 'Server Migration',
    code: 'PRJ-SRV-002',
    description: 'Migration to cloud servers',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    startDate: '2026-09-10',
    endDate: '2026-11-01',
    timeSpent: 30,
    organisationId: 'org-001',
    subtasks: [
      {
        id: 'ST-003',
        title: 'Backup Data',
        status: 'COMPLETED',
      },
      {
        id: 'ST-004',
        title: 'Migrate Server',
        status: 'COMPLETED',
      },
      {
        id: 'ST-005',
        title: 'Post Migration Testing',
        status: 'PENDING',
      },
    ],
  },
  {
    id: 'P-003',
    name: 'Employee Portal',
    code: 'PRJ-PORT-003',
    description: 'New internal employee portal',
    priority: 'LOW',
    status: 'COMPLETED',
    startDate: '2026-07-01',
    endDate: '2026-08-30',
    timeSpent: 65,
    organisationId: 'org-001',
    subtasks: [
      {
        id: 'ST-006',
        title: 'Frontend Development',
        status: 'COMPLETED',
      },
    ],
  },
];

const mockDependencies = [];
const mockResources = [];

const useMockData = process.env.NODE_ENV === 'test';
const allowOfflineMocks = process.env.ALLOW_OFFLINE_MOCKS === 'true';

const matchesOrganisation = (project, organisationId) => {
  if (!organisationId) return true;
  return project.organisationId === organisationId;
};

const getMockProjects = (organisationId) => {
  return mockProjects.filter((project) =>
    matchesOrganisation(project, organisationId)
  );
};

const formatDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString().slice(0, 10);
};

const formatProject = (project) => ({
  id: project.id,
  name: project.name,
  description: project.description ?? null,
  code: project.code ?? null,
  status: project.status,
  priority: project.priority ?? null,
  startDate: formatDate(project.startDate),
  endDate: formatDate(project.endDate),
  timeSpent: project.timeSpent,
  organisationId: project.organisationId || null,
  ownerId: project.ownerId ?? null,
  targetEndDate: formatDate(project.endDate),
  subtasks: (project.subtasks || []).map((subtask) => ({
    id: subtask.id,
    title: subtask.title,
    status: subtask.status,
  })),
});

const getProjects = async ({ organisationId = null } = {}) => {
  if (useMockData) {
    return getMockProjects(organisationId);
  }

  try {
    const records = await db.project.findMany({
      where: organisationId ? { organisationId } : {},
      include: {
        subtasks: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map(formatProject);
  } catch (error) {
    if (allowOfflineMocks) {
      return getMockProjects(organisationId);
    }

    throw error;
  }
};

const getActiveProjects = async ({ organisationId = null } = {}) => {
  if (useMockData) {
    return getMockProjects(organisationId).filter(
      (project) => project.status === 'ACTIVE'
    );
  }

  try {
    const records = await db.project.findMany({
      where: {
        status: 'ACTIVE',
        ...(organisationId ? { organisationId } : {}),
      },
      include: {
        subtasks: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map(formatProject);
  } catch (error) {
    if (allowOfflineMocks) {
      return getMockProjects(organisationId).filter(
        (project) => project.status === 'ACTIVE'
      );
    }

    throw error;
  }
};

const getProjectById = async (projectId, organisationId = null) => {
  if (useMockData) {
    return getMockProjects(organisationId).find(
      (project) => project.id === projectId
    ) || null;
  }

  try {
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        ...(organisationId ? { organisationId } : {}),
      },
      include: {
        subtasks: true,
      },
    });

    return project ? formatProject(project) : null;
  } catch (error) {
    if (allowOfflineMocks) {
      return getMockProjects(organisationId).find(
        (project) => project.id === projectId
      ) || null;
    }

    throw error;
  }
};

const getSubtasksByProject = async (projectId, organisationId = null) => {
  if (useMockData) {
    const project = getMockProjects(organisationId).find(
      (item) => item.id === projectId
    );

    return project ? project.subtasks : null;
  }

  try {
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        ...(organisationId ? { organisationId } : {}),
      },
      include: {
        subtasks: true,
      },
    });

    if (!project) return null;

    return (project.subtasks || []).map((subtask) => ({
      id: subtask.id,
      title: subtask.title,
      status: subtask.status,
    }));
  } catch (error) {
    if (allowOfflineMocks) {
      const project = getMockProjects(organisationId).find(
        (item) => item.id === projectId
      );

      return project ? project.subtasks : null;
    }

    throw error;
  }
};

const createSubtaskRecord = async (subtaskData) => {
  const { projectId, title, status } = subtaskData;
  if (useMockData) {
    const project = mockProjects.find((p) => p.id === projectId);
    if (!project) return null;
    const newSubtask = {
      id: `ST-${Date.now().toString().slice(-4)}`,
      title,
      status: status || 'PENDING',
    };
    if (!project.subtasks) project.subtasks = [];
    project.subtasks.push(newSubtask);
    return newSubtask;
  }

  try {
    return await db.projectSubtask.create({
      data: {
        id: randomUUID(),
        projectId,
        title,
        status: status || 'PENDING',
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });
  } catch (error) {
    if (allowOfflineMocks) {
      const project = mockProjects.find((p) => p.id === projectId);
      const newSubtask = {
        id: `ST-${Date.now().toString().slice(-4)}`,
        title,
        status: status || 'PENDING',
      };
      if (project) {
        if (!project.subtasks) project.subtasks = [];
        project.subtasks.push(newSubtask);
      }
      return newSubtask;
    }
    throw error;
  }
};

const findProjectOwner = async (ownerId, organisationId) => {
  if (useMockData) {
    return { id: ownerId };
  }

  try {
    return await db.user.findFirst({
      where: {
        id: ownerId,
        organisationId,
      },
      select: {
        id: true,
      },
    });
  } catch (error) {
    if (allowOfflineMocks) {
      return { id: ownerId };
    }
    throw error;
  }
};

const createProjectRecord = async (projectData) => {
  const {
    organisationId,
    title,
    description,
    code,
    status,
    priority,
    startDate,
    targetEndDate,
    ownerId,
  } = projectData;

  if (useMockData) {
    const existing = mockProjects.find(
      (p) => p.organisationId === organisationId && p.code === code
    );
    if (existing) {
      const err = new Error('A project with this code already exists in the organisation');
      err.code = 'P2002';
      throw err;
    }

    const created = {
      id: randomUUID(),
      organisationId,
      name: title.trim(),
      description: description || null,
      code,
      status: status || 'ACTIVE',
      priority: priority || null,
      startDate: startDate ? new Date(startDate).toISOString().slice(0, 10) : null,
      endDate: targetEndDate ? new Date(targetEndDate).toISOString().slice(0, 10) : null,
      timeSpent: 0,
      ownerId: ownerId || null,
      subtasks: [],
    };
    mockProjects.push(created);
    return formatProject(created);
  }

  try {
    const project = await db.project.create({
      data: {
        id: randomUUID(),
        organisationId,
        name: title.trim(),
        description,
        code,
        status: status || 'ACTIVE',
        priority,
        startDate: startDate ? new Date(startDate) : null,
        endDate: targetEndDate ? new Date(targetEndDate) : null,
        timeSpent: 0,
        ownerId: ownerId || null,
      },
      include: {
        subtasks: true,
      },
    });
    return formatProject(project);
  } catch (error) {
    if (allowOfflineMocks) {
      const created = {
        id: randomUUID(),
        organisationId,
        name: title.trim(),
        description: description || null,
        code,
        status: status || 'ACTIVE',
        priority: priority || null,
        startDate: startDate ? new Date(startDate).toISOString().slice(0, 10) : null,
        endDate: targetEndDate ? new Date(targetEndDate).toISOString().slice(0, 10) : null,
        timeSpent: 0,
        ownerId: ownerId || null,
        subtasks: [],
      };
      mockProjects.push(created);
      return formatProject(created);
    }
    throw error;
  }
};


const getProjectDependencies = async (projectId, organisationId = null) => {
  if (useMockData) {
    const project = getMockProjects(organisationId).find(p => p.id === projectId);
    if (!project) return null;
    return mockDependencies.filter(d => d.projectId === projectId);
  }

  try {
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        ...(organisationId ? { organisationId } : {}),
      },
      select: {
        id: true,
      },
    });

    if (!project) return null;

    return await db.projectSubtaskDependency.findMany({
      where: {
        subtask: {
          is: { projectId },
        },
        dependsOnSubtask: {
          is: { projectId },
        },
      },
      include: {
        subtask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        dependsOnSubtask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  } catch (error) {
    if (allowOfflineMocks) {
      const project = getMockProjects(organisationId).find(p => p.id === projectId);
      if (!project) return null;
      return mockDependencies.filter(d => d.projectId === projectId);
    }
    throw error;
  }
};

const createProjectDependencyRecord = async (dependencyData) => {
  const {
    subtaskId,
    dependsOnSubtaskId,
    dependencyType,
    lagTime,
  } = dependencyData;

  if (useMockData) {
    const idx = mockDependencies.findIndex(
      d => d.subtaskId === subtaskId && d.dependsOnSubtaskId === dependsOnSubtaskId
    );
    const record = {
      id: randomUUID(),
      subtaskId,
      dependsOnSubtaskId,
      dependencyType: dependencyType || 'FINISH_TO_START',
      lagTime: Number(lagTime) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtask: { id: subtaskId, title: 'Mock Subtask', status: 'PENDING' },
      dependsOnSubtask: { id: dependsOnSubtaskId, title: 'Mock Dependency', status: 'COMPLETED' },
    };
    if (idx >= 0) {
      mockDependencies[idx] = { ...mockDependencies[idx], ...record };
      return mockDependencies[idx];
    }
    mockDependencies.push(record);
    return record;
  }

  try {
    return await db.projectSubtaskDependency.upsert({
      where: {
        subtaskId_dependsOnSubtaskId: {
          subtaskId,
          dependsOnSubtaskId,
        },
      },
      create: {
        subtaskId,
        dependsOnSubtaskId,
        dependencyType,
        lagTime,
      },
      update: {
        dependencyType,
        lagTime,
      },
      include: {
        subtask: true,
        dependsOnSubtask: true,
      },
    });
  } catch (error) {
    if (allowOfflineMocks) {
      const record = {
        id: randomUUID(),
        subtaskId,
        dependsOnSubtaskId,
        dependencyType: dependencyType || 'FINISH_TO_START',
        lagTime: Number(lagTime) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockDependencies.push(record);
      return record;
    }
    throw error;
  }
};

const getProjectSubtaskForDependency = async (subtaskId, projectId) => {
  if (useMockData) {
    const project = mockProjects.find(p => p.id === projectId);
    const subtask = project?.subtasks?.find(s => s.id === subtaskId);
    return subtask ? { id: subtask.id, projectId } : null;
  }

  try {
    return await db.projectSubtask.findFirst({
      where: {
        id: subtaskId,
        projectId,
      },
      select: {
        id: true,
        projectId: true,
      },
    });
  } catch (error) {
    if (allowOfflineMocks) {
      const project = mockProjects.find(p => p.id === projectId);
      const subtask = project?.subtasks?.find(s => s.id === subtaskId);
      return subtask ? { id: subtask.id, projectId } : null;
    }
    throw error;
  }
};


const getProjectResources = async (projectId, organisationId = null) => {
  if (useMockData) {
    const project = getMockProjects(organisationId).find(p => p.id === projectId);
    if (!project) return null;
    return mockResources.filter(r => r.projectId === projectId);
  }

  try {
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        ...(organisationId ? { organisationId } : {}),
      },
      select: {
        id: true,
        organisationId: true,
      },
    });

    if (!project) return null;

    return await db.projectResourceAssignment.findMany({
      where: {
        projectId,
        ...(project.organisationId
          ? {
              user: {
                is: {
                  organisationId: project.organisationId,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        allocatedHours: true,
        capacityHours: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            availability: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  } catch (error) {
    if (allowOfflineMocks) {
      const project = getMockProjects(organisationId).find(p => p.id === projectId);
      if (!project) return null;
      return mockResources.filter(r => r.projectId === projectId);
    }
    throw error;
  }
};

module.exports = {
  getProjects,
  getActiveProjects,
  getProjectById,
  getSubtasksByProject,
  createSubtaskRecord,
  findProjectOwner,
  createProjectRecord,
  getProjectDependencies,
  createProjectDependencyRecord,
  getProjectSubtaskForDependency,
  getProjectResources,
};
