'use strict';

const {
  getAllContracts,
  getContractDetails,
  createNewContract,
  updateContractDetails,
  removeContract,
} = require('./contracts.service');
const AppError = require('../../shared/utils/app-error');
const { HTTP_STATUS } = require('../../shared/constants/http.constants');

const getEffectiveOrgId = (req) => {
  if (req.user?.role === 'Admin' && typeof req.query.organisationId === 'string') {
    const override = req.query.organisationId.trim();
    if (override) return override;
  }
  return req.user?.organisationId || null;
};

const getContractsList = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const { status, contractType, expiringSoonDays } = req.query;

    const contracts = await getAllContracts({
      organisationId,
      status: status || undefined,
      contractType: contractType || undefined,
      expiringSoonDays: expiringSoonDays || undefined,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: contracts,
    });
  } catch (err) {
    return next(err);
  }
};

const getContractById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return next(new AppError('Invalid contract ID', HTTP_STATUS.BAD_REQUEST));
    }

    const organisationId = getEffectiveOrgId(req);
    const contract = await getContractDetails(id.trim(), organisationId);

    if (!contract) {
      return next(new AppError('Contract not found', HTTP_STATUS.NOT_FOUND));
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: contract,
    });
  } catch (err) {
    return next(err);
  }
};

const createContractHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const created = await createNewContract(req.body, organisationId);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Contract created successfully',
      data: created,
    });
  } catch (err) {
    return next(new AppError(err.message, HTTP_STATUS.BAD_REQUEST));
  }
};

const updateContractHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return next(new AppError('Invalid contract ID', HTTP_STATUS.BAD_REQUEST));
    }

    const organisationId = getEffectiveOrgId(req);
    const updated = await updateContractDetails(id.trim(), req.body, organisationId);

    if (!updated) {
      return next(new AppError('Contract not found or update failed', HTTP_STATUS.NOT_FOUND));
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Contract updated successfully',
      data: updated,
    });
  } catch (err) {
    return next(new AppError(err.message, HTTP_STATUS.BAD_REQUEST));
  }
};

const deleteContractHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return next(new AppError('Invalid contract ID', HTTP_STATUS.BAD_REQUEST));
    }

    const organisationId = getEffectiveOrgId(req);
    const deleted = await removeContract(id.trim(), organisationId);

    if (!deleted) {
      return next(new AppError('Contract not found or deletion failed', HTTP_STATUS.NOT_FOUND));
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Contract deleted successfully',
      data: deleted,
    });
  } catch (err) {
    return next(err);
  }
};

const getExpiringSoonHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const days = Number(req.query.days) || 60;

    const expiring = await getAllContracts({
      organisationId,
      expiringSoonDays: days,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      count: expiring.length,
      daysThreshold: days,
      data: expiring,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getContractsList,
  getContractById,
  createContractHandler,
  updateContractHandler,
  deleteContractHandler,
  getExpiringSoonHandler,
};
