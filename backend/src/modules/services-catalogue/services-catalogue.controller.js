'use strict';

const servicesCatalogueService = require('./services-catalogue.service');

const isCrossTenant = (record, user) => {
  if (!record || !user) return false;
  if (user.role === 'Admin') return false;
  if (user.organisationId && record.organisationId && record.organisationId !== user.organisationId) {
    return true;
  }
  return false;
};

const getServices = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filters = {};
    if (req.user && req.user.role !== 'Admin' && req.user.organisationId) {
      filters.organisationId = req.user.organisationId;
    }
    const services = await servicesCatalogueService.fetchServices(category, search, filters);
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    // BI-9: non-string query params (e.g. repeated ?category=) surface as 400
    if (error.code === 'INVALID_QUERY_TYPE') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await servicesCatalogueService.fetchCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getServiceById = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await servicesCatalogueService.fetchServiceById(serviceId);

    if (!service || isCrossTenant(service, req.user)) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getServiceRequests = async (req, res) => {
  try {
    const filters = {};
    if (req.user && req.user.role !== 'Admin') {
      if (req.user.organisationId) {
        filters.organisationId = req.user.organisationId;
      }
      if (req.user.role === 'Service User') {
        filters.requesterId = req.user.id || req.user.email || '__unauthorized__';
      }
    }
    const requests = await servicesCatalogueService.fetchRequests(filters);
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getServiceRequestDetail = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await servicesCatalogueService.fetchRequestById(requestId);

    if (!request || isCrossTenant(request, req.user)) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    // Service Users can only see their own requests
    if (req.user && req.user.role === 'Service User') {
      const userIdentifier = req.user.id || req.user.email;
      const matchId = request.requesterId && request.requesterId === userIdentifier;
      const matchEmail = request.requesterEmail && request.requesterEmail === userIdentifier;
      if (!matchId && !matchEmail) {
        return res.status(404).json({ success: false, message: 'Service request not found' });
      }
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const submitServiceRequest = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const requestData = req.body;

    if (!requestData || Object.keys(requestData).length === 0) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }

    const newRequest = await servicesCatalogueService.createServiceRequest(serviceId, requestData, req.user || {});
    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    if (error.message === 'Service not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Service is not available for requests') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getServices,
  getCategories,
  getServiceById,
  getServiceRequests,
  getServiceRequestDetail,
  submitServiceRequest
};
