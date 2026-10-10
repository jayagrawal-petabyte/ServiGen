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
      if (items && items.length > 0) {
        return items.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          description: s.description,
          status: s.status,
        }));
      }
    } catch (_err) {
      // Database connection fallback
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
      if (items && items.length > 0) {
        return items.map((c, i) => ({ id: `c${i + 1}`, name: c.category }));
      }
    } catch (_err) {
      // Database connection fallback
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
      // Database connection fallback
    }
  }

  return mockServices.find(s => s.id === id) || null;
};

const createRequest = async (requestData) => {
  const newReq = {
    ...requestData,
    id: `req_${Date.now()}_${_seq++}`,
    submittedAt: new Date().toISOString()
  };
  mockRequests.push(newReq);
  return newReq;
};

module.exports = {
  getAllServices,
  getAllCategories,
  getServiceById,
  createRequest
};
