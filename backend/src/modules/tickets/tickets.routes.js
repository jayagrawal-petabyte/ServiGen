'use strict';

const express = require('express');
const router = express.Router();

const ticketsController = require('./tickets.controller');

const incidentNotesController = require(
  '../incidents/incidents.notes.controller'
);

const incidentLinksController = require(
  '../incidents/incidents.links.controller'
);

const resolutionController = require(
  '../incidents/incidents.resolution.controller'
);

const timeController = require(
  '../incidents/incidents.time.controller'
);

router.get('/', ticketsController.listTickets);

// Ticket notes and conversation timeline
router.get(
  '/:id/notes',
  incidentNotesController.getTicketNotesController
);

router.post(
  '/:id/notes',
  incidentNotesController.createTicketNoteController
);

// Ticket relationships
router.post(
  '/:id/links',
  incidentLinksController.createTicketLinkController
);

router.get(
  '/:id/linked',
  incidentLinksController.getTicketLinksController
);

// Incident resolution governance
router.post(
  '/:id/resolve',
  resolutionController.resolveIncidentController
);

// Agent time tracking
router.post(
  '/:id/time-entries',
  timeController.createTicketTimeEntryController
);

// Existing ticket endpoints
router.get('/:id', ticketsController.getTicketById);

router.patch(
  '/:id/status',
  ticketsController.updateTicketStatus
);

module.exports = router;
