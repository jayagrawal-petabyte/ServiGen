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
    submittedAt: '2026-09-24T10:00:00Z',
    description: 'Requires a standard dev laptop.'
  },
  {
    id: 'a2',
    title: 'VPN Access',
    requester: 'Jane Smith',
    service: 'Access',
    status: 'Pending',
    submittedAt: '2026-09-25T14:30:00Z',
    description: 'VPN access for remote work.'
  },
  {
    id: 'a3',
    title: 'Adobe CC License',
    requester: 'Emily Johnson',
    service: 'Software',
    status: 'Approved',
    submittedAt: '2026-09-20T09:15:00Z',
    description: 'Creative Cloud for Marketing team.'
  }
];

const getPendingApprovals = async () => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const list = await db.approval.findMany({
        where: { status: 'Pending' },
        include: { approver: true },
      });
      if (list && list.length > 0) {
        return list.map((a) => ({
          id: a.id,
          title: a.summary,
          requester: a.approver?.firstName ? `${a.approver.firstName} ${a.approver.lastName}` : 'System User',
          service: a.entityType || 'General',
          status: a.status,
          submittedAt: a.createdAt.toISOString(),
          description: a.comments || a.summary,
          approverId: a.approverId,
        }));
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  return mockApprovals.filter(a => a.status === 'Pending');
};

const getApprovalById = async (id) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const a = await db.approval.findUnique({
        where: { id },
        include: { approver: true },
      });
      if (a) {
        return {
          id: a.id,
          title: a.summary,
          requester: a.approver?.firstName ? `${a.approver.firstName} ${a.approver.lastName}` : 'System User',
          service: a.entityType || 'General',
          status: a.status,
          submittedAt: a.createdAt.toISOString(),
          description: a.comments || a.summary,
          approverId: a.approverId,
        };
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  return mockApprovals.find(a => a.id === id) || null;
};

const updateStatus = async (id, status) => {
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

const conditionalUpdateStatus = async (id, requiredStatus, newStatus) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const existing = await db.approval.findUnique({ where: { id } });
      if (existing) {
        if (existing.status !== requiredStatus) {
          return { found: true, updated: false };
        }
        const updated = await db.approval.update({
          where: { id },
          data: { status: newStatus, decidedAt: new Date() },
        });
        return {
          found: true,
          updated: true,
          record: {
            id: updated.id,
            title: updated.summary,
            status: updated.status,
          },
        };
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  const index = mockApprovals.findIndex(a => a.id === id);
  if (index === -1) {
    return { found: false };
  }
  if (mockApprovals[index].status !== requiredStatus) {
    return { found: true, updated: false };
  }
  mockApprovals[index] = { ...mockApprovals[index], status: newStatus };
  return { found: true, updated: true, record: mockApprovals[index] };
};

module.exports = {
  getPendingApprovals,
  getApprovalById,
  updateStatus,
  conditionalUpdateStatus
};
