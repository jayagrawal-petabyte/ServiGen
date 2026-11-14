const express = require('express');

const {
    checkEscalationDecision,
    createEscalationHandoff,
    analyzeEscalationRiskDecision,
    prepareTier2RiskHandoff,
    prepareTicketRiskHandoffDecision,
    analyzeTicketEscalationRiskDecision,
} = require('./escalation.controller');

const router = express.Router();

router.post('/escalation/risk/handoff',prepareTier2RiskHandoff);
router.post('/escalation/check', checkEscalationDecision);
router.post('/escalation/risk', analyzeEscalationRiskDecision);
router.post('/escalation/tickets/:ticketId/risk/handoff',prepareTicketRiskHandoffDecision);
router.post('/escalation/tickets/:ticketId/risk',analyzeTicketEscalationRiskDecision);
router.post('/escalation/handoff', createEscalationHandoff);

module.exports = router;