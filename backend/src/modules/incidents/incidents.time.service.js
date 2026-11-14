'use strict';

const { prisma } = require('../../shared');
const sanitizeHtml = require('sanitize-html');

const MAX_DESCRIPTION_LENGTH = 10000;

const DESCRIPTION_OPTIONS = {
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

const sanitizeDescription = (value) => {
  if (typeof value !== 'string') {
    throw createError('Time-entry description is required', 400);
  }

  if (value.length > MAX_DESCRIPTION_LENGTH) {
    throw createError(
      `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      400
    );
  }

  const sanitized = sanitizeHtml(value, DESCRIPTION_OPTIONS);
  const visibleText = sanitizeHtml(
    sanitized,
    PLAIN_TEXT_OPTIONS
  ).replace(/&nbsp;/g, ' ').trim();

  if (!visibleText) {
    throw createError('Description cannot be empty', 400);
  }

  return sanitized;
};

const parseOptionalDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw createError(`${fieldName} must be a valid date string`, 400);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw createError(`${fieldName} must be a valid date string`, 400);
  }

  return date;
};

const validateTimeEntryInput = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError('Request body must be a valid object', 400);
  }

  const durationMinutes = input.durationMinutes;

  if (
    !Number.isSafeInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    throw createError(
      'durationMinutes must be a positive whole number',
      400
    );
  }

  const description = sanitizeDescription(input.description);
  const startedAt = parseOptionalDate(input.startedAt, 'startedAt');
  const endedAt = parseOptionalDate(input.endedAt, 'endedAt');

  if (Boolean(startedAt) !== Boolean(endedAt)) {
    throw createError(
      'startedAt and endedAt must either both be provided or both be omitted',
      400
    );
  }

  if (startedAt && endedAt <= startedAt) {
    throw createError('endedAt must be later than startedAt', 400);
  }

  return {
    durationMinutes,
    description,
    startedAt,
    endedAt,
  };
};

const getAgentDetails = (user) => {
  const fullName = [user.firstName, user.lastName]
    .filter((part) => typeof part === 'string' && part.trim())
    .map((part) => part.trim())
    .join(' ');

  return {
    agentId: user.id,
    agentName: fullName || user.username || user.email || 'Service Agent',
    agentEmail: typeof user.email === 'string' ? user.email : null,
  };
};

/**
 * POST /api/tickets/:id/time-entries
 *
 * Creates an individual agent time entry and increments
 * the ticket's cumulative timeRecord in one transaction.
 */
const createTicketTimeEntry = async (ticketId, input, user) => {
  const where = buildTicketScope(ticketId, user);
  const validated = validateTimeEntryInput(input);
  const agent = getAgentDetails(user);

  return prisma.$transaction(async (transaction) => {
    const ticket = await transaction.ticket.findFirst({
      where,
      select: {
        id: true,
        organisationId: true,
        timeRecord: true,
      },
    });

    if (!ticket) {
      throw createError('Ticket not found', 404);
    }

    const entry = await transaction.ticketTimeEntry.create({
      data: {
        ticketId: ticket.id,
        organisationId: ticket.organisationId,
        ...agent,
        ...validated,
      },
    });

    const updatedTicket = await transaction.ticket.update({
      where: { id: ticket.id },
      data: {
        timeRecord: {
          increment: validated.durationMinutes,
        },
      },
      select: {
        id: true,
        timeRecord: true,
      },
    });

    return {
      entry,
      ticket: updatedTicket,
    };
  });
};

module.exports = {
  MAX_DESCRIPTION_LENGTH,
  validateTimeEntryInput,
  createTicketTimeEntry,
};
