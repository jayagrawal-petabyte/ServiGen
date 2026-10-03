'use strict';
const AppError = require('../utils/app-error');
const { ROLES } = require('../constants/roles.constants');
// Inject the module's lookup during mock development; later inject a DB repository.
const approvalScope = (findApproval) => async (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (req.user.role === ROLES.ADMIN) return next();
  if (req.user.role !== ROLES.APPROVER) return next(new AppError('Forbidden', 403));
  if (['GET', 'HEAD'].includes(req.method) && req.path.replace(/\/$/, '') === '/pending') {
    const json = res.json;
    res.json = function (body) {
      if (body.success && Array.isArray(body.data)) {
        body = {...body, data: body.data.filter(item => item.approverId === req.user.id)};
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
    if (!approval || approval.approverId !== req.user.id) return next(new AppError('Approval request not found', 404));
    return next();
  } catch (error) { return next(error); }
};
module.exports = { approvalScope };
