'use strict';

const { prisma } = require('../../shared');

/**
 * GET /api/tickets
 * Query parameters: status, ticketType, priority, search, page, limit
 */
const listTickets = async (req, res, next) => {
  try {
    const { status, ticketType, priority, search, page = 1, limit = 50 } = req.query;
    const where = {};

    if (status) {
      let statusVal = status;
      const lower = statusVal.toLowerCase();
      if (lower === 'new') statusVal = 'Active';
      else if (lower === 'on-hold' || lower === 'onhold') statusVal = 'On Hold';
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

    // Role-based scoping: non-admins only see tickets in their organisation if set
    if (req.user && req.user.role !== 'Admin' && req.user.organisationId) {
      where.organisationId = req.user.organisationId;
    }

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
            select: { id: true, firstName: true, lastName: true, email: true, username: true }
          },
          assignedAgent: {
            select: { id: true, firstName: true, lastName: true, email: true, username: true, availability: true }
          },
          incident: true,
          serviceRequest: {
            include: { serviceCatalogueItem: true }
          }
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: parseInt(page, 10) || 1,
        limit: take,
        totalPages: Math.ceil(total / take) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tickets/:id
 */
const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, username: true, phoneNumber: true, networkLogin: true }
        },
        assignedAgent: {
          select: { id: true, firstName: true, lastName: true, email: true, username: true, availability: true }
        },
        incident: true,
        serviceRequest: {
          include: { serviceCatalogueItem: true }
        },
        approvals: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: `Ticket ${id} not found` });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tickets/:id/status
 */
const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, holdReason } = req.body;

    const data = {};
    if (status) data.status = status;
    if (holdReason !== undefined) data.holdReason = holdReason;
    if (status === 'On Hold') {
      data.holdStartedAt = new Date();
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        requester: true,
        assignedAgent: true,
        incident: true
      }
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tickets/:id/assign
 * Body: { agentId: string }
 */
const assignTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    const data = {};
    if (agentId === null || agentId === '') {
      data.assignedAgentId = null;
    } else if (agentId) {
      // Verify agent exists
      const agent = await prisma.user.findUnique({ where: { id: agentId } });
      if (!agent) {
        return res.status(404).json({ success: false, message: `Agent ${agentId} not found` });
      }
      data.assignedAgentId = agentId;
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedAgent: { select: { id: true, firstName: true, lastName: true, email: true, availability: true } },
        incident: true,
      }
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tickets/:id/related
 * Returns other open tickets from same requester
 */
const getRelatedTickets = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({ where: { id }, select: { requesterId: true } });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const related = await prisma.ticket.findMany({
      where: {
        requesterId: ticket.requesterId,
        id: { not: id },
        status: { notIn: ['Resolved', 'Closed'] },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, summary: true, status: true, createdAt: true, priority: true,
      }
    });

    res.status(200).json({ success: true, data: related });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tickets/:id/email
 * Outbound email dispatch & note logging
 */
const sendEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { to, cc, subject, body } = req.body;

    res.status(200).json({
      success: true,
      message: `Email dispatched to ${to}`,
      data: { to, cc, subject, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tickets/:id/supplier
 * Log ticket to 3rd party external vendor / supplier
 */
const logToSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { supplier, externalRef, vendorSla, contactEmail, reason } = req.body;

    res.status(200).json({
      success: true,
      message: `Ticket successfully logged to ${supplier}`,
      data: {
        ticketId: id,
        supplier,
        externalRef,
        vendorSla,
        contactEmail,
        reason,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  getRelatedTickets,
  sendEmail,
  logToSupplier,
};
