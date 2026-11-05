'use strict';
const AppError = require('../utils/app-error');
const { ROLES } = require('../constants/roles.constants');
// Inject the module's lookup during mock development; later inject a DB repository.
const approvalScope = (findApproval) => async (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (req.user.role === ROLES.ADMIN) return next();
  if (req.user.role !== ROLES.APPROVER) return next(new AppError('Forbidden', 403));
  const normalizedPath = req.path.replace(/\/$/, '');
  if (['GET', 'HEAD'].includes(req.method) && (normalizedPath === '' || normalizedPath === '/pending')) {
    const json = res.json;
    res.json = function (body) {
      if (body && body.success && Array.isArray(body.data)) {
        body = {
          ...body,
          data: body.data.filter(item => {
            const matchesApprover = item.approverId === req.user.id;
            const matchesOrg = !req.user.organisationId || !item.organisationId || item.organisationId === req.user.organisationId;
            return matchesApprover && matchesOrg;
          })
        };
      }
      return json.call(this, body);
    };
    return next();
  }
  const match = req.path.match(/^\/([^/]+)(?:\/(?:approve|reject))?\/?$/);
  if (!match) return next(new AppError('Route not found', 404));
  try {
    const approval = await findApproval(decodeURIComponent(match[1]));
    // Unassigned records are not accessible to an approver. Do not reveal existence.
    // Also enforce tenant boundary if approval has an organisationId.
    if (!approval || approval.approverId !== req.user.id) return next(new AppError('Approval request not found', 404));
    if (req.user.organisationId && approval.organisationId && approval.organisationId !== req.user.organisationId) {
      return next(new AppError('Approval request not found', 404));
    }
    return next();
  } catch (error) { return next(error); }
};
module.exports = { approvalScope };
