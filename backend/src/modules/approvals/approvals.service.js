'use strict';

const approvalsModel = require('./approvals.model');

const sanitizeInputText = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim();
};

const validateComments = (comments) => {
  if (comments !== undefined && comments !== null) {
    if (typeof comments !== 'string') {
      const err = new Error('Comments must be a string');
      err.statusCode = 400;
      throw err;
    }
    if (comments.length > 2000) {
      const err = new Error('Comments must not exceed 2000 characters');
      err.statusCode = 400;
      throw err;
    }
  }
};

const fetchPendingApprovals = async (filters = {}) => {
  return await approvalsModel.getPendingApprovals(filters);
};

const fetchApprovalById = async (approvalId) => {
  return await approvalsModel.getApprovalById(approvalId);
};

const updateApprovalStatus = async (approvalId, status, payload = {}, user = {}) => {
  const rawComments = payload.comments || payload.decisionReason || '';
  validateComments(rawComments);

  const comments = sanitizeInputText(rawComments);
  const actedBy = user.email || user.id || 'Approver';

  // Atomic state guard and update
  const result = await approvalsModel.conditionalUpdateStatus(
    approvalId,
    'Pending',
    status,
    { comments, actedBy }
  );

  if (!result.found) {
    const err = new Error('Approval request not found');
    err.statusCode = 404;
    throw err;
  }
  if (!result.updated) {
    const err = new Error('Cannot update non-pending request');
    err.statusCode = 400;
    throw err;
  }

  return result.record;
};

module.exports = {
  fetchPendingApprovals,
  fetchApprovalById,
  updateApprovalStatus,
  sanitizeInputText,
};
