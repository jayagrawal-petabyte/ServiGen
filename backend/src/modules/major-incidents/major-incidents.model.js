const majorIncidents = [
  {
    id: 'MI-001',
    title: 'Customer portal unavailable',
    description: 'Customers cannot access the self-service portal.',
    status: 'Investigating',
    priority: 'P1',
    impact: 'Customer-facing portal is unavailable.',
    affectedServices: ['Customer Portal', 'Authentication API'],
    commander: 'Unassigned',
    startedAt: '2026-09-25T08:00:00.000Z',
    resolvedAt: null,
    updates: [
      {
        id: 'MI-001-U1',
        message: 'Incident declared and investigation started.',
        author: 'System',
        createdAt: '2026-09-25T08:05:00.000Z',
      },
    ],
  },
];

const getMajorIncidents = async (filters = {}) => {
  return majorIncidents.filter((incident) => {
    const matchesStatus = !filters.status || incident.status === filters.status;
    const matchesPriority = !filters.priority || incident.priority === filters.priority;

    return matchesStatus && matchesPriority;
  });
};

const getMajorIncidentById = async (id) => {
  return majorIncidents.find((incident) => incident.id === id) || null;
};

const saveMajorIncident = async (incident) => {
  majorIncidents.push(incident);
  return incident;
};

const updateMajorIncident = async (id, changes) => {
  const incident = await getMajorIncidentById(id);

  if (!incident) {
    return null;
  }

  Object.assign(incident, changes);
  return incident;
};

const addIncidentUpdate = async (id, update) => {
  const incident = await getMajorIncidentById(id);

  if (!incident) {
    return null;
  }

  incident.updates.push(update);
  return incident;
};

module.exports = {
  getMajorIncidents,
  getMajorIncidentById,
  saveMajorIncident,
  updateMajorIncident,
  addIncidentUpdate,
};
