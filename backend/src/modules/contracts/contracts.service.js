'use strict';

const {
  VALID_CONTRACT_TYPES,
  VALID_STATUSES,
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
} = require('./contracts.model');

const getAllContracts = async (options = {}) => {
  return await getContracts(options);
};

const getContractDetails = async (id, organisationId = null) => {
  return await getContractById(id, organisationId);
};

const createNewContract = async (body, organisationId) => {
  const {
    title,
    vendorName,
    vendorEmail,
    contractType,
    status,
    value,
    currency,
    startDate,
    endDate,
    renewalDate,
    autoRenew,
    notes,
    linkedCiIds,
  } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error('title is required and must be a non-empty string');
  }
  if (!vendorName || typeof vendorName !== 'string' || !vendorName.trim()) {
    throw new Error('vendorName is required and must be a non-empty string');
  }
  if (!contractType || !VALID_CONTRACT_TYPES.includes(contractType)) {
    throw new Error(`contractType must be one of: ${VALID_CONTRACT_TYPES.join(', ')}`);
  }
  if (status && !VALID_STATUSES.includes(status)) {
    throw new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (startDate && isNaN(Date.parse(startDate))) {
    throw new Error('startDate must be a valid date');
  }
  if (endDate && isNaN(Date.parse(endDate))) {
    throw new Error('endDate must be a valid date');
  }

  return await createContract({
    title: title.trim(),
    vendorName: vendorName.trim(),
    vendorEmail: vendorEmail ? vendorEmail.trim() : null,
    contractType,
    status: status || 'Active',
    value: typeof value === 'number' ? value : value ? Number(value) : 0,
    currency: currency || 'GBP',
    startDate: startDate || new Date().toISOString(),
    endDate: endDate || null,
    renewalDate: renewalDate || null,
    autoRenew: Boolean(autoRenew),
    notes: notes || null,
    linkedCiIds: Array.isArray(linkedCiIds) ? linkedCiIds : [],
    organisationId,
  });
};

const updateContractDetails = async (id, body, organisationId = null) => {
  const patchData = {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw new Error('title must be a non-empty string');
    }
    patchData.title = body.title.trim();
  }

  if (body.vendorName !== undefined) {
    patchData.vendorName = body.vendorName.trim();
  }

  if (body.vendorEmail !== undefined) {
    patchData.vendorEmail = body.vendorEmail ? body.vendorEmail.trim() : null;
  }

  if (body.contractType !== undefined) {
    if (!VALID_CONTRACT_TYPES.includes(body.contractType)) {
      throw new Error(`contractType must be one of: ${VALID_CONTRACT_TYPES.join(', ')}`);
    }
    patchData.contractType = body.contractType;
  }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      throw new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    patchData.status = body.status;
  }

  if (body.value !== undefined) {
    patchData.value = Number(body.value);
  }

  if (body.currency !== undefined) {
    patchData.currency = body.currency;
  }

  if (body.startDate !== undefined) {
    patchData.startDate = body.startDate;
  }

  if (body.endDate !== undefined) {
    patchData.endDate = body.endDate;
  }

  if (body.renewalDate !== undefined) {
    patchData.renewalDate = body.renewalDate;
  }

  if (body.autoRenew !== undefined) {
    patchData.autoRenew = Boolean(body.autoRenew);
  }

  if (body.notes !== undefined) {
    patchData.notes = body.notes;
  }

  if (body.linkedCiIds !== undefined) {
    patchData.linkedCiIds = Array.isArray(body.linkedCiIds) ? body.linkedCiIds : [];
  }

  return await updateContract(id, patchData, organisationId);
};

const removeContract = async (id, organisationId = null) => {
  return await deleteContract(id, organisationId);
};

module.exports = {
  getAllContracts,
  getContractDetails,
  createNewContract,
  updateContractDetails,
  removeContract,
};
