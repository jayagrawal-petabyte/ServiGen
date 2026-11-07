const {
  checkEscalation,
  prepareHandoff,
  checkEscalationRisk,
  checkTicketEscalationRisk,
  prepareTicketRiskHandoff,
  prepareRiskHandoff,
} = require('./escalation.service');

const { ROLES } = require('../../../shared/constants/roles.constants');

const checkEscalationDecision = async (req, res) => {
  try {
    const result = await checkEscalation(req.body);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[escalation:check:error]', error?.message || error);
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const analyzeEscalationRiskDecision = async (req, res) => {
  try {
    const result = await checkEscalationRisk(req.body);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[escalation:risk:error]', error?.message || error);
    }
    if (error.code === 'SENTIMENT_MODEL_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const analyzeTicketEscalationRiskDecision = async (req, res) => {
  try {
    if (!req.user || !req.user.id || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { ticketId } = req.params;

    if (
      typeof ticketId !== 'string' ||
      !ticketId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid ticket ID is required',
      });
    }

    let organisationId;

    if (req.user.role === ROLES.ADMIN) {
      const requestedOrganisation = req.query.organisationId;

      if (
        requestedOrganisation !== undefined &&
        (typeof requestedOrganisation !== 'string' ||
          !requestedOrganisation.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid organisation ID',
        });
      }

      organisationId = requestedOrganisation?.trim() || null;
    } else {
      organisationId = req.user.organisationId;

      if (
        typeof organisationId !== 'string' ||
        !organisationId.trim()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Organisation access is required',
        });
      }
    }

    const result = await checkTicketEscalationRisk(
      ticketId.trim(),
      organisationId
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.code === 'TICKET_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    if (error.code === 'TICKET_SLA_UNAVAILABLE') {
      return res.status(422).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 'SENTIMENT_MODEL_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to analyse ticket escalation risk',
    });
  }
};

const prepareTicketRiskHandoffDecision = async (req, res) => {
  try {
    if (!req.user || !req.user.id || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const permittedRoles = [
      ROLES.SERVICE_USER,
      ROLES.SERVICE_AGENT,
      ROLES.SUPPORT_TEAM_USER,
      ROLES.ADMIN,
      'ServiceUser',
      'ServiceAgent',
      'Agent',
      'ServiceDeskAgent',
    ];

    if (!permittedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Role is not permitted to prepare a ticket risk handoff',
      });
    }

    const { ticketId } = req.params;

    if (typeof ticketId !== 'string' || !ticketId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Valid ticket ID is required',
      });
    }

    let organisationId;

    if (req.user.role === ROLES.ADMIN) {
      const requestedOrganisation = req.query.organisationId;

      if (
        requestedOrganisation !== undefined &&
        (typeof requestedOrganisation !== 'string' ||
          !requestedOrganisation.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid organisation ID',
        });
      }

      organisationId = requestedOrganisation?.trim() || null;
    } else {
      organisationId = req.user.organisationId;

      if (
        typeof organisationId !== 'string' ||
        !organisationId.trim()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Organisation access is required',
        });
      }
    }

    const result = await prepareTicketRiskHandoff(
      ticketId.trim(),
      organisationId,
      req.user.id,
      req.body?.conversationId ?? null
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.code === 'TICKET_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    if (
      error.code === 'TICKET_SLA_UNAVAILABLE' ||
      error.code === 'TICKET_REQUESTER_UNAVAILABLE'
    ) {
      return res.status(422).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 'SENTIMENT_MODEL_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to prepare ticket risk handoff',
    });
  }
};

const prepareTier2RiskHandoff = async (req, res) => {
  try {
    if (!req.user || !req.user.id || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user information is required',
      });
    }

    const actorId = req.user.id;
    const role = req.user.role;

    const permittedRoles = [
      ROLES.SERVICE_USER,
      ROLES.SERVICE_AGENT,
      ROLES.SUPPORT_TEAM_USER,
      ROLES.ADMIN,
      'ServiceUser',
      'ServiceAgent',
      'Agent',
      'ServiceDeskAgent',
    ];

    if (!permittedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Role is not permitted to prepare a risk handoff',
      });
    }

    const canDelegate = [
      ROLES.ADMIN,
      'Admin',
      'Agent',
      'ServiceDeskAgent',
    ].includes(role);

    if (
      canDelegate &&
      req.body?.userId !== undefined &&
      (typeof req.body.userId !== 'string' || !req.body.userId.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requester ID',
      });
    }

    const requesterId =
      canDelegate && req.body?.userId
        ? req.body.userId.trim()
        : actorId;

    const result = await prepareRiskHandoff({
      ...req.body,
      actorId,
      requesterId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[escalation:risk-handoff:error]', error?.message || error);
    }

    if (error.code === 'SENTIMENT_MODEL_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(400).json({
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

    const permittedRoles = [
      ROLES.SERVICE_USER,
      ROLES.SERVICE_AGENT,
      ROLES.SUPPORT_TEAM_USER,
      ROLES.ADMIN,
      'ServiceUser',
      'ServiceAgent',
      'Agent',
      'ServiceDeskAgent',
    ];

    if (!permittedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Role is not permitted to create an escalation handoff',
      });
    }
    const canDelegate = [
    ROLES.ADMIN,
    'Admin',
    'Agent',
    'ServiceDeskAgent',
  ].includes(role);

  if (
    canDelegate &&
    req.body?.userId !== undefined &&
    (typeof req.body.userId !== 'string' || !req.body.userId.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid requester ID',
    });
  }

  const requesterId =
    canDelegate && req.body?.userId
      ? req.body.userId.trim()
      : actorId;

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
    if (process.env.NODE_ENV === 'development') {
      console.error('[escalation:handoff:error]', error?.message || error);
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  checkEscalationDecision,
  createEscalationHandoff,
  prepareTier2RiskHandoff,
  analyzeEscalationRiskDecision,
  prepareTicketRiskHandoffDecision,
  analyzeTicketEscalationRiskDecision,
};