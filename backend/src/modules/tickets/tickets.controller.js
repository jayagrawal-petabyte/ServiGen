'use strict';

const { prisma } = require('../../shared');

const {
  calculateSlaStatus,
  prepareSlaStatusUpdate,
} = require('../incidents/incidents.sla.service');

const addSlaStatus = (ticket) => ({
  ...ticket,
  ...calculateSlaStatus(ticket),
});

const UNASSIGNED_ORGANISATION_ID = '__unassigned_organisation__';

const buildOrganisationScope = (user) => {
  if (user?.role === 'Admin') {
    return {};
  }

  const organisationId =
    typeof user?.organisationId === 'string'
      ? user.organisationId.trim()
      : '';

  return {
    organisationId: organisationId || UNASSIGNED_ORGANISATION_ID,
  };
};

const TICKET_STATUS_ALIASES = Object.freeze({
  active: 'Active',
  pending: 'Pending',
  actioned: 'Actioned',
  'on hold': 'On Hold',
  'on-hold': 'On Hold',
  onhold: 'On Hold',
  resolved: 'Resolved',
  closed: 'Closed',
});

const normalizeTicketStatus = (status) => {
  if (typeof status !== 'string') {
    return null;
  }

  return TICKET_STATUS_ALIASES[status.trim().toLowerCase()] || null;
};

/**
 * GET /api/tickets
 */
const listTickets = async (req, res, next) => {
  try {
    const {
      status,
      ticketType,
      priority,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const where = {};

    if (status) {
      let statusVal = status;
      const lower = statusVal.toLowerCase();

      if (lower === 'new') statusVal = 'Active';
      else if (lower === 'on-hold' || lower === 'onhold') {
        statusVal = 'On Hold';
      }

      where.status = { equals: statusVal, mode: 'insensitive' };
    }

    if (ticketType) {
      where.ticketType = { equals: ticketType, mode: 'insensitive' };
    }

    if (priority) {
      where.priority = { equals: priority, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { summary: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    Object.assign(where, buildOrganisationScope(req.user));

    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * take;

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
            },
          },
          assignedAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              availability: true,
            },
          },
          incident: true,
          serviceRequest: {
            include: { serviceCatalogueItem: true },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: tickets.map(addSlaStatus),
      pagination: {
        total,
        page: parseInt(page, 10) || 1,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/tickets/:id
 */
const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        ...buildOrganisationScope(req.user),
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            phoneNumber: true,
            networkLogin: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            availability: true,
          },
        },
        incident: true,
        serviceRequest: {
          include: { serviceCatalogueItem: true },
        },
        approvals: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `Ticket ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: addSlaStatus(ticket),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/tickets/:id/status
 *
 * Persists SLA deadlines and handles On Hold pause/resume transitions.
 */
const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body =
      req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? req.body
        : {};

    const { status, holdReason } = body;

    if (
      status !== undefined &&
      (typeof status !== 'string' || !status.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid ticket status is required',
      });
    }

    if (
      holdReason !== undefined &&
      holdReason !== null &&
      typeof holdReason !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Hold reason must be a string or null',
      });
    }

    if (status === undefined && holdReason === undefined) {
      return res.status(400).json({
        success: false,
        message: 'No ticket status changes were provided',
      });
    }

    const normalizedStatus =
      status === undefined ? undefined : normalizeTicketStatus(status);

    if (status !== undefined && !normalizedStatus) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported ticket status',
      });
    }

    // Restrict non-admin status changes to the authenticated organisation.
    const organisationScope = buildOrganisationScope(req.user);

    const existing = await prisma.ticket.findFirst({
      where: {
        id,
        ...organisationScope,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Ticket ${id} not found`,
      });
    }

    if (normalizedStatus !== undefined && existing.ticketType === 'Incident') {
      if (
        normalizedStatus === 'Resolved' &&
        existing.status !== 'Resolved'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Use the incident resolution endpoint to resolve an incident',
        });
      }

      if (
        normalizedStatus === 'Closed' &&
        !['Resolved', 'Closed'].includes(existing.status)
      ) {
        return res.status(409).json({
          success: false,
          message: 'An incident must be resolved before it can be closed',
        });
      }

      const isTerminal = ['Resolved', 'Closed'].includes(existing.status);
      const isAllowedClose =
        existing.status === 'Resolved' && normalizedStatus === 'Closed';
      const isReopening =
        isTerminal && normalizedStatus === 'Active';

      if (
        isTerminal &&
        normalizedStatus !== existing.status &&
        !isAllowedClose &&
        !isReopening
      ) {
        return res.status(409).json({
          success: false,
          message: 'A resolved or closed incident cannot transition to this status',
        });
      }

      if (isReopening) {
        data.reopenCount = { increment: 1 };
      }

      if (
        existing.status === 'Resolved' &&
        normalizedStatus === 'Closed'
      ) {
        const hasResolutionDetails = [
          'resolutionCode',
          'resolutionNotes',
          'rootCauseSummary',
        ].every(
          (field) =>
            typeof existing[field] === 'string' &&
            existing[field].trim().length > 0
        );

        if (!hasResolutionDetails) {
          return res.status(409).json({
            success: false,
            message: 'Required resolution details are missing',
          });
        }
      }
    }

    const data = {};

    if (status !== undefined) {
      const nextStatus = normalizedStatus;
      const transitionTime = new Date();

      data.status = nextStatus;

      Object.assign(
        data,
        prepareSlaStatusUpdate(existing, nextStatus, transitionTime)
      );

      // Preserve hold tracking even for priorities without an SLA policy.
      if (existing.status !== 'On Hold' && nextStatus === 'On Hold') {
        data.holdStartedAt = transitionTime;
      } else if (
        existing.status === 'On Hold' &&
        nextStatus !== 'On Hold'
      ) {
        data.holdStartedAt = null;
      }
    }

    if (holdReason !== undefined) {
      data.holdReason = holdReason;
    }

    const updated = await prisma.ticket.update({
      where: { id: existing.id },
      data,
      include: {
        requester: true,
        assignedAgent: true,
        incident: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: addSlaStatus(updated),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listTickets,
  getTicketById,
  updateTicketStatus,
};
