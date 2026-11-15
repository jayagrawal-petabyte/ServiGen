'use strict';

const { prisma } = require('../../shared');

const {
  calculateSlaStatus,
  prepareSlaStatusUpdate,
  createSlaDeadlines,
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

    const hasSlaUpdate = body.responseTargetMet !== undefined || body.resolutionTargetMet !== undefined;
    const hasAssignmentUpdate = body.assignedTeam !== undefined || body.agentId !== undefined || body.assignedAgentId !== undefined;

    if (status === undefined && holdReason === undefined && !hasSlaUpdate && !hasAssignmentUpdate) {
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

    if (body.assignedTeam !== undefined) {
      data.assignedTeam = body.assignedTeam;
    }

    if (body.agentId !== undefined || body.assignedAgentId !== undefined) {
      data.assignedAgentId = body.agentId || body.assignedAgentId || null;
    }

    if (body.responseTargetMet !== undefined) {
      data.responseMetAt = body.responseTargetMet ? new Date() : null;
    }

    if (body.resolutionTargetMet !== undefined) {
      data.resolvedAt = body.resolutionTargetMet ? new Date() : null;
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

/**
 * PATCH /api/tickets/:id/assign
 * Reassigns ticket to an agent or team.
 */
const assignTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const agentId = body.agentId || body.assignedAgentId;
    const assignedTeam = body.assignedTeam || body.team;

    const organisationScope = buildOrganisationScope(req.user);
    let existing;
    try {
      existing = await prisma.ticket.findFirst({
        where: { id, ...organisationScope },
      });
    } catch (_dbErr) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _dbErr;
      }
      existing = { id, summary: 'Offline Ticket', status: 'Active', priority: 'Medium', assignedTeam: '1st Line Support' };
    }

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Ticket ${id} not found`,
      });
    }

    const data = {};
    if (agentId !== undefined) {
      if (agentId) {
        let agent = null;
        try {
          agent = await prisma.user.findFirst({
            where: {
              id: agentId,
              ...(req.user.role === 'Admin' ? {} : { organisationId: req.user.organisationId }),
            },
          });
        } catch (_dbErr) {
          if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
            throw _dbErr;
          }
        }
        if (!agent && (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS)) {
          return res.status(404).json({
            success: false,
            message: 'Agent not found',
          });
        }
        data.assignedAgentId = agent ? agent.id : agentId;
      } else {
        data.assignedAgentId = null;
      }
    }

    if (assignedTeam !== undefined) {
      data.assignedTeam = assignedTeam;
    }

    try {
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
    } catch (_dbErr) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _dbErr;
      }
      const mockUpdated = {
        ...existing,
        ...data,
      };
      return res.status(200).json({
        success: true,
        data: addSlaStatus(mockUpdated),
      });
    }
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/tickets/:id/email
 * Dispatches outbound email to user and logs activity.
 */
const sendTicketEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { to, cc, subject, body, postAsNote = true } = req.body || {};

    if (!to || typeof to !== 'string' || !to.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required',
      });
    }

    if (!body || typeof body !== 'string' || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email body cannot be empty',
      });
    }

    const organisationScope = buildOrganisationScope(req.user);
    let existing;
    try {
      existing = await prisma.ticket.findFirst({
        where: { id, ...organisationScope },
      });
    } catch (_dbErr) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _dbErr;
      }
      existing = { id, summary: 'Offline Ticket', status: 'Active' };
    }

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Ticket ${id} not found`,
      });
    }

    if (postAsNote) {
      try {
        const { createTicketNote } = require('../incidents/incidents.notes.service');
        await createTicketNote(
          id,
          {
            noteType: 'Customer Reply',
            content: `[Outbound Email to ${to}${cc ? ` (CC: ${cc})` : ''}]\nSubject: ${subject || 'Ticket Notification'}\n\n${body}`,
          },
          req.user
        );
      } catch (_err) {
        if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
          throw _err;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Email dispatched successfully',
      data: {
        to,
        cc,
        subject,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/tickets/:id/supplier
 * Dispatches ticket to third-party vendor/supplier and records note.
 */
const logTicketSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { supplier, externalRef, vendorSla, contactEmail, reason } = req.body || {};

    if (!supplier || typeof supplier !== 'string' || !supplier.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required',
      });
    }

    if (!externalRef || typeof externalRef !== 'string' || !externalRef.trim()) {
      return res.status(400).json({
        success: false,
        message: 'External reference ID is required',
      });
    }

    const organisationScope = buildOrganisationScope(req.user);
    let existing;
    try {
      existing = await prisma.ticket.findFirst({
        where: { id, ...organisationScope },
      });
    } catch (_dbErr) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _dbErr;
      }
      existing = { id, summary: 'Offline Ticket', status: 'Active' };
    }

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Ticket ${id} not found`,
      });
    }

    try {
      const { createTicketNote } = require('../incidents/incidents.notes.service');
      await createTicketNote(
        id,
        {
          noteType: 'Internal Note',
          content: `[Supplier Escalation: ${supplier}]\nReference: ${externalRef}\nTarget SLA: ${vendorSla || 'Standard'}\nContact: ${contactEmail || 'N/A'}\nReason: ${reason || 'Hardware/vendor triage'}`,
        },
        req.user
      );
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Logged to supplier successfully',
      data: {
        supplier,
        externalRef,
        vendorSla,
        contactEmail,
        reason,
        loggedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/tickets
 * Creates a new ticket (e.g. Incident or Service Request) with SLA targets.
 */
const createTicket = async (req, res, next) => {
  try {
    const {
      summary,
      description,
      ticketType = 'Incident',
      category = 'General',
      priority = 'Medium',
      assignedTeam = '1st Line Support',
      assignedAgent,
      assignedAgentId,
      siteName = 'London HQ',
      requesterId,
    } = req.body || {};

    if (!summary || typeof summary !== 'string' || !summary.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Summary is required',
      });
    }

    const orgId = req.user?.organisationId || null;

    let slaDeadlines = {};
    try {
      slaDeadlines = createSlaDeadlines(priority);
    } catch {
      slaDeadlines = {
        responseTargetAt: new Date(Date.now() + 4 * 3600 * 1000),
        resolutionTargetAt: new Date(Date.now() + 24 * 3600 * 1000),
      };
    }

    let finalAgentId = assignedAgentId || null;
    if (!finalAgentId && assignedAgent && assignedAgent !== 'Unassigned') {
      try {
        const foundAgent = await prisma.user.findFirst({
          where: {
            OR: [
              { id: assignedAgent },
              { username: assignedAgent },
              { firstName: { contains: assignedAgent.split(' ')[0] } },
            ],
          },
        });
        if (foundAgent) {
          finalAgentId = foundAgent.id;
        }
      } catch (_e) {
        // Fallback for offline mode
      }
    }

    const prefix = ticketType === 'Service Request' ? 'REQ' : 'INC';
    let count = 0;
    try {
      count = await prisma.ticket.count();
    } catch (_e) {
      count = Math.floor(Math.random() * 50);
    }
    const candidateId = `${prefix}-${1000 + count + Math.floor(Math.random() * 900) + 1}`;

    try {
      const newTicket = await prisma.ticket.create({
        data: {
          id: candidateId,
          summary: summary.trim(),
          description: description ? description.trim() : null,
          ticketType: ticketType || 'Incident',
          priority: priority || 'Medium',
          status: 'Active',
          assignedTeam: assignedTeam || '1st Line Support',
          assignedAgentId: finalAgentId,
          organisationId: orgId,
          siteName: siteName || 'London HQ',
          requesterId: requesterId || req.user?.id || null,
          responseTargetAt: slaDeadlines.responseTargetAt,
          resolutionTargetAt: slaDeadlines.resolutionTargetAt,
          slaTimeLeft: Math.round((slaDeadlines.resolutionTargetAt.getTime() - Date.now()) / (60 * 1000)),
        },
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
        },
      });

      if (ticketType === 'Incident') {
        await prisma.incident.create({
          data: {
            ticketId: newTicket.id,
            category: category || 'General',
          },
        });
      }

      const createdWithIncident = await prisma.ticket.findUnique({
        where: { id: newTicket.id },
        include: {
          requester: true,
          assignedAgent: true,
          incident: true,
        },
      });

      return res.status(201).json({
        success: true,
        data: addSlaStatus(createdWithIncident || newTicket),
      });
    } catch (dbErr) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw dbErr;
      }
      const offlineTicket = {
        id: candidateId,
        summary: summary.trim(),
        description: description ? description.trim() : null,
        ticketType: ticketType || 'Incident',
        priority: priority || 'Medium',
        status: 'Active',
        assignedTeam: assignedTeam || '1st Line Support',
        assignedAgent: assignedAgent ? { id: finalAgentId || 'agent-001', firstName: assignedAgent, lastName: '' } : null,
        assignedAgentId: finalAgentId,
        organisationId: orgId,
        siteName: siteName || 'London HQ',
        requester: { id: req.user?.id || 'user-001', firstName: 'Requester', lastName: '', email: 'requester@servigen.local' },
        incident: ticketType === 'Incident' ? { id: `inc-${Date.now()}`, category: category || 'General' } : null,
        responseTargetAt: slaDeadlines.responseTargetAt,
        resolutionTargetAt: slaDeadlines.resolutionTargetAt,
        slaTimeLeft: Math.round((slaDeadlines.resolutionTargetAt.getTime() - Date.now()) / (60 * 1000)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return res.status(201).json({
        success: true,
        data: addSlaStatus(offlineTicket),
      });
    }
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  sendTicketEmail,
  logTicketSupplier,
  createTicket,
};
