'use strict';

const {
  listProblems,
  getProblemDetail,
  createProblem,
  updateProblem,
  addWorkaround,
  linkIncidents,
} = require('./problems.service');
const { HTTP_STATUS } = require('../../shared/constants/http.constants');

const getEffectiveOrgId = (req, res) => {
  if (!req.user || !req.user.id || !req.user.role) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
    });
    return undefined;
  }

  if (req.user.role === 'Admin') {
    const override = req.query.organisationId;
    return typeof override === 'string' && override.trim() ? override.trim() : (req.user.organisationId || null);
  }

  const orgId = req.user.organisationId;
  if (typeof orgId !== 'string' || !orgId.trim()) {
    res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Organisation access is required',
    });
    return undefined;
  }

  return orgId.trim();
};

const getProblemsHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const { status, priority, category, knownError } = req.query;
    const filters = {
      organisationId,
      status,
      priority,
      category,
      knownError: knownError !== undefined ? knownError === 'true' : undefined,
    };

    const problems = await listProblems(filters);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: problems,
    });
  } catch (err) {
    return next(err);
  }
};

const getProblemByIdHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const problem = await getProblemDetail(req.params.id, organisationId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: problem,
    });
  } catch (err) {
    return next(err);
  }
};

const createProblemHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const problem = await createProblem(req.body, organisationId);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Problem record created successfully',
      data: problem,
    });
  } catch (err) {
    return next(err);
  }
};

const updateProblemHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const updated = await updateProblem(req.params.id, organisationId, req.body);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Problem record updated successfully',
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

const addWorkaroundHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const updated = await addWorkaround(req.params.id, organisationId, req.body);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Workaround recorded successfully',
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

const linkIncidentsHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const updated = await linkIncidents(req.params.id, organisationId, req.body);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Incidents linked to problem successfully',
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getProblemsHandler,
  getProblemByIdHandler,
  createProblemHandler,
  updateProblemHandler,
  addWorkaroundHandler,
  linkIncidentsHandler,
};
