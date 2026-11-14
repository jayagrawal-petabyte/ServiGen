'use strict';

const servicesCatalogueModel = require('./services-catalogue.model');
const {
  MAX_DESCRIPTION_LENGTH,
  validateAndSanitizeTicketInput,
} = require('../../shared/ticket-validation');
const sanitizeInputText = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim();
};

const validateValueLength = (value, field, maxLength = 2000) => {
  if (typeof value === 'string' && value.length > maxLength) {
    const err = new Error(`${field} must not exceed ${maxLength} characters`);
    err.statusCode = 400;
    throw err;
  }
};

const fetchServices = async (categoryFilter, searchQuery, filters = {}) => {
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

  let services = await servicesCatalogueModel.getAllServices(filters);

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

const fetchRequests = async (filters = {}) => {
  return await servicesCatalogueModel.getAllRequests(filters);
};

const fetchRequestById = async (requestId) => {
  return await servicesCatalogueModel.getRequestById(requestId);
};

const createServiceRequest = async (serviceId, requestData, user = {}) => {
  const service = await servicesCatalogueModel.getServiceById(serviceId);
  if (!service) {
    throw new Error('Service not found');
  }
  if (service.status !== 'Active') {
    throw new Error('Service is not available for requests');
  }

  // BI-8: Strip the protected server-controlled fields from caller data so a crafted
  //        request body cannot overwrite serviceId, serviceName, id, submittedAt, or status.
  const {
    serviceId: _sid,
    serviceName: _sname,
    id: _id,
    submittedAt: _sat,
    status: _status,
    organisationId: _orgId,
    ...callerData
  } = requestData;

  // Validate dynamic form fields schema if defined
  if (Array.isArray(service.formFields)) {
    for (const field of service.formFields) {
      const val = callerData[field.name];
      if (callerData.validateForm && field.required && (val === undefined || val === null || val === '')) {
        const err = new Error(`Field "${field.label || field.name}" is required`);
        err.statusCode = 400;
        throw err;
      }
      if (field.type === 'select' && Array.isArray(field.options) && val !== undefined) {
        if (!field.options.includes(val)) {
          const err = new Error(`Invalid option "${val}" for ${field.name}`);
          err.statusCode = 400;
          throw err;
        }
      }
    }
  }

// Sanitize and validate all user-provided string inputs.
const safeData = {};

for (const [key, val] of Object.entries(callerData)) {
  if (typeof val === 'string') {
    if (key === 'reason' || key === 'description') {
      // Ticket descriptions support up to 10,000 characters
      // and only the safe rich-text formatting defined centrally.
      validateValueLength(val, key, MAX_DESCRIPTION_LENGTH);

      safeData[key] = validateAndSanitizeTicketInput({
        summary: 'Service Request',
        description: val,
      }).description;
    } else {
      // Other dynamic form fields retain their existing 2,000-char limit.
      validateValueLength(val, key, 2000);
      safeData[key] = sanitizeInputText(val);
    }
  } else {
    safeData[key] = val;
  }
}

  const organisationId = user.organisationId || service.organisationId || 'org-1';

  const requestRecord = {
    ...safeData,
    serviceId,
    serviceName: service.name,
    status: service.requiresApproval ? 'Pending Approval' : 'Submitted',
    organisationId,
    requesterId: user.id || null,
    requesterEmail: user.email || safeData.requester || 'User',
  };

  return await servicesCatalogueModel.createRequest(requestRecord);
};

module.exports = {
  fetchServices,
  fetchCategories,
  fetchServiceById,
  fetchRequests,
  fetchRequestById,
  createServiceRequest,
  sanitizeInputText,
};
