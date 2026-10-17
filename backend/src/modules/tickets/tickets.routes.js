'use strict';

const express = require('express');
const router = express.Router();
const ticketsController = require('./tickets.controller');

router.get('/', ticketsController.listTickets);
router.get('/:id', ticketsController.getTicketById);
router.patch('/:id/status', ticketsController.updateTicketStatus);

module.exports = router;
