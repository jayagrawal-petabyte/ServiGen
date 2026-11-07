'use strict';

const {
  createTicketLink,
  getTicketLinks,
} = require('./incidents.links.service');

/**
 * POST /api/tickets/:id/links
 */
const createTicketLinkController = async (req, res, next) => {
  try {
    const result = await createTicketLink(
      req.params.id,
      req.body,
      req.user
    );

    return res.status(201).json({
      success: true,
      message: 'Ticket relationship created successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/tickets/:id/linked
 */
const getTicketLinksController = async (req, res, next) => {
  try {
    const result = await getTicketLinks(
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

module.exports = {
  createTicketLinkController,
  getTicketLinksController,
};
