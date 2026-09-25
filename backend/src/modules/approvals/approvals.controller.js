const approvalsService = require('./approvals.service');

const getPendingApprovals = async (req, res) => {
  try {
    const approvals = await approvalsService.fetchPendingApprovals();
    res.status(200).json({ success: true, data: approvals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getApprovalById = async (req, res) => {
  try {
    const { approvalId } = req.params;
    const approval = await approvalsService.fetchApprovalById(approvalId);

    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    res.status(200).json({ success: true, data: approval });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { approvalId } = req.params;
    const updated = await approvalsService.updateApprovalStatus(approvalId, 'Approved');
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error.message === 'Approval request not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Cannot update non-pending request') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { approvalId } = req.params;
    const updated = await approvalsService.updateApprovalStatus(approvalId, 'Rejected');
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error.message === 'Approval request not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Cannot update non-pending request') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getPendingApprovals,
  getApprovalById,
  approveRequest,
  rejectRequest
};
