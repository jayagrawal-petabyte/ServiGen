const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const approvalsService = require('./approvals.service');

describe('Approvals Service', () => {
  it('should fetch only pending approvals initially', async () => {
    const pendingApprovals = await approvalsService.fetchPendingApprovals();
    assert.ok(Array.isArray(pendingApprovals));
    // Since this uses an in-memory mock and we haven't mutated it yet,
    // we expect exactly 2 pending approvals from the initial data.
    assert.equal(pendingApprovals.length, 2);
    assert.ok(pendingApprovals.every(a => a.status === 'Pending'));
  });

  it('should fetch an approval by ID', async () => {
    const approval = await approvalsService.fetchApprovalById('a1');
    assert.ok(approval);
    assert.equal(approval.id, 'a1');
    assert.equal(approval.title, 'Laptop Request for New Hire');
  });

  it('should return null for unknown approval ID behavior', async () => {
    const approval = await approvalsService.fetchApprovalById('invalid-id');
    assert.equal(approval, null);
  });

  it('should fail to update an unknown approval ID', async () => {
    await assert.rejects(
      approvalsService.updateApprovalStatus('invalid-id', 'Approved'),
      /Approval request not found/
    );
  });

  it('should fail when preventing updates to an already processed/non-pending approval', async () => {
    // 'a3' is 'Approved' in the initial mock data
    await assert.rejects(
      approvalsService.updateApprovalStatus('a3', 'Rejected'),
      /Cannot update non-pending request/
    );
  });

  it('should approve a pending approval', async () => {
    const updatedApproval = await approvalsService.updateApprovalStatus('a1', 'Approved');
    assert.ok(updatedApproval);
    assert.equal(updatedApproval.id, 'a1');
    assert.equal(updatedApproval.status, 'Approved');

    // Verify it is no longer pending
    const pendingApprovals = await approvalsService.fetchPendingApprovals();
    assert.equal(pendingApprovals.find(a => a.id === 'a1'), undefined);
  });

  it('should reject a pending approval', async () => {
    const updatedApproval = await approvalsService.updateApprovalStatus('a2', 'Rejected');
    assert.ok(updatedApproval);
    assert.equal(updatedApproval.id, 'a2');
    assert.equal(updatedApproval.status, 'Rejected');

    // CR: Verify only that a2 is no longer pending — do NOT assert total count=0
    //     because that would depend on the 'approve a1' test having run first.
    const pendingApprovals = await approvalsService.fetchPendingApprovals();
    assert.equal(pendingApprovals.find(a => a.id === 'a2'), undefined, 'a2 should no longer be in the pending list');
  });
});
