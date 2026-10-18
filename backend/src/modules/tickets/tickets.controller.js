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
      where.status = { equals: status, mode: 'insensitive' };
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
    const cleanId = id.replace(/^#/, '');
    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [
          { id },
          { id: cleanId },
          { id: `#${cleanId}` },
          { id: `INC-${cleanId}` },
          { id: `REQ-${cleanId}` },
        ]
      },
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
    const cleanId = id.replace(/^#/, '');
    const { status, holdReason, assignedAgentId } = req.body;

    const existing = await prisma.ticket.findFirst({
      where: {
        OR: [
          { id },
          { id: cleanId },
          { id: `#${cleanId}` },
          { id: `INC-${cleanId}` },
          { id: `REQ-${cleanId}` },
        ]
      }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: `Ticket ${id} not found` });
    }

    const data = {};
    if (status) data.status = status;
    if (holdReason !== undefined) data.holdReason = holdReason;
    if (assignedAgentId) data.assignedAgentId = assignedAgentId;
    if (status === 'On Hold') {
      data.holdStartedAt = new Date();
    }

    const updated = await prisma.ticket.update({
      where: { id: existing.id },
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

module.exports = {
  listTickets,
  getTicketById,
  updateTicketStatus
};
