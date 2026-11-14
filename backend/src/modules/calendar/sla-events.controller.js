'use strict';

const { getSlaEvents } = require('./sla-events.service');
const { HTTP_STATUS } = require('../../shared/constants/http.constants');

const getEffectiveOrgId = (req) => {
  if (req.user && req.user.role === 'Admin' && typeof req.query.organisationId === 'string' && req.query.organisationId.trim()) {
    return req.query.organisationId.trim();
  }
  return req.user?.organisationId || req.headers['x-org-id'] || null;
};

const getSlaEventsHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const { priority, status, start, end, limit } = req.query;

    const events = await getSlaEvents({
      organisationId,
      priority,
      status,
      start,
      end,
      limit,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSlaEventsHandler,
};
