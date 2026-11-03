'use strict';

const {
  getAllChangeRequests,
  getChangeRequestDetails,
  getActiveChangeRequestsData,
  createNewChangeRequest,
  updateChangeRequestData,
} = require('./change-requests.service');
const AppError = require('../../shared/utils/app-error');
const { HTTP_STATUS } = require('../../shared/constants/http.constants');

const getEffectiveOrgId = (req) => {
  if (req.user?.role === 'Admin' && typeof req.query.organisationId === 'string') {
    const override = req.query.organisationId.trim();
    if (override) return override;
  }
  return req.user?.organisationId || null;
};

const getChangeRequestsList = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const changeRequests = await getAllChangeRequests({ organisationId });
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: changeRequests,
    });
  } catch (err) {
    return next(err);
  }
};

const getActiveChangeRequestsList = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const activeChangeRequests = await getActiveChangeRequestsData({ organisationId });
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: activeChangeRequests,
    });
  } catch (err) {
    return next(err);
  }
};

const getChangeRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !id.trim() || id.length > 50) {
      return next(
        new AppError('Invalid change request ID format', HTTP_STATUS.BAD_REQUEST)
      );
    }

    const organisationId = getEffectiveOrgId(req);
    const changeRequest = await getChangeRequestDetails(id.trim(), organisationId);

    if (!changeRequest) {
      return next(
        new AppError('Change request not found', HTTP_STATUS.NOT_FOUND)
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: changeRequest,
    });
  } catch (err) {
    return next(err);
  }
};

const createChangeRequest = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const record = await createNewChangeRequest(req.body, organisationId);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: record,
    });
  } catch (err) {
    if (err.isOperational) return next(err);
    return next(new AppError(err.message, HTTP_STATUS.UNPROCESSABLE_ENTITY));
  }
};

const updateChangeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !id.trim() || id.length > 50) {
      return next(
        new AppError('Invalid change request ID format', HTTP_STATUS.BAD_REQUEST)
      );
    }

    const organisationId = getEffectiveOrgId(req);
    const existing = await getChangeRequestDetails(id.trim(), organisationId);
    if (!existing) {
      return next(
        new AppError('Change request not found', HTTP_STATUS.NOT_FOUND)
      );
    }

    const { status } = req.body;
    if (status) {
      if (status === 'Approved' && existing.status === 'On Hold') {
        return next(
          new AppError(
            'Cannot transition directly from On Hold to Approved. The change must be resubmitted for approval.',
            HTTP_STATUS.UNPROCESSABLE_ENTITY
          )
        );
      }

      if ((status === 'Approved' || status === 'Rejected') && req.user) {
        const allowedRoles = ['Admin', 'Approver', 'System Manager'];
        if (!allowedRoles.includes(req.user.role)) {
          return next(
            new AppError(
              'Only Approver or Administrator roles may approve or reject change requests.',
              HTTP_STATUS.FORBIDDEN
            )
          );
        }
      }
    }

    const updated = await updateChangeRequestData(id.trim(), req.body, organisationId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    if (err.isOperational) return next(err);
    return next(new AppError(err.message, HTTP_STATUS.UNPROCESSABLE_ENTITY));
  }
};

module.exports = {
  getChangeRequestsList,
  getActiveChangeRequestsList,
  getChangeRequestById,
  createChangeRequest,
  updateChangeRequest,
};
