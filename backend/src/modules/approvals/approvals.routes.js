'use strict';

const express = require('express');
const router = express.Router();
const approvalsController = require('./approvals.controller');

// GET /approvals or /approvals/pending - Pending approvals endpoint
router.get('/', approvalsController.getPendingApprovals);
router.get('/pending', approvalsController.getPendingApprovals);

// GET /approvals/:approvalId - Approval-request detail endpoint
router.get('/:approvalId', approvalsController.getApprovalById);

// POST & PATCH /approvals/:approvalId/approve - Approve action endpoint
router.post('/:approvalId/approve', approvalsController.approveRequest);
router.patch('/:approvalId/approve', approvalsController.approveRequest);

// POST & PATCH /approvals/:approvalId/reject - Reject action endpoint
router.post('/:approvalId/reject', approvalsController.rejectRequest);
router.patch('/:approvalId/reject', approvalsController.rejectRequest);

module.exports = router;
