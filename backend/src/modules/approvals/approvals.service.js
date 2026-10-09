const approvalsModel = require('./approvals.model');

const fetchPendingApprovals = async () => {
  return await approvalsModel.getPendingApprovals();
};

const fetchApprovalById = async (approvalId) => {
  return await approvalsModel.getApprovalById(approvalId);
};

const updateApprovalStatus = async (approvalId, status) => {
  // CR / BI-12: The existence check, pending-state guard, and write are now
  //   collapsed into one atomic operation in the model layer.
  //   At DB integration: replace conditionalUpdateStatus with a single
  //   UPDATE ... WHERE id = ? AND status = 'Pending' (+ approver predicate).
  const result = await approvalsModel.conditionalUpdateStatus(approvalId, 'Pending', status);

  if (!result.found) {
    throw new Error('Approval request not found');
  }
  if (!result.updated) {
    throw new Error('Cannot update non-pending request');
  }

  return result.record;
};

module.exports = {
  fetchPendingApprovals,
  fetchApprovalById,
  updateApprovalStatus
};
