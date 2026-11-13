'use strict';

const express = require('express');
const router = express.Router();
const ticketsController = require('./tickets.controller');

router.get('/', ticketsController.listTickets);
router.get('/:id', ticketsController.getTicketById);
router.get('/:id/related', ticketsController.getRelatedTickets);
router.patch('/:id/status', ticketsController.updateTicketStatus);
router.patch('/:id/assign', ticketsController.assignTicket);
router.post('/:id/email', ticketsController.sendEmail);
router.post('/:id/supplier', ticketsController.logToSupplier);

module.exports = router;
