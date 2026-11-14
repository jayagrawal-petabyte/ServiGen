'use strict';

const sanitizeHtml = require('sanitize-html');
const {
  getContracts,
  getContractById,
  createContractRecord,
  updateContractRecord,
  deleteContractRecord,
  linkCiToContract,
  unlinkCiFromContract,
  getExpiringContracts,
} = require('./contracts.model');
const AppError = require('../../shared/utils/app-error');
const { HTTP_STATUS } = require('../../shared/constants/http.constants');

const VALID_TYPES = ['SLA', 'Maintenance', 'License', 'Underpinning', 'Warranty'];
const VALID_STATUSES = ['Active', 'Expired', 'Pending Renewal', 'Draft'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeText = (str) => {
  if (typeof str !== 'string') return '';
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
};

const listContracts = async (filters = {}) => {
  return getContracts(filters);
};

const getContractDetail = async (id, organisationId = null) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Valid contract ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const contract = await getContractById(id.trim(), organisationId);
  if (!contract) {
    throw new AppError('Contract not found', HTTP_STATUS.NOT_FOUND);
  }
  return contract;
};

const createContract = async (payload = {}, organisationId) => {
  if (!organisationId) {
    throw new AppError('Organisation ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const {
    title,
    vendorName,
    vendorEmail,
    type = 'SLA',
    status = 'Draft',
    startDate,
    endDate,
    renewalDate,
    autoRenew = false,
    contractValue,
    currency = 'USD',
    notes,
    ciIds = [],
  } = payload;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new AppError('Title is required', HTTP_STATUS.BAD_REQUEST);
  }
  if (title.trim().length > 255) {
    throw new AppError('Title cannot exceed 255 characters', HTTP_STATUS.BAD_REQUEST);
  }

  if (!vendorName || typeof vendorName !== 'string' || !vendorName.trim()) {
    throw new AppError('Vendor name is required', HTTP_STATUS.BAD_REQUEST);
  }
  if (vendorName.trim().length > 255) {
    throw new AppError('Vendor name cannot exceed 255 characters', HTTP_STATUS.BAD_REQUEST);
  }

  if (vendorEmail && (typeof vendorEmail !== 'string' || !EMAIL_REGEX.test(vendorEmail.trim()))) {
    throw new AppError('Invalid vendor email format', HTTP_STATUS.BAD_REQUEST);
  }

  if (type && !VALID_TYPES.includes(type)) {
    throw new AppError(`Type must be one of: ${VALID_TYPES.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  if (status && !VALID_STATUSES.includes(status)) {
    throw new AppError(`Status must be one of: ${VALID_STATUSES.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  const parseDate = (d) => {
    if (!d) return null;
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) {
      throw new AppError(`Invalid date: ${d}`, HTTP_STATUS.BAD_REQUEST);
    }
    return parsed.toISOString();
  };

  const cleanStartDate = parseDate(startDate);
  const cleanEndDate = parseDate(endDate);
  const cleanRenewalDate = parseDate(renewalDate);

  if (cleanStartDate && cleanEndDate && new Date(cleanStartDate) > new Date(cleanEndDate)) {
    throw new AppError('Start date cannot be after end date', HTTP_STATUS.BAD_REQUEST);
  }

  if (contractValue !== undefined && contractValue !== null) {
    const num = Number(contractValue);
    if (Number.isNaN(num) || num < 0) {
      throw new AppError('Contract value must be a non-negative number', HTTP_STATUS.BAD_REQUEST);
    }
  }

  if (notes && (typeof notes !== 'string' || notes.length > 10000)) {
    throw new AppError('Notes cannot exceed 10000 characters', HTTP_STATUS.BAD_REQUEST);
  }

  return createContractRecord({
    title: sanitizeText(title),
    vendorName: sanitizeText(vendorName),
    vendorEmail: vendorEmail ? sanitizeText(vendorEmail) : null,
    type,
    status,
    startDate: cleanStartDate,
    endDate: cleanEndDate,
    renewalDate: cleanRenewalDate,
    autoRenew: Boolean(autoRenew),
    contractValue: contractValue !== undefined && contractValue !== null ? Number(contractValue) : null,
    currency: sanitizeText(currency) || 'USD',
    notes: notes ? sanitizeText(notes) : null,
    organisationId,
    ciIds: Array.isArray(ciIds) ? ciIds.map(String) : [],
  });
};

const updateContract = async (id, organisationId, patch = {}) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Valid contract ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getContractDetail(id, organisationId);

  const cleanPatch = {};

  if (patch.title !== undefined) {
    if (typeof patch.title !== 'string' || !patch.title.trim()) {
      throw new AppError('Title cannot be empty', HTTP_STATUS.BAD_REQUEST);
    }
    if (patch.title.trim().length > 255) {
      throw new AppError('Title cannot exceed 255 characters', HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.title = sanitizeText(patch.title);
  }

  if (patch.vendorName !== undefined) {
    if (typeof patch.vendorName !== 'string' || !patch.vendorName.trim()) {
      throw new AppError('Vendor name cannot be empty', HTTP_STATUS.BAD_REQUEST);
    }
    if (patch.vendorName.trim().length > 255) {
      throw new AppError('Vendor name cannot exceed 255 characters', HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.vendorName = sanitizeText(patch.vendorName);
  }

  if (patch.vendorEmail !== undefined) {
    if (patch.vendorEmail && (typeof patch.vendorEmail !== 'string' || !EMAIL_REGEX.test(patch.vendorEmail.trim()))) {
      throw new AppError('Invalid vendor email format', HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.vendorEmail = patch.vendorEmail ? sanitizeText(patch.vendorEmail) : null;
  }

  if (patch.type !== undefined) {
    if (!VALID_TYPES.includes(patch.type)) {
      throw new AppError(`Type must be one of: ${VALID_TYPES.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.type = patch.type;
  }

  if (patch.status !== undefined) {
    if (!VALID_STATUSES.includes(patch.status)) {
      throw new AppError(`Status must be one of: ${VALID_STATUSES.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.status = patch.status;
  }

  if (patch.startDate !== undefined) {
    cleanPatch.startDate = patch.startDate ? new Date(patch.startDate).toISOString() : null;
  }

  if (patch.endDate !== undefined) {
    cleanPatch.endDate = patch.endDate ? new Date(patch.endDate).toISOString() : null;
  }

  if (patch.renewalDate !== undefined) {
    cleanPatch.renewalDate = patch.renewalDate ? new Date(patch.renewalDate).toISOString() : null;
  }

  if (cleanPatch.startDate && cleanPatch.endDate && new Date(cleanPatch.startDate) > new Date(cleanPatch.endDate)) {
    throw new AppError('Start date cannot be after end date', HTTP_STATUS.BAD_REQUEST);
  }

  if (patch.autoRenew !== undefined) {
    cleanPatch.autoRenew = Boolean(patch.autoRenew);
  }

  if (patch.contractValue !== undefined) {
    const num = Number(patch.contractValue);
    if (Number.isNaN(num) || num < 0) {
      throw new AppError('Contract value must be a non-negative number', HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.contractValue = num;
  }

  if (patch.currency !== undefined) {
    cleanPatch.currency = sanitizeText(patch.currency);
  }

  if (patch.notes !== undefined) {
    if (typeof patch.notes === 'string' && patch.notes.length > 10000) {
      throw new AppError('Notes cannot exceed 10000 characters', HTTP_STATUS.BAD_REQUEST);
    }
    cleanPatch.notes = patch.notes ? sanitizeText(patch.notes) : null;
  }

  return updateContractRecord(existing.id, organisationId, cleanPatch);
};

const deleteContract = async (id, organisationId) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Valid contract ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getContractDetail(id, organisationId);
  return deleteContractRecord(existing.id, organisationId);
};

const getExpiringSoonContracts = async (organisationId = null, query = {}) => {
  const days = Number(query.days) || 30;
  if (![30, 60, 90, 180, 365].includes(days)) {
    throw new AppError('days parameter must be one of: 30, 60, 90, 180, 365', HTTP_STATUS.BAD_REQUEST);
  }
  return getExpiringContracts(organisationId, days);
};

const linkCi = async (contractId, organisationId, payload = {}) => {
  const ciId = payload.ciId || payload.configurationItemId;
  if (!ciId || typeof ciId !== 'string' || !ciId.trim()) {
    throw new AppError('ciId is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getContractDetail(contractId, organisationId);
  const notes = payload.notes ? sanitizeText(payload.notes) : null;

  return linkCiToContract(existing.id, organisationId, ciId.trim(), notes);
};

const unlinkCi = async (contractId, organisationId, ciId) => {
  if (!ciId || typeof ciId !== 'string' || !ciId.trim()) {
    throw new AppError('ciId is required', HTTP_STATUS.BAD_REQUEST);
  }

  const existing = await getContractDetail(contractId, organisationId);
  return unlinkCiFromContract(existing.id, organisationId, ciId.trim());
};

const getLinkedCis = async (contractId, organisationId) => {
  const existing = await getContractDetail(contractId, organisationId);
  return {
    contractId: existing.id,
    linkedCiIds: existing.linkedCiIds || [],
  };
};

module.exports = {
  VALID_TYPES,
  VALID_STATUSES,
  listContracts,
  getContractDetail,
  createContract,
  updateContract,
  deleteContract,
  getExpiringSoonContracts,
  linkCi,
  unlinkCi,
  getLinkedCis,
};

