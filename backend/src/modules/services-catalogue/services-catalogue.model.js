'use strict';

const db = require('../../config/db');

const mockServices = [
  {
    id: '1',
    name: 'Request a Laptop',
    category: 'Hardware',
    description: 'Standard laptop for developers',
    status: 'Active',
    requiresApproval: true,
    organisationId: 'org-1',
    approvalRole: 'Approver',
    approvalStages: [
      { stage: 1, name: 'Line Manager Review' },
      { stage: 2, name: 'IT Assets Review' }
    ],
    formFields: [
      { name: 'model', label: 'Laptop Model', type: 'select', required: true, options: ['MacBook Pro 16', 'ThinkPad X1 Carbon', 'Dell XPS 15'] },
      { name: 'reason', label: 'Business Justification', type: 'text', required: true },
      { name: 'shippingAddress', label: 'Delivery Address', type: 'text', required: false },
      { name: 'costCenter', label: 'Cost Center', type: 'text', required: false }
    ]
  },
  {
    id: '2',
    name: 'VPN Access',
    category: 'Access',
    description: 'Secure remote access',
    status: 'Active',
    requiresApproval: true,
    organisationId: 'org-1',
    approvalRole: 'Approver',
    approvalStages: [
      { stage: 1, name: 'Security Lead Review' }
    ],
    formFields: [
      { name: 'accessType', label: 'Access Type', type: 'select', required: true, options: ['Standard Remote', 'Production DB Access', 'Admin VPN'] },
      { name: 'reason', label: 'Reason for Access', type: 'text', required: true },
      { name: 'durationDays', label: 'Duration (Days)', type: 'number', required: false }
    ]
  },
  {
    id: '3',
    name: 'Adobe Creative Cloud',
    category: 'Software',
    description: 'Design software suite',
    status: 'Active',
    requiresApproval: true,
    organisationId: 'org-1',
    approvalRole: 'Approver',
    approvalStages: [
      { stage: 1, name: 'Design Manager Review' }
    ],
    formFields: [
      { name: 'softwareTier', label: 'Plan', type: 'select', required: true, options: ['All Apps', 'Photoshop & Illustrator', 'Premiere Pro'] },
      { name: 'reason', label: 'Project Justification', type: 'text', required: true }
    ]
  },
  {
    id: '4',
    name: 'Mobile Phone',
    category: 'Hardware',
    description: 'Corporate mobile phone request',
    status: 'Active',
    requiresApproval: false,
    organisationId: 'org-1',
    approvalStages: [],
    formFields: [
      { name: 'deviceType', label: 'Preferred Device', type: 'select', required: true, options: ['iPhone 15 Pro', 'Google Pixel 8 Pro', 'Samsung S24'] },
      { name: 'reason', label: 'Usage Need', type: 'text', required: true }
    ]
  }
];

const mockCategories = [
  { id: 'c1', name: 'Hardware' },
  { id: 'c2', name: 'Software' },
  { id: 'c3', name: 'Access' }
];

const mockRequests = [];
let _seq = 0;

const getAllServices = async (filters = {}) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const where = {};
      if (filters.organisationId) {
        where.organisationId = filters.organisationId;
      }
      const items = await db.serviceCatalogueItem.findMany({ where });
      return items.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description,
        status: s.status,
        requiresApproval: s.requiresApproval,
        formFields: s.formFields || [],
        organisationId: s.organisationId || null,
      }));
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return mockServices.filter((s) => {
    if (filters.organisationId && s.organisationId && s.organisationId !== filters.organisationId) {
      return false;
    }
    return true;
  });
};

const getAllCategories = async () => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const items = await db.serviceCatalogueItem.findMany({
        select: { category: true },
        distinct: ['category'],
      });
      return items.map((c, i) => ({ id: `c${i + 1}`, name: c.category }));
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return mockCategories;
};

const getServiceById = async (id) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const s = await db.serviceCatalogueItem.findUnique({
        where: { id },
      });
      if (s) {
        return {
          id: s.id,
          name: s.name,
          category: s.category,
          description: s.description,
          status: s.status,
          requiresApproval: s.requiresApproval,
          formFields: s.formFields || [],
          organisationId: s.organisationId || null,
        };
      }
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return mockServices.find(s => s.id === id) || null;
};

const getAllRequests = async (filters = {}) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const where = {};
      if (filters.organisationId) {
        where.ticket = { organisationId: filters.organisationId };
      }
      if (filters.requesterId) {
        where.ticket = { ...where.ticket, requesterId: filters.requesterId };
      }
      const requests = await db.serviceRequest.findMany({
        where,
        include: {
          ticket: true,
          serviceCatalogueItem: true,
          approvals: true,
        },
      });
      return requests.map(r => ({
        id: r.id,
        ticketId: r.ticketId,
        serviceId: r.serviceCatalogueItemId,
        serviceName: r.serviceCatalogueItem?.name || 'Service',
        status: r.ticket?.status || 'Pending',
        requestedData: r.requestedData,
        submittedAt: r.createdAt.toISOString(),
        organisationId: r.ticket?.organisationId || null,
        approvals: r.approvals || [],
      }));
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return mockRequests.filter((r) => {
    if (filters.organisationId && r.organisationId && r.organisationId !== filters.organisationId) {
      return false;
    }
    if (filters.requesterId && r.requesterId && r.requesterId !== filters.requesterId) {
      return false;
    }
    return true;
  });
};

const getRequestById = async (id) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const r = await db.serviceRequest.findUnique({
        where: { id },
        include: {
          ticket: true,
          serviceCatalogueItem: true,
          approvals: true,
        },
      });
      if (r) {
        return {
          id: r.id,
          ticketId: r.ticketId,
          serviceId: r.serviceCatalogueItemId,
          serviceName: r.serviceCatalogueItem?.name || 'Service',
          status: r.ticket?.status || 'Pending',
          requestedData: r.requestedData,
          submittedAt: r.createdAt.toISOString(),
          organisationId: r.ticket?.organisationId || null,
          approvals: r.approvals || [],
        };
      }
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return mockRequests.find(r => r.id === id) || null;
};

const updateRequestStatus = async (id, status) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const req = await db.serviceRequest.findUnique({ where: { id } });
      if (req?.ticketId) {
        await db.ticket.update({
          where: { id: req.ticketId },
          data: { status },
        });
      }
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  const found = mockRequests.find(r => r.id === id);
  if (found) {
    found.status = status;
    return found;
  }
  return null;
};

const createRequest = async (requestData) => {
  const reqId = `req_${Date.now()}_${++_seq}`;
  const submittedAt = new Date().toISOString();
  const newReq = {
    ...requestData,
    id: reqId,
    submittedAt
  };

  const service = await getServiceById(requestData.serviceId);

  if (process.env.NODE_ENV !== 'test') {
    try {
      const defaultOrg = await db.organisation.findFirst();
      const orgId = requestData.organisationId || defaultOrg?.id;

      if (orgId) {
        const ticket = await db.ticket.create({
          data: {
            summary: `Request for ${requestData.serviceName || 'Service'}`,
            description: requestData.reason || requestData.description || `Service request for ${requestData.serviceName}`,
            priority: requestData.priority || 'Medium',
            status: service?.requiresApproval ? 'Pending Approval' : 'Submitted',
            ticketType: 'Service Request',
            organisationId: orgId,
            siteName: requestData.siteName || 'London HQ',
            requesterId: requestData.requesterId || null,
          },
        });

        const sr = await db.serviceRequest.create({
          data: {
            ticketId: ticket.id,
            serviceCatalogueItemId: requestData.serviceId,
            requestedData: requestData,
          },
        });

        if (service?.requiresApproval) {
          const approver = await db.user.findFirst({ where: { role: 'Approver' } });
          await db.approval.create({
            data: {
              id: `APP-${Date.now().toString().slice(-4)}`,
              organisationId: orgId,
              ticketId: ticket.id,
              entityType: 'Service Request',
              entityId: sr.id,
              serviceRequestId: sr.id,
              summary: `${requestData.serviceName || 'Service'} approval request`,
              status: 'Pending',
              approverId: approver?.id || null,
            },
          });
        }

        newReq.ticketId = ticket.id;
        newReq.serviceRequestId = sr.id;
      }
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  } else {
    // In test/mock mode, automatically generate a pending approval in approvals.model if approval required
    if (service?.requiresApproval) {
      try {
        const approvalsModel = require('../approvals/approvals.model');
        const stages = service.approvalStages && service.approvalStages.length > 0
          ? service.approvalStages
          : [{ stage: 1, name: 'Initial Approval' }];

        approvalsModel.createApprovalRecord({
          id: `APP-SR-${reqId}`,
          title: `${requestData.serviceName} Approval`,
          requester: requestData.requester || requestData.requesterEmail || 'Requester',
          service: requestData.serviceName,
          serviceRequestId: reqId,
          entityType: 'Service Request',
          status: 'Pending',
          stage: 1,
          totalStages: stages.length,
          stageName: stages[0].name,
          approverId: 'approver-test',
          organisationId: requestData.organisationId || 'org-1',
          submittedAt,
          description: requestData.reason || `Approval request for ${requestData.serviceName}`
        });
      } catch (_err) {
        // Silently continue if approvals model is circular
      }
    }
  }

  mockRequests.push(newReq);
  return newReq;
};

module.exports = {
  getAllServices,
  getAllCategories,
  getServiceById,
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  createRequest,
  mockServices,
  mockRequests
};
