'use strict';

const {
  listProblems,
  getProblemDetail,
  createProblem,
  updateProblem,
  updateProblemStage,
  reassignProblem,
  addWorkaround,
  updateRootCause,
  getLinkedIncidents,
  linkIncidents,
  unlinkIncident,
  bulkResolveChildIncidents,
  getLinkedCis,
  linkCi,
  unlinkCi,
  getProblemLogs,
  postProblemLog,
  sendProblemEmail,
  deleteProblem,
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
    const override = req.query.organisationId || req.body?.organisationId;
    return typeof override === 'string' && override.trim() ? override.trim() : (req.user.organisationId || 'org-001');
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

    const { status, stage, priority, category, team, search, knownError } = req.query;
    const filters = {
      organisationId,
      status,
      stage,
      priority,
      category,
      team,
      search,
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

const deleteProblemHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const deleted = await deleteProblem(req.params.id, organisationId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Problem record deleted successfully',
      data: deleted,
    });
  } catch (err) {
    return next(err);
  }
};

const updateProblemStageHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const updated = await updateProblemStage(req.params.id, organisationId, req.body);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Problem stage updated successfully',
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

const reassignProblemHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const updated = await reassignProblem(req.params.id, organisationId, req.body);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Problem reassigned successfully',
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

const updateRootCauseHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const updated = await updateRootCause(req.params.id, organisationId, req.body);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Root cause updated successfully',
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

const getLinkedIncidentsHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const incidents = await getLinkedIncidents(req.params.id, organisationId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: incidents,
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

const unlinkIncidentHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const updated = await unlinkIncident(req.params.id, organisationId, req.params.incidentId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Incident unlinked successfully',
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

const bulkResolveChildIncidentsHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const result = await bulkResolveChildIncidents(req.params.id, organisationId, req.body);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Child incidents resolved successfully',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

const getLinkedCisHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const cis = await getLinkedCis(req.params.id, organisationId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: cis,
    });
  } catch (err) {
    return next(err);
  }
};

const linkCiHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const updated = await linkCi(req.params.id, organisationId, req.body);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'CI linked to problem successfully',
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

const unlinkCiHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const updated = await unlinkCi(req.params.id, organisationId, req.params.ciId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'CI unlinked successfully',
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

const getProblemLogsHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const logs = await getProblemLogs(req.params.id, organisationId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: logs,
    });
  } catch (err) {
    return next(err);
  }
};

const postProblemLogHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const verifiedUser = req.user?.name || req.user?.email || req.user?.id || 'Agent';
    const logEntry = await postProblemLog(req.params.id, organisationId, {
      ...req.body,
      verifiedUser,
    });
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Log entry posted successfully',
      data: logEntry,
    });
  } catch (err) {
    return next(err);
  }
};

const sendProblemEmailHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const verifiedUser = req.user?.name || req.user?.email || req.user?.id || 'Service Desk';
    const result = await sendProblemEmail(req.params.id, organisationId, {
      ...req.body,
      verifiedUser,
    });
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Email update sent successfully',
      data: result,
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
  deleteProblemHandler,
  updateProblemStageHandler,
  reassignProblemHandler,
  addWorkaroundHandler,
  updateRootCauseHandler,
  getLinkedIncidentsHandler,
  linkIncidentsHandler,
  unlinkIncidentHandler,
  bulkResolveChildIncidentsHandler,
  getLinkedCisHandler,
  linkCiHandler,
  unlinkCiHandler,
  getProblemLogsHandler,
  postProblemLogHandler,
  sendProblemEmailHandler,
};
