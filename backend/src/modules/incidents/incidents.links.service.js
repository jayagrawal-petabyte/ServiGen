'use strict';

const { prisma } = require('../../shared');

const RELATION_TYPES = Object.freeze({
  PARENT: 'PARENT',
  CHILD: 'CHILD',
  RELATED: 'RELATED',
  PROBLEM: 'PROBLEM',
  AFFECTED_CI: 'AFFECTED_CI',
});

const TARGET_FIELDS = [
  'targetTicketId',
  'problemId',
  'configurationItemId',
];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateUser = (user) => {
  if (!user || typeof user.id !== 'string' || !user.id.trim()) {
    throw createError('Authentication is required', 401);
  }
};

const buildTicketScope = (ticketId, user) => {
  validateUser(user);

  if (typeof ticketId !== 'string' || !ticketId.trim()) {
    throw createError('Ticket ID is required', 400);
  }

  const where = { id: ticketId.trim() };

  if (user.role !== 'Admin') {
    const organisationId =
      typeof user.organisationId === 'string'
        ? user.organisationId.trim()
        : '';

    if (!organisationId) {
      throw createError('Organisation access is required', 403);
    }

    where.organisationId = organisationId;
  }

  return where;
};

const normalizeRelationType = (value) => {
  if (typeof value !== 'string') {
    throw createError('A valid relationType is required', 400);
  }

  const relationType = value.trim().toUpperCase();

  if (!Object.values(RELATION_TYPES).includes(relationType)) {
    throw createError(
      'relationType must be PARENT, CHILD, RELATED, PROBLEM or AFFECTED_CI',
      400
    );
  }

  return relationType;
};

const normalizeIdentifier = (value, fieldName) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError(`${fieldName} is required`, 400);
  }

  const normalized = value.trim();

  if (normalized.length > 255) {
    throw createError(`${fieldName} is too long`, 400);
  }

  return normalized;
};

const getExpectedTargetField = (relationType) => {
  if (
    relationType === RELATION_TYPES.PARENT ||
    relationType === RELATION_TYPES.CHILD ||
    relationType === RELATION_TYPES.RELATED
  ) {
    return 'targetTicketId';
  }

  if (relationType === RELATION_TYPES.PROBLEM) {
    return 'problemId';
  }

  return 'configurationItemId';
};

const validateTarget = (input, relationType) => {
  const expectedField = getExpectedTargetField(relationType);

  const suppliedFields = TARGET_FIELDS.filter(
    (field) =>
      input[field] !== undefined &&
      input[field] !== null &&
      input[field] !== ''
  );

  if (
    suppliedFields.length !== 1 ||
    suppliedFields[0] !== expectedField
  ) {
    throw createError(
      `Exactly one valid target is required: ${expectedField}`,
      400
    );
  }

  return normalizeIdentifier(input[expectedField], expectedField);
};

// Convert existing PARENT/CHILD records into parent -> child edges.
const getHierarchyEdges = (links) => {
  return links.map((link) => {
    if (link.relationType === RELATION_TYPES.PARENT) {
      return {
        parentId: link.relatedTicketId,
        childId: link.ticketId,
      };
    }

    return {
      parentId: link.ticketId,
      childId: link.relatedTicketId,
    };
  });
};

const canReach = (startId, targetId, edges) => {
  const adjacency = new Map();

  for (const edge of edges) {
    if (!adjacency.has(edge.parentId)) {
      adjacency.set(edge.parentId, []);
    }

    adjacency.get(edge.parentId).push(edge.childId);
  }

  const visited = new Set();
  const pending = [startId];

  while (pending.length > 0) {
    const current = pending.pop();

    if (current === targetId) {
      return true;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    for (const next of adjacency.get(current) || []) {
      if (!visited.has(next)) {
        pending.push(next);
      }
    }
  }

  return false;
};

const assertNoHierarchyCycle = async (
  transaction,
  organisationId,
  sourceTicketId,
  targetTicketId,
  relationType
) => {
  if (
    relationType !== RELATION_TYPES.PARENT &&
    relationType !== RELATION_TYPES.CHILD
  ) {
    return;
  }

  const existingLinks = await transaction.ticketLink.findMany({
    where: {
      organisationId,
      relationType: {
        in: [
          RELATION_TYPES.PARENT,
          RELATION_TYPES.CHILD,
        ],
      },
    },
    select: {
      ticketId: true,
      relatedTicketId: true,
      relationType: true,
    },
  });

  const edges = getHierarchyEdges(existingLinks);

  const parentId =
    relationType === RELATION_TYPES.PARENT
      ? targetTicketId
      : sourceTicketId;

  const childId =
    relationType === RELATION_TYPES.PARENT
      ? sourceTicketId
      : targetTicketId;

  if (canReach(childId, parentId, edges)) {
    throw createError(
      'This relationship would create a parent/child cycle',
      409
    );
  }
};

const findDuplicateLink = async (
  transaction,
  sourceTicketId,
  organisationId,
  relationType,
  targetId
) => {
  const where = {
    ticketId: sourceTicketId,
    organisationId,
    relationType,
  };

  if (
    relationType === RELATION_TYPES.PARENT ||
    relationType === RELATION_TYPES.CHILD ||
    relationType === RELATION_TYPES.RELATED
  ) {
    where.relatedTicketId = targetId;
  } else if (relationType === RELATION_TYPES.PROBLEM) {
    where.problemId = targetId;
  } else {
    where.configurationItemId = targetId;
  }

  return transaction.ticketLink.findFirst({ where });
};

/**
 * POST /api/tickets/:id/links
 *
 * PARENT: targetTicketId is the parent of the source ticket.
 * CHILD: targetTicketId is a child of the source ticket.
 * RELATED: targetTicketId is a related ticket.
 * PROBLEM: problemId is an external Problem reference.
 * AFFECTED_CI: configurationItemId references a ConfigurationItem.
 */
const createTicketLink = async (ticketId, input, user) => {
  const sourceWhere = buildTicketScope(ticketId, user);

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError('Request body must be a valid object', 400);
  }

  const relationType = normalizeRelationType(input.relationType);
  const targetId = validateTarget(input, relationType);

  return prisma.$transaction(async (transaction) => {
    const sourceTicket = await transaction.ticket.findFirst({
      where: sourceWhere,
      select: {
        id: true,
        organisationId: true,
      },
    });

    if (!sourceTicket) {
      throw createError('Ticket not found', 404);
    }

    if (
      relationType === RELATION_TYPES.PARENT ||
      relationType === RELATION_TYPES.CHILD ||
      relationType === RELATION_TYPES.RELATED
    ) {
      if (targetId === sourceTicket.id) {
        throw createError('A ticket cannot be linked to itself', 400);
      }

      const targetTicket = await transaction.ticket.findFirst({
        where: {
          id: targetId,
          organisationId: sourceTicket.organisationId,
        },
        select: {
          id: true,
          organisationId: true,
        },
      });

      if (!targetTicket) {
        throw createError(
          'Related ticket not found in the same organisation',
          404
        );
      }

      await assertNoHierarchyCycle(
        transaction,
        sourceTicket.organisationId,
        sourceTicket.id,
        targetTicket.id,
        relationType
      );
    }

    if (relationType === RELATION_TYPES.AFFECTED_CI) {
      const configurationItem =
        await transaction.configurationItem.findFirst({
          where: {
            id: targetId,
            organisationId: sourceTicket.organisationId,
          },
          select: {
            id: true,
          },
        });

      if (!configurationItem) {
        throw createError(
          'Configuration Item not found in the same organisation',
          404
        );
      }
    }

    // A Problem model does not currently exist in this Prisma schema.
    // Store its ID as an external reference scoped to the source ticket's tenant.

    const duplicate = await findDuplicateLink(
      transaction,
      sourceTicket.id,
      sourceTicket.organisationId,
      relationType,
      targetId
    );

    if (duplicate) {
      throw createError('This ticket relationship already exists', 409);
    }

    const data = {
      ticketId: sourceTicket.id,
      organisationId: sourceTicket.organisationId,
      createdById: user.id,
      relationType,
      relatedTicketId: null,
      problemId: null,
      configurationItemId: null,
    };

    if (
      relationType === RELATION_TYPES.PARENT ||
      relationType === RELATION_TYPES.CHILD ||
      relationType === RELATION_TYPES.RELATED
    ) {
      data.relatedTicketId = targetId;
    } else if (relationType === RELATION_TYPES.PROBLEM) {
      data.problemId = targetId;
    } else {
      data.configurationItemId = targetId;
    }

    try {
      return await transaction.ticketLink.create({
        data,
        include: {
          relatedTicket: {
            select: {
              id: true,
              summary: true,
              status: true,
              priority: true,
              organisationId: true,
            },
          },
          configurationItem: {
            select: {
              id: true,
              name: true,
              tag: true,
              type: true,
              status: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw createError('This ticket relationship already exists', 409);
      }

      throw error;
    }
  });
};

/**
 * GET /api/tickets/:id/linked
 *
 * Returns both outgoing and incoming ticket relationships.
 */
const getTicketLinks = async (ticketId, user) => {
  const sourceWhere = buildTicketScope(ticketId, user);

  const sourceTicket = await prisma.ticket.findFirst({
    where: sourceWhere,
    select: {
      id: true,
      organisationId: true,
    },
  });

  if (!sourceTicket) {
    throw createError('Ticket not found', 404);
  }

  const links = await prisma.ticketLink.findMany({
    where: {
      organisationId: sourceTicket.organisationId,
      OR: [
        { ticketId: sourceTicket.id },
        { relatedTicketId: sourceTicket.id },
      ],
    },
    include: {
      ticket: {
        select: {
          id: true,
          summary: true,
          status: true,
          priority: true,
        },
      },
      relatedTicket: {
        select: {
          id: true,
          summary: true,
          status: true,
          priority: true,
        },
      },
      configurationItem: {
        select: {
          id: true,
          name: true,
          tag: true,
          type: true,
          status: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: [
      { createdAt: 'asc' },
      { id: 'asc' },
    ],
  });

  const outgoing = links.filter(
    (link) => link.ticketId === sourceTicket.id
  );

  const incoming = links.filter(
    (link) => link.relatedTicketId === sourceTicket.id
  );

  return {
    ticketId: sourceTicket.id,
    outgoing,
    incoming,
    total: links.length,
  };
};

module.exports = {
  RELATION_TYPES,
  createTicketLink,
  getTicketLinks,
};
