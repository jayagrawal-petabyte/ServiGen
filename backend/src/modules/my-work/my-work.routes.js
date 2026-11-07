const express = require('express');

const {
  listMyWorkTickets,
  listActiveTickets,
  listPendingTickets,
  listActionedTickets,
  listOnHoldTickets,
  getTicketDetails,
  updateTicketStatusHandler,
  logTimeHandler,
  getTimeSummaryHandler,
} = require('./my-work.controller');

const router = express.Router();

// Support both direct mount (app.use('/api/my-work', router))
// and root prefix mount (app.use('/api', router))
router.get(['/', '/my-work'], listMyWorkTickets);
router.get(['/active', '/my-work/active'], listActiveTickets);
router.get(['/pending', '/my-work/pending'], listPendingTickets);
router.get(['/actioned', '/my-work/actioned'], listActionedTickets);
router.get(['/on-hold', '/my-work/on-hold'], listOnHoldTickets);
// Time aggregation — must be registered before /:ticketId to avoid route shadowing
router.get(['/time-summary', '/my-work/time-summary'], getTimeSummaryHandler);
router.get(['/:ticketId', '/my-work/:ticketId'], getTicketDetails);
router.patch(['/:ticketId/status', '/my-work/:ticketId/status'], updateTicketStatusHandler);
router.post(['/:ticketId/time', '/my-work/:ticketId/time'], logTimeHandler);

module.exports = router;
