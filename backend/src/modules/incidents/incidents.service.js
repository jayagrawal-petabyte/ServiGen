
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

/**
 * Parse pagination parameters safely.
 * Page defaults to 1 and limit defaults to 20, capped at 100.
 */
const parsePagination = (query = {}) => {
  const pageValue = Array.isArray(query.page) ? query.page[0] : query.page;
  const limitValue = Array.isArray(query.limit) ? query.limit[0] : query.limit;

  const parsedPage = Number.parseInt(pageValue, 10);
  const parsedLimit = Number.parseInt(limitValue, 10);

  const page = Number.isFinite(parsedPage)
    ? Math.max(1, parsedPage)
    : 1;

  const limit = Number.isFinite(parsedLimit)
    ? Math.min(100, Math.max(1, parsedLimit))
    : DEFAULT_PAGE_SIZE;

  return { page, limit };
};

/**
 * Normalize a query value into a lowercase string.
 */
const toLowerScalar = (value) => {
  const scalar = Array.isArray(value) ? value[0] : value;

  if (typeof scalar !== 'string') {
    return null;
  }

  const normalized = scalar.trim().toLowerCase();
  return normalized || null;
};

/**
 * Safely perform case-insensitive text matching.
 */
const matchesText = (value, search) => {
  if (!search) return true;
  if (typeof value !== 'string') return false;

  return value.toLowerCase().includes(search);
};

/**
 * Apply list filters.
 *
 * organisation is a name search.
 * organisationId is an exact tenant/organisation ID filter.
 */
const filterIncidents = (incidents, query = {}) => {
  const priorityFilter = toLowerScalar(query.priority);
  const statusFilter = toLowerScalar(query.status);
  const categoryFilter = toLowerScalar(query.category);
  const teamFilter = toLowerScalar(query.assignedTeam);
  const orgFilter = toLowerScalar(query.organisation);
  const organisationIdFilter = toLowerScalar(query.organisationId);
  const searchFilter = toLowerScalar(query.search);

  return incidents.filter((incident) => {
    const matchesPriority =
      !priorityFilter ||
      (
        typeof incident.priority === 'string' &&
        incident.priority.toLowerCase() === priorityFilter
      );

    const matchesStatus =
      !statusFilter ||
      (
        typeof incident.status === 'string' &&
        incident.status.toLowerCase() === statusFilter
      );

    const category = incident.incident?.category;

    const matchesCategory =
      !categoryFilter ||
      (
        typeof category === 'string' &&
        category.toLowerCase() === categoryFilter
      );

    const matchesTeam =
      !teamFilter ||
      (
        typeof incident.assignedTeam === 'string' &&
        incident.assignedTeam.toLowerCase() === teamFilter
      );

    const matchesOrganisation =
      !orgFilter ||
      (
        typeof incident.organisation === 'string' &&
        incident.organisation.toLowerCase().includes(orgFilter)
      );

    const matchesOrganisationId =
      !organisationIdFilter ||
      (
        typeof incident.organisationId === 'string' &&
        incident.organisationId.trim().toLowerCase() ===
          organisationIdFilter
      );

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
      matchesOrganisationId &&
      matchesSearch
    );
  });
};

/**
 * Sort incidents from highest to lowest priority.
 * Unknown priorities are placed after the defined priorities.
 */
const sortByPriority = (incidents) => {
  return [...incidents].sort(
    (a, b) =>
      (PRIORITY_ORDER[a.priority] ?? 99) -
      (PRIORITY_ORDER[b.priority] ?? 99)
  );
};

/**
 * Paginate an already-filtered and sorted collection.
 */
const paginate = (items, query = {}) => {
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
 * Retrieve incidents with filtering, priority sorting and pagination.
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
 * Optional filters, including organisation scope, are applied first.
 */
const getPriorityAnalytics = async (query = {}) => {
  const incidents = await getIncidents();
  const filtered = filterIncidents(incidents, query);

  return filtered.reduce((result, incident) => {
    if (typeof incident.priority !== 'string') {
      return result;
    }

    result[incident.priority] = (result[incident.priority] || 0) + 1;
    return result;
  }, {});
};

/**
 * SCR-003
 * Group incidents by category.
 * Records without category information are excluded from the chart counts.
 */
const getCategoryAnalytics = async (query = {}) => {
  const incidents = await getIncidents();
  const filtered = filterIncidents(incidents, query);

  return filtered.reduce((result, incident) => {
    const category = incident.incident?.category;

    if (typeof category !== 'string' || !category.trim()) {
      return result;
    }

    result[category] = (result[category] || 0) + 1;
    return result;
  }, {});
};

/**
 * SCR-003
 * Retrieve recently updated incidents with filtering and pagination.
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
 * Retrieve the newest incident tickets by creation date.
 */
const getNewTickets = async (query = {}) => {
  const incidents = await getIncidents();
  const filtered = filterIncidents(incidents, query);

  const sorted = filtered
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
