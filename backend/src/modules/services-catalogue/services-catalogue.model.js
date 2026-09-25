// Mock Data Layer for Services Catalogue

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

const getAllServices = async () => {
  return mockServices;
};

const getAllCategories = async () => {
  return mockCategories;
};

const getServiceById = async (id) => {
  return mockServices.find(s => s.id === id) || null;
};

const createRequest = async (requestData) => {
  const newReq = {
    id: `req_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    ...requestData
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
