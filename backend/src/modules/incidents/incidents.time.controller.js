'use strict';

const {
  createTicketTimeEntry,
} = require('./incidents.time.service');

/**
 * POST /api/tickets/:id/time-entries
 */
const createTicketTimeEntryController = async (req, res, next) => {
  try {
    const result = await createTicketTimeEntry(
      req.params.id,
      req.body,
      req.user
    );

    return res.status(201).json({
      success: true,
      message: 'Time entry recorded successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTicketTimeEntryController,
};
