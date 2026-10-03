const servicesCatalogueModel = require('./services-catalogue.model');

const fetchServices = async (categoryFilter, searchQuery) => {
  let services = await servicesCatalogueModel.getAllServices();

  if (categoryFilter) {
    const lowerCategory = categoryFilter.toLowerCase();
    services = services.filter(s => s.category.toLowerCase() === lowerCategory);
  }

  if (searchQuery) {
    const lowerSearch = searchQuery.toLowerCase();
    services = services.filter(s =>
      s.name.toLowerCase().includes(lowerSearch) ||
      s.description.toLowerCase().includes(lowerSearch) ||
      s.category.toLowerCase().includes(lowerSearch)
    );
  }

  return services;
};

const fetchCategories = async () => {
  return await servicesCatalogueModel.getAllCategories();
};

const fetchServiceById = async (serviceId) => {
  return await servicesCatalogueModel.getServiceById(serviceId);
};

const createServiceRequest = async (serviceId, requestData) => {
  const service = await servicesCatalogueModel.getServiceById(serviceId);
  if (!service) {
    throw new Error('Service not found');
  }
  if (service.status !== 'Active') {
    throw new Error('Service is not available for requests');
  }

  // Inject required metadata
  const requestRecord = {
    serviceId,
    serviceName: service.name,
    ...requestData,
    status: 'Pending Approval'
  };

  return await servicesCatalogueModel.createRequest(requestRecord);
};

module.exports = {
  fetchServices,
  fetchCategories,
  fetchServiceById,
  createServiceRequest
};
