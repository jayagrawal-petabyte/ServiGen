const approvalsModel = require('./approvals.model');

const fetchPendingApprovals = async () => {
  return await approvalsModel.getPendingApprovals();
};

const fetchApprovalById = async (approvalId) => {
  return await approvalsModel.getApprovalById(approvalId);
};

const updateApprovalStatus = async (approvalId, status) => {
  const approval = await approvalsModel.getApprovalById(approvalId);

  if (!approval) {
    throw new Error('Approval request not found');
  }

  if (approval.status !== 'Pending') {
    throw new Error('Cannot update non-pending request');
  }

  return await approvalsModel.updateStatus(approvalId, status);
};

module.exports = {
  fetchPendingApprovals,
  fetchApprovalById,
  updateApprovalStatus
};
