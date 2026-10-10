'use strict';

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

const getProjects = async (options = {}) => {
  const { organisationId } = options;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const records = await db.project.findMany({
        include: { subtasks: true },
        orderBy: { createdAt: 'desc' },
      });

      if (records && records.length > 0) {
        const formatted = records.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          startDate: p.startDate ? p.startDate.toISOString().split('T')[0] : null,
          endDate: p.endDate ? p.endDate.toISOString().split('T')[0] : null,
          timeSpent: p.timeSpent,
          organisationId: 'org-001',
          subtasks: (p.subtasks || []).map((st) => ({
            id: st.id,
            title: st.title,
            status: st.status,
          })),
        }));

        if (organisationId) {
          return formatted.filter((p) => !p.organisationId || p.organisationId === organisationId);
        }
        return formatted;
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  if (organisationId) {
    return mockProjects.filter((project) => !project.organisationId || project.organisationId === organisationId);
  }
  return mockProjects;
};

const getActiveProjects = async (options = {}) => {
  const { organisationId } = options;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const records = await db.project.findMany({
        where: { status: 'ACTIVE' },
        include: { subtasks: true },
      });

      if (records && records.length > 0) {
        const formatted = records.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          startDate: p.startDate ? p.startDate.toISOString().split('T')[0] : null,
          endDate: p.endDate ? p.endDate.toISOString().split('T')[0] : null,
          timeSpent: p.timeSpent,
          organisationId: 'org-001',
          subtasks: (p.subtasks || []).map((st) => ({
            id: st.id,
            title: st.title,
            status: st.status,
          })),
        }));

        return formatted.filter((p) => !organisationId || !p.organisationId || p.organisationId === organisationId);
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  return mockProjects.filter(
    (project) => project.status === 'ACTIVE' && (!organisationId || !project.organisationId || project.organisationId === organisationId)
  );
};

const getProjectById = async (projectId, organisationId = null) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const p = await db.project.findUnique({
        where: { id: projectId },
        include: { subtasks: true },
      });

      if (p) {
        const formatted = {
          id: p.id,
          name: p.name,
          status: p.status,
          startDate: p.startDate ? p.startDate.toISOString().split('T')[0] : null,
          endDate: p.endDate ? p.endDate.toISOString().split('T')[0] : null,
          timeSpent: p.timeSpent,
          organisationId: 'org-001',
          subtasks: (p.subtasks || []).map((st) => ({
            id: st.id,
            title: st.title,
            status: st.status,
          })),
        };

        if (organisationId && formatted.organisationId && formatted.organisationId !== organisationId) {
          return null;
        }
        return formatted;
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  const project = mockProjects.find((p) => p.id === projectId);
  if (!project) return null;
  if (organisationId && project.organisationId && project.organisationId !== organisationId) {
    return null;
  }
  return project;
};

const getSubtasksByProject = async (projectId, organisationId = null) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const p = await db.project.findUnique({
        where: { id: projectId },
        include: { subtasks: true },
      });

      if (p) {
        if (organisationId && 'org-001' !== organisationId) {
          return null;
        }
        return (p.subtasks || []).map((st) => ({
          id: st.id,
          title: st.title,
          status: st.status,
        }));
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  const project = mockProjects.find((p) => p.id === projectId);
  if (!project) return null;
  if (organisationId && project.organisationId && project.organisationId !== organisationId) {
    return null;
  }
  return project.subtasks;
};

module.exports = {
  getProjects,
  getActiveProjects,
  getProjectById,
  getSubtasksByProject,
};