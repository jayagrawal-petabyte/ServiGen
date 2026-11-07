'use strict';

const { prisma } = require('../../shared');
const sanitizeHtml = require('sanitize-html');

const MAX_NOTE_LENGTH = 10000;

const NOTE_TYPES = Object.freeze({
  INTERNAL: 'Internal Note',
  CUSTOMER_REPLY: 'Customer Reply',
});

const RICH_TEXT_OPTIONS = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a',
  ],
  allowedAttributes: {
    a: ['href'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform(
      'a',
      { rel: 'noopener noreferrer' },
      true
    ),
  },
};

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

const getAuthorDetails = (user) => {
  const fullName = [user.firstName, user.lastName]
    .filter((part) => typeof part === 'string' && part.trim())
    .map((part) => part.trim())
    .join(' ');

  return {
    authorId: user.id,
    authorName:
      fullName ||
      user.username ||
      user.email ||
      'Service Agent',
    authorEmail:
      typeof user.email === 'string' ? user.email : null,
  };
};

const sanitizeNoteContent = (content) => {
  if (typeof content !== 'string') {
    throw createError('Note content must be a string', 400);
  }

  if (content.length > MAX_NOTE_LENGTH) {
    throw createError(
      `Note content must not exceed ${MAX_NOTE_LENGTH} characters`,
      400
    );
  }

  const sanitized = sanitizeHtml(content, RICH_TEXT_OPTIONS);
  const plainText = sanitizeHtml(sanitized, {
    allowedTags: [],
    allowedAttributes: {},
  }).replace(/&nbsp;/g, ' ').trim();

  if (!plainText) {
    throw createError('Note content cannot be empty', 400);
  }

  return sanitized;
};

const normalizeNoteType = (value) => {
  if (typeof value !== 'string') {
    throw createError(
      'Note type must be Internal Note or Customer Reply',
      400
    );
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'internal note') {
    return NOTE_TYPES.INTERNAL;
  }

  if (normalized === 'customer reply') {
    return NOTE_TYPES.CUSTOMER_REPLY;
  }

  throw createError(
    'Note type must be Internal Note or Customer Reply',
    400
  );
};

/**
 * Retrieve a ticket's notes in chronological order.
 * Tenant access is checked against the parent ticket.
 */
const getTicketNotes = async (ticketId, user) => {
  const where = buildTicketScope(ticketId, user);

  const ticket = await prisma.ticket.findFirst({
    where,
    select: {
      id: true,
      organisationId: true,
    },
  });

  if (!ticket) {
    throw createError('Ticket not found', 404);
  }

  const notes = await prisma.ticketNote.findMany({
    where: {
      ticketId: ticket.id,
      organisationId: ticket.organisationId,
    },
    orderBy: [
      { createdAt: 'asc' },
      { id: 'asc' },
    ],
  });

  return {
    ticketId: ticket.id,
    notes,
    total: notes.length,
  };
};

/**
 * Create a ticket note.
 *
 * Author and organisation are derived from authenticated user
 * and the ticket, never from request-body identity fields.
 *
 * The first Customer Reply also records responseMetAt.
 */
const createTicketNote = async (ticketId, input, user) => {
  const where = buildTicketScope(ticketId, user);

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError('Request body must be a valid object', 400);
  }

  const noteType = normalizeNoteType(input.noteType);
  const content = sanitizeNoteContent(input.content);
  const author = getAuthorDetails(user);

  return prisma.$transaction(async (transaction) => {
    const ticket = await transaction.ticket.findFirst({
      where,
      select: {
        id: true,
        organisationId: true,
        responseMetAt: true,
      },
    });

    if (!ticket) {
      throw createError('Ticket not found', 404);
    }

    const createdAt = new Date();

    const note = await transaction.ticketNote.create({
      data: {
        ticketId: ticket.id,
        organisationId: ticket.organisationId,
        ...author,
        noteType,
        content,
        createdAt,
      },
    });

    let responseRecorded = false;

    if (
      noteType === NOTE_TYPES.CUSTOMER_REPLY &&
      !ticket.responseMetAt
    ) {
      const result = await transaction.ticket.updateMany({
        where: {
          id: ticket.id,
          responseMetAt: null,
        },
        data: {
          responseMetAt: createdAt,
        },
      });

      responseRecorded = result.count > 0;
    }

    return {
      note,
      responseRecorded,
    };
  });
};

module.exports = {
  MAX_NOTE_LENGTH,
  NOTE_TYPES,
  getTicketNotes,
  createTicketNote,
  sanitizeNoteContent,
};
