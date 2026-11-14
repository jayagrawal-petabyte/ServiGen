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
      hoursBudget: 120,
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

  it('supports Kanban drag & drop subtask status updates and recalculates completion %', async () => {
    // Drag card to in_progress
    const resProgress = await projectsService.updateProjectSubtask('P-001', 'ST-002', 'org-001', {
      status: 'in_progress',
    });
    assert.equal(resProgress.subtask.status, 'IN_PROGRESS');

    // Drag card to done
    const resDone = await projectsService.updateProjectSubtask('P-001', 'ST-002', 'org-001', {
      status: 'done',
    });
    assert.equal(resDone.subtask.status, 'COMPLETED');
    assert.equal(typeof resDone.completionPercentage, 'number');

    // Reject cross-tenant update
    await assert.rejects(
      projectsService.updateProjectSubtask('P-001', 'ST-002', 'org-002', {
        status: 'todo',
      }),
      (err) => err.code === 'PROJECT_NOT_FOUND'
    );
  });

  it('updates project details and enforces tenant isolation', async () => {
    const updated = await projectsService.updateProject('P-001', 'org-001', {
      name: 'Network Upgrade 2.0',
      hoursBudget: 150,
      priority: 'CRITICAL',
    });
    assert.equal(updated.name, 'Network Upgrade 2.0');

    await assert.rejects(
      projectsService.updateProject('P-001', 'org-002', { name: 'Hacked Title' }),
      (err) => err.code === 'PROJECT_NOT_FOUND'
    );
  });
});
