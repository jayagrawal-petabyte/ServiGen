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
    if (!req.user || !req.user.id || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user information is required',
      });
    }

    const actorId = req.user.id;
    const role = req.user.role;

    const privilegedRoles = [
      'Admin',
      'Agent',
      'ServiceDeskAgent',
    ];

    let requesterId;

    if (role === 'ServiceUser') {
      // Self-service users can only create requests for themselves.
      requesterId = actorId;
    } else if (privilegedRoles.includes(role)) {
      // Privileged users can act on behalf of another requester.
      requesterId = req.body.userId || actorId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Role is not permitted to create an escalation handoff',
      });
    }

    const handoffData = {
      resolved: req.body.resolved,
      summary: req.body.summary,
      conversationId: req.body.conversationId,
      reason: req.body.reason,

      // Server-controlled identity fields.
      actorId,
      requesterId,
      userId: requesterId,
    };

    const result = await prepareHandoff(handoffData);

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