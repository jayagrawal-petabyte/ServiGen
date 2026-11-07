const { randomUUID } = require('crypto');
const db = require('../../config/db');

const mockProjects = [
  {
    id: 'P-001',
    name: 'Network Upgrade',
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

const findProjectOwner = async (ownerId, organisationId) => {
  return db.user.findFirst({
    where: {
      id: ownerId,
      organisationId,
    },
    select: {
      id: true,
    },
  });
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

  return db.project.create({
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
};


const getProjectDependencies = async (projectId, organisationId = null) => {
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

  return db.projectSubtaskDependency.findMany({
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
};

const createProjectDependencyRecord = async (dependencyData) => {
  const {
    subtaskId,
    dependsOnSubtaskId,
    dependencyType,
    lagTime,
  } = dependencyData;

  return db.projectSubtaskDependency.upsert({
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
};

const getProjectSubtaskForDependency = async (subtaskId, projectId) => {
  return db.projectSubtask.findFirst({
    where: {
      id: subtaskId,
      projectId,
    },
    select: {
      id: true,
      projectId: true,
    },
  });
};


const getProjectResources = async (projectId, organisationId = null) => {
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

  return db.projectResourceAssignment.findMany({
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
};

module.exports = {
  getProjects,
  getActiveProjects,
  getProjectById,
  getSubtasksByProject,
  findProjectOwner,
  createProjectRecord,
  getProjectDependencies,
  createProjectDependencyRecord,
  getProjectSubtaskForDependency,
  getProjectResources,
};
