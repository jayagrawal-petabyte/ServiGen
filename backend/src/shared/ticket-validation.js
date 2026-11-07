'use strict';

const sanitizeHtml = require('sanitize-html');

const MAX_SUMMARY_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 10000;

// Ticket summaries are plain text, not rich HTML.
const SUMMARY_OPTIONS = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

// Descriptions support limited, safe formatting.
const DESCRIPTION_OPTIONS = {
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
  disallowedTagsMode: 'discard',
  transformTags: {
    a: sanitizeHtml.simpleTransform(
      'a',
      { rel: 'noopener noreferrer' },
      true
    ),
  },
};

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = 'VALIDATION_ERROR';
  return error;
};

/**
 * Validates and sanitizes ticket summary and description.
 *
 * Set partial=true when validating an update request.
 * Only returns summary and description fields that were supplied.
 * Other ticket properties must be independently validated and allowlisted.
 */
const validateAndSanitizeTicketInput = (input, options = {}) => {
  const { partial = false } = options;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createValidationError('Request body must be a valid object');
  }

  const result = {};

  if (!partial && !Object.prototype.hasOwnProperty.call(input, 'summary')) {
    throw createValidationError('Ticket summary is required');
  }

  if (Object.prototype.hasOwnProperty.call(input, 'summary')) {
    if (typeof input.summary !== 'string') {
      throw createValidationError('Ticket summary must be a string');
    }

    if (input.summary.length > MAX_SUMMARY_LENGTH) {
      throw createValidationError(
        `Ticket summary must not exceed ${MAX_SUMMARY_LENGTH} characters`
      );
    }

    const summary = sanitizeHtml(
      input.summary,
      SUMMARY_OPTIONS
    ).trim();

    if (!summary) {
      throw createValidationError('Ticket summary cannot be empty');
    }

    if (summary.length > MAX_SUMMARY_LENGTH) {
      throw createValidationError(
        `Sanitized ticket summary must not exceed ${MAX_SUMMARY_LENGTH} characters`
      );
    }

    result.summary = summary;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'description')) {
    if (input.description !== null && typeof input.description !== 'string') {
      throw createValidationError(
        'Ticket description must be a string or null'
      );
    }

    if (
      typeof input.description === 'string' &&
      input.description.length > MAX_DESCRIPTION_LENGTH
    ) {
      throw createValidationError(
        `Ticket description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`
      );
    }

    result.description =
      input.description === null
        ? null
        : sanitizeHtml(input.description, DESCRIPTION_OPTIONS);
  }

  return result;
};

module.exports = {
  MAX_SUMMARY_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  validateAndSanitizeTicketInput,
};
