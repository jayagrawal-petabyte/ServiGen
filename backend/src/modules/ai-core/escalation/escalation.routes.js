const express = require('express');

const {
    checkEscalationDecision,
    createEscalationHandoff,
} = require('./escalation.controller');

const router = express.Router();

router.post('/escalation/check', checkEscalationDecision);

router.post('/escalation/handoff', createEscalationHandoff);

module.exports = router;