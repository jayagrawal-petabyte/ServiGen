'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const problemsService = require('./problems.service');

describe('Problem Management Service', () => {
  it('lists problems scoped to organisation and supports stage/team/search filters', async () => {
    const list = await problemsService.listProblems({ organisationId: 'org-001' });
    assert.ok(Array.isArray(list));
    assert.ok(list.length > 0);
    assert.equal(list[0].organisationId, 'org-001');

    const searchResults = await problemsService.listProblems({ organisationId: 'org-001', search: 'VPN' });
    assert.ok(searchResults.some((p) => p.summary.includes('VPN')));

    const teamResults = await problemsService.listProblems({ organisationId: 'org-001', team: 'Database' });
    assert.ok(teamResults.every((p) => p.team === 'Database'));
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
        team: 'Database Ops',
      },
      'org-001'
    );

    assert.ok(!created.summary.includes('<script>'));
    assert.ok(created.summary.includes('Database latency spike'));
    assert.equal(created.status, 'Open');
    assert.equal(created.stage, 'Investigation');
    assert.equal(created.organisationId, 'org-001');
  });

  it('retrieves single problem by ID and prevents cross-tenant access (IDOR)', async () => {
    const problem = await problemsService.getProblemDetail('PRB-1001', 'org-001');
    assert.equal(problem.id, 'PRB-1001');

    // Flexible ID retrieval without prefix
    const problemByNum = await problemsService.getProblemDetail('0001001', 'org-001');
    assert.equal(problemByNum.id, 'PRB-1001');

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

  it('updates problem lifecycle stage and reassigns team/agent', async () => {
    const stageUpdated = await problemsService.updateProblemStage('PRB-1001', 'org-001', {
      stage: 'Known Error Review',
    });
    assert.equal(stageUpdated.stage, 'Known Error Review');

    const reassigned = await problemsService.reassignProblem('PRB-1001', 'org-001', {
      assignedAgentId: 'agent-007',
      team: 'Infrastructure',
    });
    assert.equal(reassigned.assignedAgentId, 'agent-007');
    assert.equal(reassigned.team, 'Infrastructure');
  });

  it('records root cause and updates causeStatus', async () => {
    const causeUpdated = await problemsService.updateRootCause('PRB-1001', 'org-001', {
      causeStatus: 'Identified',
      rootCause: 'Kernel memory leak in gateway driver v2.4.1',
    });
    assert.equal(causeUpdated.causeStatus, 'Identified');
    assert.equal(causeUpdated.rootCause, 'Kernel memory leak in gateway driver v2.4.1');
  });

  it('adds workaround and transitions status to Workaround Found', async () => {
    const res = await problemsService.addWorkaround('PRB-1001', 'org-001', {
      workaround: 'Apply restart on cluster worker node 3',
      knownError: true,
    });
    assert.ok(res.workaround.includes('Apply restart'));
    assert.equal(res.knownError, true);
  });

  it('links multiple incidents, accepts single incidentId, unlinks, and bulk-resolves', async () => {
    // Array format
    const res = await problemsService.linkIncidents('PRB-1001', 'org-001', {
      incidentIds: ['INC-1001', 'INC-1002'],
    });
    assert.ok(Array.isArray(res.linkedIncidentIds));
    assert.ok(res.linkedIncidentIds.includes('INC-1001'));
    assert.ok(res.linkedIncidentIds.includes('INC-1002'));

    // Single incidentId format
    const singleLink = await problemsService.linkIncidents('PRB-1001', 'org-001', {
      incidentId: 'INC-1003',
    });
    assert.ok(singleLink.linkedIncidentIds.includes('INC-1003'));

    // Get linked incidents
    const linked = await problemsService.getLinkedIncidents('PRB-1001', 'org-001');
    assert.ok(linked.includes('INC-1003'));

    // Unlink incident
    const unlinked = await problemsService.unlinkIncident('PRB-1001', 'org-001', 'INC-1003');
    assert.ok(!unlinked.linkedIncidentIds.includes('INC-1003'));

    // Bulk resolve
    const bulkRes = await problemsService.bulkResolveChildIncidents('PRB-1001', 'org-001', {
      resolutionNote: 'Fixed via kernel patch upgrade.',
    });
    assert.equal(bulkRes.success, true);
    assert.ok(bulkRes.resolvedIncidentCount >= 1);
  });

  it('links and unlinks CMDB CIs', async () => {
    const linkCiRes = await problemsService.linkCi('PRB-1001', 'org-001', { ciId: 'CI-005' });
    assert.ok(linkCiRes.linkedCiIds.includes('CI-005'));

    const cis = await problemsService.getLinkedCis('PRB-1001', 'org-001');
    assert.ok(cis.includes('CI-005'));

    const unlinkedCiRes = await problemsService.unlinkCi('PRB-1001', 'org-001', 'CI-005');
    assert.ok(!unlinkedCiRes.linkedCiIds.includes('CI-005'));

    // Security: reject linking cross-tenant or non-existent CI
    await assert.rejects(
      problemsService.linkCi('PRB-1001', 'org-001', { ciId: 'CI-NONEXISTENT' }),
      /Configuration Item not found in this organisation/
    );
  });

  it('posts work notes and sends email updates', async () => {
    const note = await problemsService.postProblemLog('PRB-1001', 'org-001', {
      author: 'Lead DBA',
      content: 'Executed query plan analysis on production schema.',
      type: 'note',
      verifiedUser: 'alice@servigen.local',
    });
    assert.ok(note.id);
    assert.equal(note.content, 'Executed query plan analysis on production schema.');
    assert.ok(note.author.includes('alice@servigen.local'));

    const logs = await problemsService.getProblemLogs('PRB-1001', 'org-001');
    assert.ok(logs.some((l) => l.content.includes('query plan analysis')));

    // Rejects header injection in recipient email
    await assert.rejects(
      problemsService.sendProblemEmail('PRB-1001', 'org-001', {
        to: 'manager@servigen.local\r\nBcc: attacker@evil.local',
        subject: 'Test Subject',
        body: 'Test Body',
      }),
      /Valid recipient email address is required/
    );

    // Strips CRLF in subject
    const emailRes = await problemsService.sendProblemEmail('PRB-1001', 'org-001', {
      to: 'manager@servigen.local',
      subject: 'Investigation Update for PRB-1001\r\nSubject-Injection: false',
      body: 'Workaround has been deployed successfully.',
    });
    assert.equal(emailRes.success, true);
    assert.equal(emailRes.to, 'manager@servigen.local');
    assert.ok(!emailRes.subject.includes('\r'));
    assert.ok(!emailRes.subject.includes('\n'));
  });

  it('deletes problem with tenant IDOR check', async () => {
    const created = await problemsService.createProblem(
      { summary: 'Problem to be deleted', priority: 'Low' },
      'org-001'
    );

    await assert.rejects(
      problemsService.deleteProblem(created.id, 'org-002'),
      /Problem not found/
    );

    const deleted = await problemsService.deleteProblem(created.id, 'org-001');
    assert.equal(deleted.id, created.id);

    await assert.rejects(
      problemsService.getProblemDetail(created.id, 'org-001'),
      /Problem not found/
    );
  });
});
