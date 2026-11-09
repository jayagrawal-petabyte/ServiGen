'use strict';

const {
  getSlaComplianceReport,
  getAgentPerformanceReport,
  generateExport,
} = require('./reports.service');
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

const getSlaComplianceHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const report = await getSlaComplianceReport(organisationId, req.query);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: report,
    });
  } catch (err) {
    return next(err);
  }
};

const getAgentPerformanceHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const report = await getAgentPerformanceReport(organisationId, req.query);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: report,
    });
  } catch (err) {
    return next(err);
  }
};

const exportReportHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req, res);
    if (organisationId === undefined) return;

    const result = await generateExport(organisationId, req.query);

    if (result.format === 'csv') {
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(HTTP_STATUS.OK).send(result.content);
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.content,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getSlaComplianceHandler,
  getAgentPerformanceHandler,
  exportReportHandler,
};
