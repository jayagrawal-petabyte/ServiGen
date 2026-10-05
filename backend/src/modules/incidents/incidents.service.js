const {
  getIncidents,
  getIncidentById,
} = require('./incidents.model');

const VALID_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

const PRIORITY_ORDER = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const DEFAULT_PAGE_SIZE = 20;

const parsePagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE)
  );

  return { page, limit };
};

const matchesText = (value, search) => {
  if (!search) return true;
  if (!value) return false;

  return value.toLowerCase().includes(search.toLowerCase());
};

const filterIncidents = (incidents, query = {}) => {
  return incidents.filter((incident) => {
    const matchesPriority =
      !query.priority ||
      incident.priority.toLowerCase() === query.priority.toLowerCase();

    const matchesStatus =
      !query.status ||
      incident.status.toLowerCase() === query.status.toLowerCase();

    const matchesCategory =
      !query.category ||
      incident.incident.category.toLowerCase() === query.category.toLowerCase();

    const matchesTeam =
      !query.assignedTeam ||
      incident.assignedTeam.toLowerCase() === query.assignedTeam.toLowerCase();

    const matchesOrganisation =
      !query.organisation ||
      incident.organisation
        .toLowerCase()
        .includes(query.organisation.toLowerCase());

    const matchesSearch =
      !query.search ||
      matchesText(incident.id, query.search) ||
      matchesText(incident.summary, query.search) ||
      matchesText(incident.description, query.search);

    return (
      matchesPriority &&
      matchesStatus &&
      matchesCategory &&
      matchesTeam &&
      matchesOrganisation &&
      matchesSearch
    );
  });
};

const sortByPriority = (incidents) => {
  return [...incidents].sort(
    (a, b) =>
      (PRIORITY_ORDER[a.priority] ?? 99) -
      (PRIORITY_ORDER[b.priority] ?? 99)
  );
};

const paginate = (items, query) => {
  const { page, limit } = parsePagination(query);
  const startIndex = (page - 1) * limit;

  return {
    items: items.slice(startIndex, startIndex + limit),
    pagination: {
      total: items.length,
      page,
      limit,
      totalPages: Math.ceil(items.length / limit),
    },
  };
};

/**
 * SCR-003
 * Retrieve incident list with filtering, priority sorting and pagination.
 */
const listIncidents = async (query = {}) => {
  const incidents = await getIncidents();

  const filtered = filterIncidents(incidents, query);
  const sorted = sortByPriority(filtered);

  const { items, pagination } = paginate(sorted, query);

  return {
    incidents: items,
    pagination,
  };
};

/**
 * SCR-003
 * Retrieve one incident by ticket ID.
 */
const getIncident = async (incidentId) => {
  return getIncidentById(incidentId);
};

/**
 * SCR-003
 * Group incidents by priority.
 */
const getPriorityAnalytics = async () => {
  const incidents = await getIncidents();

  return incidents.reduce((result, incident) => {
    result[incident.priority] = (result[incident.priority] || 0) + 1;
    return result;
  }, {});
};

/**
 * SCR-003
 * Group incidents by category.
 */
const getCategoryAnalytics = async () => {
  const incidents = await getIncidents();

  return incidents.reduce((result, incident) => {
    const category = incident.incident.category;

    result[category] = (result[category] || 0) + 1;
    return result;
  }, {});
};

/**
 * SCR-003
 * Recently created/updated incidents.
 */
const getRecentIncidents = async (query = {}) => {
  const incidents = await getIncidents();

  const sorted = [...incidents].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime()
  );

  return paginate(sorted, query);
};

/**
 * SCR-003
 * New tickets related to incidents.
 *
 * For now, "new tickets" is represented by the newest Incident tickets,
 * ordered by creation date.
 */
const getNewTickets = async (query = {}) => {
  const incidents = await getIncidents();

  const sorted = [...incidents]
    .filter((incident) => incident.ticketType === 'Incident')
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  return paginate(sorted, query);
};

module.exports = {
  VALID_PRIORITIES,
  PRIORITY_ORDER,
  parsePagination,
  listIncidents,
  getIncident,
  getPriorityAnalytics,
  getCategoryAnalytics,
  getRecentIncidents,
  getNewTickets,
};