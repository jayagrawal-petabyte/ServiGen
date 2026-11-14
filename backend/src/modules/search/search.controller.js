'use strict';

const { globalSearch } = require('./search.service');
const { HTTP_STATUS } = require('../../shared/constants/http.constants');

const getEffectiveOrgId = (req) => {
  if (req.user && req.user.role === 'Admin' && typeof req.query.organisationId === 'string' && req.query.organisationId.trim()) {
    return req.query.organisationId.trim();
  }
  return req.user?.organisationId || req.headers['x-org-id'] || null;
};

const globalSearchHandler = async (req, res, next) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const query = req.query.q || req.query.query || req.query.search;
    const { limit } = req.query;

    const results = await globalSearch({
      query,
      organisationId,
      limit,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: results,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  globalSearchHandler,
};

