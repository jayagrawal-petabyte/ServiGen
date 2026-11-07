'use strict';

const {
  MAX_SUMMARY_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  validateAndSanitizeTicketInput,
} = require('./incidents.validation');

describe('Incidents ticket input validation', () => {
  test('accepts valid ticket input', () => {
    const result = validateAndSanitizeTicketInput({
      summary: 'Network connection issue',
      description: '<p>Users cannot connect.</p>',
    });

    expect(result.summary).toBe('Network connection issue');
    expect(result.description).toBe('<p>Users cannot connect.</p>');
  });

  test('rejects missing summary during creation', () => {
    expect(() =>
      validateAndSanitizeTicketInput({ description: 'Description' })
    ).toThrow('Ticket summary is required');
  });

  test('rejects summary longer than 255 characters', () => {
    expect(() =>
      validateAndSanitizeTicketInput({
        summary: 'A'.repeat(MAX_SUMMARY_LENGTH + 1),
      })
    ).toThrow('Ticket summary must not exceed 255 characters');
  });

  test('rejects description longer than 10000 characters', () => {
    expect(() =>
      validateAndSanitizeTicketInput({
        summary: 'Valid title',
        description: 'A'.repeat(MAX_DESCRIPTION_LENGTH + 1),
      })
    ).toThrow('Ticket description must not exceed 10000 characters');
  });

  test('removes HTML tags from ticket summaries', () => {
    const result = validateAndSanitizeTicketInput({
      summary: '<b>Network</b> issue',
    });

    expect(result.summary).toBe('Network issue');
  });

  test('removes scripts and unsafe attributes from descriptions', () => {
    const result = validateAndSanitizeTicketInput({
      summary: 'Security issue',
      description:
        '<p onclick="alert(1)">Hello <strong>world</strong></p>' +
        '<script>alert(1)</script>',
    });

    expect(result.description).toContain('<strong>world</strong>');
    expect(result.description).not.toContain('onclick');
    expect(result.description).not.toContain('<script>');
  });

  test('removes unsafe JavaScript URLs', () => {
    const result = validateAndSanitizeTicketInput({
      summary: 'Link issue',
      description:
        '<a href="javascript:alert(1)" onclick="alert(1)">Open</a>',
    });

    expect(result.description).not.toContain('javascript:');
    expect(result.description).not.toContain('onclick');
    expect(result.description).toContain('Open');
  });

  test('supports partial updates', () => {
    const result = validateAndSanitizeTicketInput(
      { description: '<p>Updated description</p>' },
      { partial: true }
    );

    expect(result).toEqual({
      description: '<p>Updated description</p>',
    });
  });

  test('allows a null description', () => {
    const result = validateAndSanitizeTicketInput({
      summary: 'Valid title',
      description: null,
    });

    expect(result.description).toBeNull();
  });

  test('rejects non-string summaries', () => {
    expect(() =>
      validateAndSanitizeTicketInput({ summary: 123 })
    ).toThrow('Ticket summary must be a string');
  });
});
