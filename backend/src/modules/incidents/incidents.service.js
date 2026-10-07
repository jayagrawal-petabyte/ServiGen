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

const toLowerScalar = (val) => {
  if (typeof val === 'string') return val.trim().toLowerCase();
  if (Array.isArray(val) && typeof val[0] === 'string') return val[0].trim().toLowerCase();
  return null;
};

const filterIncidents = (incidents, query = {}) => {
  const priorityFilter = toLowerScalar(query.priority);
  const statusFilter = toLowerScalar(query.status);
  const categoryFilter = toLowerScalar(query.category);
  const teamFilter = toLowerScalar(query.assignedTeam);
  const orgFilter = toLowerScalar(query.organisation);
  const searchFilter = toLowerScalar(query.search);

  return incidents.filter((incident) => {
    const matchesPriority =
      !priorityFilter ||
      incident.priority.toLowerCase() === priorityFilter;

    const matchesStatus =
      !statusFilter ||
      incident.status.toLowerCase() === statusFilter;

    const matchesCategory =
      !categoryFilter ||
      incident.incident.category.toLowerCase() === categoryFilter;

    const matchesTeam =
      !teamFilter ||
      incident.assignedTeam.toLowerCase() === teamFilter;

    const matchesOrganisation =
      !orgFilter ||
      incident.organisation.toLowerCase().includes(orgFilter);

    const matchesSearch =
      !searchFilter ||
      matchesText(incident.id, searchFilter) ||
      matchesText(incident.summary, searchFilter) ||
      matchesText(incident.description, searchFilter);

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
const getPriorityAnalytics = async (query = {}) => {
  const incidents = await getIncidents();
  const filtered = filterIncidents(incidents, query);

  return filtered.reduce((result, incident) => {
    result[incident.priority] = (result[incident.priority] || 0) + 1;
    return result;
  }, {});
};

/**
 * SCR-003
 * Group incidents by category.
 */
const getCategoryAnalytics = async (query = {}) => {
  const incidents = await getIncidents();
  const filtered = filterIncidents(incidents, query);

  return filtered.reduce((result, incident) => {
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
  const filtered = filterIncidents(incidents, query);

  const sorted = [...filtered].sort(
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
  const filtered = filterIncidents(incidents, query);

  const sorted = [...filtered]
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