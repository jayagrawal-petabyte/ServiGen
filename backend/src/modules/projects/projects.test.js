'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const projectsService = require('./projects.service');

describe('Projects Service & Controller Logic', () => {
  it('lists active projects and computes subtask completion percentages', async () => {
    const active = await projectsService.getActiveProjectsData({ organisationId: 'org-001' });
    assert.ok(Array.isArray(active));
    assert.ok(active.length > 0);
    for (const p of active) {
      assert.equal(p.status, 'ACTIVE');
      assert.equal(typeof p.completionPercentage, 'number');
    }
  });

  it('retrieves project subtasks scoped to organisation', async () => {
    const subtasks = await projectsService.getProjectSubtasks('P-001', 'org-001');
    assert.ok(Array.isArray(subtasks));
    assert.ok(subtasks.length > 0);
    assert.equal(subtasks[0].id, 'ST-001');
  });

  it('creates project subtasks with validation', async () => {
    await assert.rejects(
      projectsService.createProjectSubtask('P-001', 'org-001', { title: '' }),
      /title is required/
    );

    await assert.rejects(
      projectsService.createProjectSubtask('P-001', 'org-001', { title: 'Valid', status: 'INVALID' }),
      /Subtask status must be one of/
    );

    const created = await projectsService.createProjectSubtask('P-001', 'org-001', {
      title: 'Automated CI/CD Setup',
      status: 'PENDING',
    });
    assert.equal(created.title, 'Automated CI/CD Setup');
    assert.equal(created.status, 'PENDING');
  });

  it('rejects cross-tenant subtask creation (IDOR)', async () => {
    await assert.rejects(
      projectsService.createProjectSubtask('P-001', 'org-002', { title: 'Hacked Subtask' }),
      (err) => err.code === 'PROJECT_NOT_FOUND'
    );
  });

  it('creates a new project with valid fields and prevents duplicate code', async () => {
    const code = 'PRJ-TEST-' + Date.now().toString().slice(-4);
    const created = await projectsService.createProject({
      organisationId: 'org-001',
      title: 'Infrastructure Scaling',
      code,
      status: 'ACTIVE',
      priority: 'HIGH',
    });
    assert.equal(created.name, 'Infrastructure Scaling');
    assert.equal(created.code, code);

    // Duplicate code in same org should reject
    await assert.rejects(
      projectsService.createProject({
        organisationId: 'org-001',
        title: 'Duplicate Scaling',
        code,
      }),
      (err) => err.code === 'P2002'
    );
  });
});

