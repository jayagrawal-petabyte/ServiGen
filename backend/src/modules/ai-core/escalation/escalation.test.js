'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const escalationService = require('./escalation.service');

describe('AI Escalation Service', () => {
  it('evaluates basic escalation decisions based on resolution status', async () => {
    const unresolved = await escalationService.checkEscalation({ resolved: false });
    assert.equal(typeof unresolved.escalate, 'boolean');
  });

  it('analyzes ticket risk incorporating SLA and sentiment indicators', async () => {
    const risk = await escalationService.checkTicketEscalationRisk('INC-1001', 'org-001');
    assert.equal(risk.ticketId, 'INC-1001');
    assert.ok(typeof risk.riskScore === 'number');
    assert.ok(Array.isArray(risk.reasons));
    assert.ok(typeof risk.recommendation === 'string');
  });

  it('rejects cross-tenant escalation analysis (IDOR / BOLA defense)', async () => {
    await assert.rejects(
      escalationService.checkTicketEscalationRisk('INC-1001', 'org-002'),
      (err) => err.code === 'TICKET_NOT_FOUND'
    );
  });

  it('rejects invalid or missing ticket IDs', async () => {
    await assert.rejects(
      escalationService.checkTicketEscalationRisk('', 'org-001'),
      /Valid ticket ID is required/
    );
  });
});

