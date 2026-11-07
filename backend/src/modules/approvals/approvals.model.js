'use strict';

const db = require('../../config/db');

// Mock Data Layer for Approvals
const mockApprovals = [
  {
    id: 'a1',
    title: 'Laptop Request for New Hire',
    requester: 'John Doe',
    service: 'Hardware',
    status: 'Pending',
    stage: 1,
    totalStages: 2,
    stageName: 'Line Manager Review',
    organisationId: 'org-1',
    submittedAt: '2026-09-24T10:00:00Z',
    description: 'Requires a standard dev laptop.'
  },
  {
    id: 'a2',
    title: 'VPN Access',
    requester: 'Jane Smith',
    service: 'Access',
    status: 'Pending',
    stage: 1,
    totalStages: 1,
    stageName: 'Security Review',
    organisationId: 'org-1',
    submittedAt: '2026-09-25T14:30:00Z',
    description: 'VPN access for remote work.'
  },
  {
    id: 'a3',
    title: 'Adobe CC License',
    requester: 'Emily Johnson',
    service: 'Software',
    status: 'Approved',
    stage: 1,
    totalStages: 1,
    stageName: 'Manager Review',
    organisationId: 'org-1',
    submittedAt: '2026-09-20T09:15:00Z',
    description: 'Creative Cloud for Marketing team.'
  }
];

const createApprovalRecord = (approval) => {
  mockApprovals.push(approval);
  return approval;
};

const getPendingApprovals = async (filters = {}) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const where = { status: 'Pending' };
      if (filters.organisationId) {
        where.organisationId = filters.organisationId;
      }
      if (filters.approverId) {
        where.approverId = filters.approverId;
      }

      const list = await db.approval.findMany({
        where,
        include: {
          approver: true,
          ticket: {
            include: { requester: true, organisation: true },
          },
        },
      });
      return list.map((a) => {
        const requester = a.ticket?.requester
          ? `${a.ticket.requester.firstName} ${a.ticket.requester.lastName || ''}`.trim()
          : (a.ticket?.organisation?.name || 'System User');
        return {
          id: a.id,
          title: a.summary,
          requester,
          service: a.entityType || 'General',
          status: a.status,
          stage: 1,
          totalStages: 1,
          stageName: 'Initial Review',
          submittedAt: a.createdAt.toISOString(),
          description: a.comments || a.summary,
          approverId: a.approverId,
          organisationId: a.organisationId || null,
        };
      });
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return mockApprovals.filter(a => {
    if (a.status !== 'Pending') return false;
    if (filters.organisationId && a.organisationId && a.organisationId !== filters.organisationId) {
      return false;
    }
    if (filters.approverId && a.approverId && a.approverId !== filters.approverId) {
      return false;
    }
    return true;
  });
};

const getApprovalById = async (id) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const a = await db.approval.findUnique({
        where: { id },
        include: {
          approver: true,
          ticket: {
            include: { requester: true, organisation: true },
          },
        },
      });
      if (a) {
        const requester = a.ticket?.requester
          ? `${a.ticket.requester.firstName} ${a.ticket.requester.lastName || ''}`.trim()
          : (a.ticket?.organisation?.name || 'System User');
        return {
          id: a.id,
          title: a.summary,
          requester,
          service: a.entityType || 'General',
          status: a.status,
          stage: 1,
          totalStages: 1,
          stageName: 'Initial Review',
          submittedAt: a.createdAt.toISOString(),
          description: a.comments || a.summary,
          approverId: a.approverId,
          organisationId: a.organisationId || null,
        };
      }
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return mockApprovals.find(a => a.id === id) || null;
};

const updateStatus = async (id, status) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const updated = await db.approval.update({
        where: { id },
        data: { status, decidedAt: new Date() },
      });
      return {
        id: updated.id,
        title: updated.summary,
        status: updated.status,
      };
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  const index = mockApprovals.findIndex(a => a.id === id);
  if (index !== -1) {
    mockApprovals[index] = {
      ...mockApprovals[index],
      status
    };
    return mockApprovals[index];
  }
  return null;
};

const conditionalUpdateStatus = async (id, requiredStatus, newStatus, options = {}) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const existing = await db.approval.findUnique({ where: { id } });
      if (existing) {
        if (existing.status !== requiredStatus) {
          return { found: true, updated: false };
        }
        const updated = await db.approval.update({
          where: { id },
          data: {
            status: newStatus,
            decidedAt: new Date(),
            comments: options.comments || existing.comments,
          },
        });
        return {
          found: true,
          updated: true,
          record: {
            id: updated.id,
            title: updated.summary,
            status: updated.status,
            comments: updated.comments,
          },
        };
      }
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  const index = mockApprovals.findIndex(a => a.id === id);
  if (index === -1) {
    return { found: false };
  }
  if (mockApprovals[index].status !== requiredStatus) {
    return { found: true, updated: false };
  }

  const current = mockApprovals[index];
  const now = new Date().toISOString();
  mockApprovals[index] = {
    ...current,
    status: newStatus,
    comments: options.comments || current.comments || null,
    actedBy: options.actedBy || 'Approver',
    decidedAt: now,
  };

  // Multi-stage sequential approval workflow progression
  if (newStatus === 'Approved') {
    if (current.stage && current.totalStages && current.stage < current.totalStages) {
      // Create next approval stage
      const nextStage = {
        id: `${current.id}-S${current.stage + 1}`,
        title: `${current.title} (Stage ${current.stage + 1})`,
        requester: current.requester,
        service: current.service,
        serviceRequestId: current.serviceRequestId || null,
        changeRequestId: current.changeRequestId || null,
        status: 'Pending',
        stage: current.stage + 1,
        totalStages: current.totalStages,
        stageName: `Stage ${current.stage + 1} Review`,
        approverId: current.approverId || null,
        organisationId: current.organisationId || 'org-1',
        submittedAt: now,
        description: current.description,
      };
      mockApprovals.push(nextStage);
    } else {
      // Final stage approval: trigger status progression on parent entity
      if (current.serviceRequestId) {
        try {
          const scModel = require('../services-catalogue/services-catalogue.model');
          scModel.updateRequestStatus(current.serviceRequestId, 'Approved');
        } catch (_err) {
          // ignore circular reference
        }
      }
      if (current.changeRequestId) {
        try {
          const crModel = require('../change-requests/change-requests.model');
          crModel.updateChangeRequest(current.changeRequestId, current.organisationId, { status: 'Approved' });
        } catch (_err) {
          // ignore circular reference
        }
      }
    }
  } else if (newStatus === 'Rejected') {
    if (current.serviceRequestId) {
      try {
        const scModel = require('../services-catalogue/services-catalogue.model');
        scModel.updateRequestStatus(current.serviceRequestId, 'Rejected');
      } catch (_err) {
        // ignore circular reference
      }
    }
    if (current.changeRequestId) {
      try {
        const crModel = require('../change-requests/change-requests.model');
        crModel.updateChangeRequest(current.changeRequestId, current.organisationId, { status: 'Draft' });
      } catch (_err) {
        // ignore circular reference
      }
    }
  }

  return { found: true, updated: true, record: mockApprovals[index] };
};

module.exports = {
  getPendingApprovals,
  getApprovalById,
  updateStatus,
  conditionalUpdateStatus,
  createApprovalRecord,
  mockApprovals
};
