const projects = [
  {
    id: 'P-001',
    name: 'Network Upgrade',
    status: 'ACTIVE',
    startDate: '2026-09-01',
    endDate: '2026-10-15',
    timeSpent: 42,
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
    subtasks: [
      {
        id: 'ST-006',
        title: 'Frontend Development',
        status: 'COMPLETED',
      },
    ],
  },
];

const getProjects = async () => {
  return projects;
};

const getActiveProjects = async () => {
  return projects.filter((project) => project.status === 'ACTIVE');
};

const getSubtasksByProject = async (projectId) => {
  const project = projects.find((project) => project.id === projectId);

  return project ? project.subtasks : null;
};

module.exports = {
  getProjects,
  getActiveProjects,
  getSubtasksByProject,
};