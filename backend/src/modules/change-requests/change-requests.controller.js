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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve the effective organisationId for the authenticated caller.
 * Admins may supply an explicit ?organisationId=... to scope cross-org queries.
 * All other roles are restricted to their own organisation from the JWT.
 *
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const getEffectiveOrgId = (req) => {
  if (req.user?.role === 'Admin' && typeof req.query.organisationId === 'string') {
    const override = req.query.organisationId.trim();
    if (override) return override;
  }
  return req.user?.organisationId || null;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/change-requests
 * Returns all change requests scoped to the caller's organisation (SCR-009).
 */
const getChangeRequestsList = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const changeRequests = await getAllChangeRequests({ organisationId });
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: changeRequests,
    });
  } catch (err) {
    // BUG FIX: Previously caught errors were swallowed into raw 500 JSON,
    // bypassing the centralized error handler and audit logging.
    // Now all errors propagate to Express errorHandler via next(err).
    return next(err);
  }
};

/**
 * GET /api/change-requests/active
 * Returns only Active-status change requests for SCR-026.
 */
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

/**
 * GET /api/change-requests/:id
 * Returns a single change request by ID, enforcing tenant isolation.
 */
const getChangeRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID format before hitting DB — rejects oversized or malformed values.
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

/**
 * POST /api/change-requests
 * Create a new Change Request submitted from the frontend modal.
 * Caller cannot supply `id` or `status` — both are enforced server-side.
 */
const createChangeRequest = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const record = await createNewChangeRequest(req.body, organisationId);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: record,
    });
  } catch (err) {
    // Validation errors from service layer are plain Error objects — map to 422
    if (err.isOperational) return next(err);
    return next(new AppError(err.message, HTTP_STATUS.UNPROCESSABLE_ENTITY));
  }
};

/**
 * PATCH /api/change-requests/:id
 * Update a Change Request's status (and future: implementation checklist).
 * Enforces tenant isolation before mutating. Only allowlisted fields are applied.
 */
const updateChangeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !id.trim() || id.length > 50) {
      return next(
        new AppError('Invalid change request ID format', HTTP_STATUS.BAD_REQUEST)
      );
    }

    const organisationId = getEffectiveOrgId(req);

    // Fetch existing record to validate state transition and prevent workflow bypass (New Bug 2)
    const existing = await getChangeRequestDetails(id.trim(), organisationId);
    if (!existing) {
      return next(
        new AppError('Change request not found', HTTP_STATUS.NOT_FOUND)
      );
    }

    const { status } = req.body;
    if (status) {
      // SECURITY FIX (New Bug 2): Prevent skipping CAB approval workflow from On Hold directly to Approved
      if (status === 'Approved' && existing.status === 'On Hold') {
        return next(
          new AppError(
            'Workflow Error: Change Request cannot transition directly from On Hold to Approved. It must first be resubmitted for Pending Approval.',
            HTTP_STATUS.UNPROCESSABLE_ENTITY
          )
        );
      }

      // Role check: Only Approver, Admin, or System Manager can approve or reject
      if ((status === 'Approved' || status === 'Rejected') && req.user) {
        const allowedRoles = ['Admin', 'Approver', 'System Manager'];
        if (!allowedRoles.includes(req.user.role)) {
          return next(
            new AppError(
              'Permission Denied: Only Approver or Administrator roles may approve or reject change requests.',
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
    // Validation errors from service layer — map to 422
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