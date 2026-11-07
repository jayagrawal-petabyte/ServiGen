'use strict';

const {
  getTicketNotes,
  createTicketNote,
} = require('./incidents.notes.service');

/**
 * GET /api/tickets/:id/notes
 */
const getTicketNotesController = async (req, res, next) => {
  try {
    const result = await getTicketNotes(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/tickets/:id/notes
 */
const createTicketNoteController = async (req, res, next) => {
  try {
    const result = await createTicketNote(
      req.params.id,
      req.body,
      req.user
    );

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getTicketNotesController,
  createTicketNoteController,
};
