'use strict';

const db = require('../../config/db');

const mockServices = [
  { id: '1', name: 'Request a Laptop', category: 'Hardware', description: 'Standard laptop for developers', status: 'Active' },
  { id: '2', name: 'VPN Access', category: 'Access', description: 'Secure remote access', status: 'Active' },
  { id: '3', name: 'Adobe Creative Cloud', category: 'Software', description: 'Design software suite', status: 'Active' },
  { id: '4', name: 'Mobile Phone', category: 'Hardware', description: 'Corporate mobile phone request', status: 'Active' }
];

const mockCategories = [
  { id: 'c1', name: 'Hardware' },
  { id: 'c2', name: 'Software' },
  { id: 'c3', name: 'Access' }
];

const mockRequests = [];
let _seq = 0;

const getAllServices = async () => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const items = await db.serviceCatalogueItem.findMany();
      return items.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description,
        status: s.status,
      }));
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  return mockServices;
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

const createRequest = async (requestData) => {
  const reqId = `req_${Date.now()}_${_seq++}`;
  const submittedAt = new Date().toISOString();
  const newReq = {
    ...requestData,
    id: reqId,
    submittedAt
  };

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
            status: 'Pending',
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

        const item = await db.serviceCatalogueItem.findUnique({ where: { id: requestData.serviceId } });
        if (item?.requiresApproval) {
          const approver = await db.user.findFirst({ where: { role: 'Approver' } });
          await db.approval.create({
            data: {
              id: `APP-${Date.now().toString().slice(-4)}`,
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
  }

  mockRequests.push(newReq);
  return newReq;
};

module.exports = {
  getAllServices,
  getAllCategories,
  getServiceById,
  createRequest
};
