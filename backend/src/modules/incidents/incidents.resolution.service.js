'use strict';

const { prisma } = require('../../shared');
const sanitizeHtml = require('sanitize-html');

const MAX_RESOLUTION_CODE_LENGTH = 100;
const MAX_RESOLUTION_TEXT_LENGTH = 10000;

const RESOLUTION_TEXT_OPTIONS = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
  ],
  allowedAttributes: {},
};

const PLAIN_TEXT_OPTIONS = {
  allowedTags: [],
  allowedAttributes: {},
};

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const buildTicketScope = (ticketId, user) => {
  if (!user || typeof user.id !== 'string' || !user.id.trim()) {
    throw createError('Authentication is required', 401);
  }

  if (typeof ticketId !== 'string' || !ticketId.trim()) {
    throw createError('Ticket ID is required', 400);
  }

  const where = {
    id: ticketId.trim(),
    ticketType: 'Incident',
  };

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

const sanitizeRequiredText = (
  value,
  fieldName,
  maximumLength,
  allowFormatting = false
) => {
  if (typeof value !== 'string') {
    throw createError(`${fieldName} is required and must be text`, 400);
  }

  if (value.length > maximumLength) {
    throw createError(
      `${fieldName} must not exceed ${maximumLength} characters`,
      400
    );
  }

  const sanitized = allowFormatting
    ? sanitizeHtml(value, RESOLUTION_TEXT_OPTIONS)
    : sanitizeHtml(value, PLAIN_TEXT_OPTIONS);

  const visibleText = sanitizeHtml(
    sanitized,
    PLAIN_TEXT_OPTIONS
  ).replace(/&nbsp;/g, ' ').trim();

  if (!visibleText) {
    throw createError(`${fieldName} cannot be empty`, 400);
  }

  return sanitized;
};

const validateResolutionInput = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError('Request body must be a valid object', 400);
  }

  return {
    resolutionCode: sanitizeRequiredText(
      input.resolutionCode,
      'Resolution code',
      MAX_RESOLUTION_CODE_LENGTH
    ),
    resolutionNotes: sanitizeRequiredText(
      input.resolutionNotes,
      'Resolution notes',
      MAX_RESOLUTION_TEXT_LENGTH,
      true
    ),
    rootCauseSummary: sanitizeRequiredText(
      input.rootCauseSummary,
      'Root cause summary',
      MAX_RESOLUTION_TEXT_LENGTH,
      true
    ),
  };
};

/**
 * POST /api/tickets/:id/resolve
 *
 * Requires all resolution details and performs the resolution
 * and SLA transition in one database transaction.
 */
const resolveIncident = async (ticketId, input, user) => {
  const where = buildTicketScope(ticketId, user);
  const resolution = validateResolutionInput(input);

  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.ticket.findFirst({
      where,
      select: {
        id: true,
        ticketType: true,
        organisationId: true,
        priority: true,
        status: true,
        createdAt: true,
        holdStartedAt: true,
        responseTargetAt: true,
        resolutionTargetAt: true,
        responseMetAt: true,
      },
    });

    if (!existing || existing.ticketType !== 'Incident') {
      throw createError('Incident not found', 404);
    }

    if (['Resolved', 'Closed'].includes(existing.status)) {
      throw createError('Incident is already resolved or closed', 409);
    }

    const resolvedAt = new Date();

    const data = {
      status: 'Resolved',
      ...resolution,
      resolvedAt,
      resolvedById: user.id,
    };

    // Extend SLA deadlines by the time spent On Hold before resolving.
    Object.assign(
      data,
      require('./incidents.sla.service').prepareSlaStatusUpdate(
        existing,
        'Resolved',
        resolvedAt
      )
    );

    // Ensure hold tracking is cleared even for unsupported SLA priorities.
    if (existing.status === 'On Hold') {
      data.holdStartedAt = null;
    }

    // Conditional update prevents two concurrent requests from resolving
    // the same ticket using stale status data.
    const updateResult = await transaction.ticket.updateMany({
      where: {
        id: existing.id,
        organisationId: existing.organisationId,
        status: existing.status,
      },
      data,
    });

    if (updateResult.count !== 1) {
      throw createError(
        'Incident changed during resolution. Please reload and retry.',
        409
      );
    }

    const updated = await transaction.ticket.findFirst({
      where: { id: existing.id },
      select: {
        id: true,
        summary: true,
        ticketType: true,
        priority: true,
        status: true,
        organisationId: true,
        resolutionCode: true,
        resolutionNotes: true,
        rootCauseSummary: true,
        resolvedAt: true,
        resolvedById: true,
        responseTargetAt: true,
        resolutionTargetAt: true,
        responseMetAt: true,
        holdStartedAt: true,
        updatedAt: true,
      },
    });

    return updated;
  });
};

module.exports = {
  MAX_RESOLUTION_CODE_LENGTH,
  MAX_RESOLUTION_TEXT_LENGTH,
  validateResolutionInput,
  resolveIncident,
};
