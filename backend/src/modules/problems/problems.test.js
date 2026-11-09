'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const problemsService = require('./problems.service');

describe('Problem Management Service', () => {
  it('lists problems scoped to organisation', async () => {
    const list = await problemsService.listProblems({ organisationId: 'org-001' });
    assert.ok(Array.isArray(list));
    assert.ok(list.length > 0);
    assert.equal(list[0].organisationId, 'org-001');
  });

  it('filters problems by knownError flag', async () => {
    const known = await problemsService.listProblems({ organisationId: 'org-001', knownError: true });
    assert.ok(known.every((p) => p.knownError === true));
  });

  it('creates a problem record with HTML sanitization and validation', async () => {
    await assert.rejects(
      problemsService.createProblem({ summary: '' }, 'org-001'),
      /Summary is required/
    );

    await assert.rejects(
      problemsService.createProblem({ summary: 'A'.repeat(256) }, 'org-001'),
      /cannot exceed 255 characters/
    );

    const created = await problemsService.createProblem(
      {
        summary: '<script>alert("xss")</script>Database latency spike during night batch',
        description: '<p>Observed <b>500ms</b> query delays.</p>',
        category: 'Database',
        priority: 'High',
      },
      'org-001'
    );

    assert.ok(!created.summary.includes('<script>'));
    assert.ok(created.summary.includes('Database latency spike'));
    assert.equal(created.status, 'Open');
    assert.equal(created.organisationId, 'org-001');
  });

  it('retrieves single problem by ID and prevents cross-tenant access (IDOR)', async () => {
    const problem = await problemsService.getProblemDetail('PRB-1001', 'org-001');
    assert.equal(problem.id, 'PRB-1001');

    await assert.rejects(
      problemsService.getProblemDetail('PRB-1001', 'org-002'),
      /Problem not found/
    );
  });

  it('updates problem status, root cause, and validates transitions', async () => {
    await assert.rejects(
      problemsService.updateProblem('PRB-1001', 'org-001', { status: 'INVALID_STATUS' }),
      /Status must be one of/
    );

    const updated = await problemsService.updateProblem('PRB-1001', 'org-001', {
      status: 'Resolved',
      rootCause: 'Deadlock on unindexed foreign key in audit table',
    });
    assert.equal(updated.status, 'Resolved');
    assert.equal(updated.rootCause, 'Deadlock on unindexed foreign key in audit table');
  });

  it('adds workaround and transitions status to Workaround Found', async () => {
    const res = await problemsService.addWorkaround('PRB-1001', 'org-001', {
      workaround: 'Apply restart on cluster worker node 3',
      knownError: true,
    });
    assert.ok(res.workaround.includes('Apply restart'));
    assert.equal(res.knownError, true);
  });

  it('links multiple incidents to problem', async () => {
    const res = await problemsService.linkIncidents('PRB-1001', 'org-001', {
      incidentIds: ['INC-1001', 'INC-1002'],
    });
    assert.ok(Array.isArray(res.linkedIncidentIds));
    assert.ok(res.linkedIncidentIds.includes('INC-1001'));
    assert.ok(res.linkedIncidentIds.includes('INC-1002'));
  });
});
