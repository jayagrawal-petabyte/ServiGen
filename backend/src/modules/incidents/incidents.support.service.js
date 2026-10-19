
const db = require('../../config/db');
const { addIncidentSlaDetails } = require('./incidents.sla.service');

const CLOSED_STATUSES = ['Resolved', 'Closed'];
const OPEN_STATUSES = ['Active', 'Pending', 'Actioned', 'On Hold'];

const PRIORITY_ORDER = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const TEAM_NAMES = {
  FIRST_LINE: '1st Line Support',
  SECOND_LINE: '2nd Line Support',
};

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const readQueryValue = (query, key) => {
  const value = query?.[key];

  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw createError(`Invalid ${key} query parameter`, 400);
  }

  return value.trim();
};

const getPagination = (query = {}) => {
  const rawPage = readQueryValue(query, 'page');
  const rawLimit = readQueryValue(query, 'limit');

  const pageNumber = Number.parseInt(rawPage || '1', 10);
  const limitNumber = Number.parseInt(rawLimit || '20', 10);

  return {
    page: Number.isFinite(pageNumber) ? Math.max(1, pageNumber) : 1,
    limit: Number.isFinite(limitNumber)
      ? Math.min(100, Math.max(1, limitNumber))
      : 20,
  };
};

const isAdmin = (user) =>
  typeof user?.role === 'string' &&
  user.role.toLowerCase() === 'admin';

const buildTeamWhere = (teamName, user, query = {}) => {
  const conditions = [
    { ticketType: 'Incident' },
    { status: { in: OPEN_STATUSES } },
    {
      OR: [
        { assignedTeam: teamName },
        { team: { is: { name: teamName } } },
      ],
    },
  ];

  // Never trust an organisation ID provided by the query string.
  // The authenticated user's organisation is the source of truth.
  if (!isAdmin(user)) {
    const organisationId =
      typeof user?.organisationId === 'string'
        ? user.organisationId.trim()
        : '';

    conditions.push({
      organisationId: organisationId || '__unassigned_organisation__',
    });
  }

  const status = readQueryValue(query, 'status');

  if (status) {
    const canonicalStatus = OPEN_STATUSES.find(
      (item) => item.toLowerCase() === status.toLowerCase()
    );

    if (!canonicalStatus) {
      throw createError('Invalid status filter', 400);
    }

    conditions.push({ status: canonicalStatus });
  }

  const priority = readQueryValue(query, 'priority');

  if (priority) {
    const priorities = ['Critical', 'High', 'Medium', 'Low', 'P1', 'P2'];
    const canonicalPriority = priorities.find(
      (item) => item.toLowerCase() === priority.toLowerCase()
    );

    if (!canonicalPriority) {
      throw createError('Invalid priority filter', 400);
    }

    conditions.push({ priority: canonicalPriority });
  }

  const search = readQueryValue(query, 'search');

  if (search) {
    if (search.length > 200) {
      throw createError('Search must not exceed 200 characters', 400);
    }

    conditions.push({
      OR: [
        { id: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  return { AND: conditions };
};

const ticketIncludes = {
  incident: true,
  organisation: true,
  team: true,
  assignedAgent: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      availability: true,
    },
  },
};

const mapSupportTicket = (ticket) => {
  const mapped = {
    id: ticket.id,
    ticketId: ticket.id,
    summary: ticket.summary,
    description: ticket.description,
    ticketType: ticket.ticketType,
    priority: ticket.priority,
    status: ticket.status,
    category: ticket.incident?.category ?? null,
    impact: ticket.incident?.impact ?? null,
    urgency: ticket.incident?.urgency ?? null,
    organisationId: ticket.organisationId,
    organisation: ticket.organisation?.name ?? null,
    siteName: ticket.siteName,
    assignedAgentId: ticket.assignedAgentId,
    assignedAgent: ticket.assignedAgent
      ? {
          id: ticket.assignedAgent.id,
          firstName: ticket.assignedAgent.firstName,
          lastName: ticket.assignedAgent.lastName,
          email: ticket.assignedAgent.email,
          availability: ticket.assignedAgent.availability,
        }
      : null,
    teamId: ticket.teamId,
    team: ticket.team?.name ?? ticket.assignedTeam ?? null,
    assignedTeam: ticket.assignedTeam ?? ticket.team?.name ?? null,
    slaTimeLeft: ticket.slaTimeLeft,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };

  return addIncidentSlaDetails(mapped);
};

const comparePriority = (a, b) => {
  const rankA = PRIORITY_ORDER[a.priority] ?? 99;
  const rankB = PRIORITY_ORDER[b.priority] ?? 99;

  if (rankA !== rankB) {
    return rankA - rankB;
  }

  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
};

/**
 * Lists open incidents belonging to a particular support team.
 * Results are scoped to the authenticated user's organisation,
 * except for Admin users.
 */
const listTeamIncidents = async (
  teamName,
  user,
  query = {}
) => {
  if (!Object.values(TEAM_NAMES).includes(teamName)) {
    throw createError('Invalid support team', 400);
  }

  const { page, limit } = getPagination(query);
  const where = buildTeamWhere(teamName, user, query);

  const tickets = await db.ticket.findMany({
    where,
    include: ticketIncludes,
  });

  const sorted = tickets
    .map(mapSupportTicket)
    .sort(comparePriority);

  const total = sorted.length;
  const startIndex = (page - 1) * limit;

  return {
    incidents: sorted.slice(startIndex, startIndex + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Returns Service Agents who belong to the requested support team.
 */
const getTeamAgents = async (teamName, user) => {
  if (!Object.values(TEAM_NAMES).includes(teamName)) {
    throw createError('Invalid support team', 400);
  }

  const team = await db.team.findUnique({
    where: { name: teamName },
    select: { id: true, name: true },
  });

  if (!team) {
    return { team: teamName, agents: [], total: 0 };
  }

  const memberships = await db.teamMembership.findMany({
    where: { teamId: team.id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          availability: true,
          organisationId: true,
        },
      },
    },
  });

  const agents = memberships
    .map((membership) => membership.user)
    .filter((agent) => {
      if (!agent || agent.role !== 'Service Agent') {
        return false;
      }

      if (isAdmin(user)) {
        return true;
      }

      return (
        typeof user?.organisationId === 'string' &&
        agent.organisationId === user.organisationId
      );
    })
    .map((agent) => ({
      id: agent.id,
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.email,
      availability: agent.availability,
    }))
    .sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`
      )
    );

  return {
    team: team.name,
    agents,
    total: agents.length,
  };
};

/**
 * Returns one open incident only when it belongs to the
 * requested team and the authenticated user's organisation.
 */
const getTeamIncidentById = async (
  teamName,
  ticketId,
  user
) => {
  if (!Object.values(TEAM_NAMES).includes(teamName)) {
    throw createError('Invalid support team', 400);
  }

  const id =
    typeof ticketId === 'string' ? ticketId.trim() : '';

  if (!id) {
    throw createError('Ticket ID is required', 400);
  }

  const ticket = await db.ticket.findFirst({
    where: {
      AND: [
        buildTeamWhere(teamName, user),
        { id: { equals: id, mode: 'insensitive' } },
      ],
    },
    include: ticketIncludes,
  });

  return ticket ? mapSupportTicket(ticket) : null;
};

module.exports = {
  TEAM_NAMES,
  listTeamIncidents,
  getTeamAgents,
  getTeamIncidentById,
};
