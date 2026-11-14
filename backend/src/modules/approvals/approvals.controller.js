'use strict';

const approvalsService = require('./approvals.service');

const isCrossTenant = (approval, user) => {
  if (!approval || !user) return false;
  if (user.role === 'Admin') return false;
  if (user.organisationId && approval.organisationId && approval.organisationId !== user.organisationId) {
    return true;
  }
  return false;
};

const isUnauthorizedApprover = (approval, user) => {
  if (!approval || !user) return false;
  if (user.role === 'Admin') return false;
  if (user.role === 'Approver' && approval.approverId && approval.approverId !== user.id) {
    return true;
  }
  return false;
};

const getPendingApprovals = async (req, res) => {
  try {
    const filters = {};
    if (req.user && req.user.role !== 'Admin') {
      if (req.user.organisationId) {
        filters.organisationId = req.user.organisationId;
      }
      if (req.user.role === 'Approver') {
        filters.approverId = req.user.id;
      }
    }
    const approvals = await approvalsService.fetchPendingApprovals(filters);
    res.status(200).json({ success: true, data: approvals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getApprovalById = async (req, res) => {
  try {
    const { approvalId } = req.params;
    const approval = await approvalsService.fetchApprovalById(approvalId);

    if (!approval || isCrossTenant(approval, req.user) || isUnauthorizedApprover(approval, req.user)) {
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
    const existing = await approvalsService.fetchApprovalById(approvalId);

    if (!existing || isCrossTenant(existing, req.user) || isUnauthorizedApprover(existing, req.user)) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    const updated = await approvalsService.updateApprovalStatus(
      approvalId,
      'Approved',
      req.body || {},
      req.user || {}
    );
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
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
    const existing = await approvalsService.fetchApprovalById(approvalId);

    if (!existing || isCrossTenant(existing, req.user) || isUnauthorizedApprover(existing, req.user)) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    const updated = await approvalsService.updateApprovalStatus(
      approvalId,
      'Rejected',
      req.body || {},
      req.user || {}
    );
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
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
