'use strict';

const {
  listContracts,
  getContractDetail,
  createContract,
  updateContract,
  deleteContract,
  getExpiringSoonContracts,
  linkCi,
  unlinkCi,
  getLinkedCis,
} = require('./contracts.service');
const { HTTP_STATUS } = require('../../shared/constants/http.constants');

const getEffectiveOrgId = (req) => {
  if (req.user && req.user.role === 'Admin' && typeof req.query.organisationId === 'string' && req.query.organisationId.trim()) {
    return req.query.organisationId.trim();
  }
  return req.user?.organisationId || req.headers['x-org-id'] || null;
};

const getContractsHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const { status, type, vendorName, search } = req.query;

    const contracts = await listContracts({
      organisationId,
      status,
      type,
      vendorName,
      search,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    return next(error);
  }
};

const getExpiringSoonHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const expiring = await getExpiringSoonContracts(organisationId, req.query);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: expiring,
    });
  } catch (error) {
    return next(error);
  }
};

const getContractByIdHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organisationId = getEffectiveOrgId(req);
    const contract = await getContractDetail(id, organisationId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    return next(error);
  }
};

const createContractHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const contract = await createContract(req.body, organisationId);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    return next(error);
  }
};

const updateContractHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organisationId = getEffectiveOrgId(req);
    const updated = await updateContract(id, organisationId, req.body);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteContractHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organisationId = getEffectiveOrgId(req);
    const deleted = await deleteContract(id, organisationId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: deleted,
      message: 'Contract deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const getLinkedCisHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organisationId = getEffectiveOrgId(req);
    const result = await getLinkedCis(id, organisationId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const linkCiHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organisationId = getEffectiveOrgId(req);
    const link = await linkCi(id, organisationId, req.body);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: link,
    });
  } catch (error) {
    return next(error);
  }
};

const unlinkCiHandler = async (req, res, next) => {
  try {
    const { id, ciId } = req.params;
    const organisationId = getEffectiveOrgId(req);
    const result = await unlinkCi(id, organisationId, ciId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getContractsHandler,
  getExpiringSoonHandler,
  getContractByIdHandler,
  createContractHandler,
  updateContractHandler,
  deleteContractHandler,
  getLinkedCisHandler,
  linkCiHandler,
  unlinkCiHandler,
};

