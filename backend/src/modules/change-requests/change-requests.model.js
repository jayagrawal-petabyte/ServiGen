const changeRequests = [
  {
    id: 'CR-001',
    agent: 'agent-001',
    summary: 'Upgrade database server to v14',
    changeType: 'Normal',
    status: 'Active',
    ciTag: 'DB-001',
    relatedService: 'Customer Database',
    startDate: '2026-10-01T00:00:00Z',
    endDate: '2026-10-02T04:00:00Z',
    organisationId: 'org-001',
  },
  {
    id: 'CR-002',
    agent: 'agent-002',
    summary: 'Emergency patch for zero-day vulnerability',
    changeType: 'Emergency',
    status: 'Completed',
    ciTag: 'WEB-001',
    relatedService: 'Web Server',
    startDate: '2026-09-25T10:00:00Z',
    endDate: '2026-09-25T12:00:00Z',
    organisationId: 'org-001',
  },
  {
    id: 'CR-003',
    agent: 'agent-001',
    summary: 'Routine network maintenance',
    changeType: 'Standard',
    status: 'Pending',
    ciTag: 'NET-001',
    relatedService: 'Internal Network',
    startDate: '2026-10-15T02:00:00Z',
    endDate: '2026-10-15T06:00:00Z',
    organisationId: 'org-001',
  },
];

const getChangeRequests = async (options = {}) => {
  const { organisationId } = options;
  if (organisationId) {
    return changeRequests.filter((cr) => !cr.organisationId || cr.organisationId === organisationId);
  }
  return changeRequests;
};

const getChangeRequestById = async (id, organisationId = null) => {
  const cr = changeRequests.find((item) => item.id === id);
  if (!cr) return null;
  if (organisationId && cr.organisationId && cr.organisationId !== organisationId) {
    return null;
  }
  return cr;
};

const getActiveChangeRequests = async (options = {}) => {
  const { organisationId } = options;
  return changeRequests.filter((cr) =>
    cr.status === 'Active' && (!organisationId || !cr.organisationId || cr.organisationId === organisationId)
  );
};

module.exports = {
  getChangeRequests,
  getChangeRequestById,
  getActiveChangeRequests,
};