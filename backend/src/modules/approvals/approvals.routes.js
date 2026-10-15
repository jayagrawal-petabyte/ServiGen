const express = require('express');
const router = express.Router();
const approvalsController = require('./approvals.controller');

// GET /approvals/pending - Pending approvals endpoint
router.get('/pending', approvalsController.getPendingApprovals);

// GET /approvals/:approvalId - Approval-request detail endpoint
router.get('/:approvalId', approvalsController.getApprovalById);

// PATCH /approvals/:approvalId/approve - Approve action endpoint
router.patch('/:approvalId/approve', approvalsController.approveRequest);

// PATCH /approvals/:approvalId/reject - Reject action endpoint
router.patch('/:approvalId/reject', approvalsController.rejectRequest);

module.exports = router;
