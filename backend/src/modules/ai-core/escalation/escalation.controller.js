const {
    checkEscalation,
    prepareHandoff,
} = require('./escalation.service');

const checkEscalationDecision = async (req, res) => {
    try {
        const result = await checkEscalation(req.body);

        res.status(200).json({
        success: true,
        data: result,
        });
    } catch (error) {
        console.error('Escalation check error:', error);

        res.status(400).json({
        success: false,
        message: error.message,
        });
    }
};

const createEscalationHandoff = async (req, res) => {
    try {
        const callerId = req.user?.id;
        const isCallerAdmin = req.user?.role === 'Admin';
        const targetUserId = (isCallerAdmin && req.body?.userId) ? req.body.userId : (callerId || req.body?.userId);
        const result = await prepareHandoff({ ...req.body, userId: targetUserId });

        res.status(200).json({
        success: true,
        data: result,
        });
    } catch (error) {
        console.error('Escalation handoff error:', error);

        res.status(400).json({
        success: false,
        message: error.message,
        });
    }
};

module.exports = {
    checkEscalationDecision,
    createEscalationHandoff,
};