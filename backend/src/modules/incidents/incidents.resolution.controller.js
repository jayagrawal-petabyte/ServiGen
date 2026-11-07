'use strict';

const {
  resolveIncident,
} = require('./incidents.resolution.service');

const resolveIncidentController = async (req, res, next) => {
  try {
    const result = await resolveIncident(
      req.params.id,
      req.body,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: 'Incident resolved successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  resolveIncidentController,
};
