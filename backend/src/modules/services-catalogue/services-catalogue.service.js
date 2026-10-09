const servicesCatalogueModel = require('./services-catalogue.model');

const fetchServices = async (categoryFilter, searchQuery) => {
  // BI-9: Reject non-string query values (e.g. arrays from repeated params) before
  //       any .toLowerCase() call; callers receive 400 instead of a 500 crash.
  if (categoryFilter !== undefined && categoryFilter !== null && typeof categoryFilter !== 'string') {
    const err = new Error('Query parameter "category" must be a scalar string');
    err.code = 'INVALID_QUERY_TYPE';
    throw err;
  }
  if (searchQuery !== undefined && searchQuery !== null && typeof searchQuery !== 'string') {
    const err = new Error('Query parameter "search" must be a scalar string');
    err.code = 'INVALID_QUERY_TYPE';
    throw err;
  }

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

  // BI-8: Strip the four server-controlled fields from caller data so a crafted
  //        request body cannot overwrite serviceId, serviceName, id, or submittedAt.
  //        All other dynamic form fields in requestData are preserved.
  const {
    serviceId: _sid,
    serviceName: _sname,
    id: _id,
    submittedAt: _sat,
    status: _status,
    ...safeData
  } = requestData;

  const requestRecord = {
    ...safeData,
    serviceId,
    serviceName: service.name,
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
