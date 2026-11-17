'use strict';

const SLA_POLICIES = Object.freeze({
  P1: Object.freeze({
    responseSeconds: 60 * 60,
    resolutionSeconds: 4 * 60 * 60,
  }),
  P2: Object.freeze({
    responseSeconds: 2 * 60 * 60,
    resolutionSeconds: 8 * 60 * 60,
  }),
  P3: Object.freeze({
    responseSeconds: 4 * 60 * 60,
    resolutionSeconds: 24 * 60 * 60,
  }),
  P4: Object.freeze({
    responseSeconds: 8 * 60 * 60,
    resolutionSeconds: 48 * 60 * 60,
  }),
});

const PRIORITY_ALIASES = Object.freeze({
  CRITICAL: 'P1',
  HIGH: 'P2',
  MEDIUM: 'P3',
  LOW: 'P4',
});

const getSlaPolicy = (priority) => {
  if (typeof priority !== 'string') {
    return null;
  }

  const normalized = priority.trim().toUpperCase();
  const level = PRIORITY_ALIASES[normalized] || normalized;
  const policy = SLA_POLICIES[level];

  return policy ? { level, ...policy } : null;
};

const parseValidDate = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const createSlaDeadlines = (priority, startedAt = new Date()) => {
  const policy = getSlaPolicy(priority);
  const start = parseValidDate(startedAt);

  if (!policy) {
    throw new Error(`Unsupported SLA priority: ${priority}`);
  }

  if (!start) {
    throw new Error('A valid SLA start date is required');
  }

  return {
    responseTargetAt: new Date(
      start.getTime() + policy.responseSeconds * 1000
    ),
    resolutionTargetAt: new Date(
      start.getTime() + policy.resolutionSeconds * 1000
    ),
  };
};

const getTicketDeadlines = (ticket) => {
  const calculated = createSlaDeadlines(
    ticket.priority,
    ticket.createdAt
  );

  return {
    responseTargetAt:
      parseValidDate(ticket.responseTargetAt) ||
      calculated.responseTargetAt,

    resolutionTargetAt:
      parseValidDate(ticket.resolutionTargetAt) ||
      calculated.resolutionTargetAt,
  };
};

const calculateAiRisk = (ticket, slaStatus) => {
  const priority = typeof ticket?.priority === 'string' ? ticket.priority.trim().toLowerCase() : '';
  const resolutionSeconds = slaStatus?.slaTimeRemainingSeconds ?? null;
  const minutesLeft =
    resolutionSeconds !== null && Number.isFinite(resolutionSeconds)
      ? Math.round(resolutionSeconds / 60)
      : (typeof ticket?.slaTimeLeft === 'number' ? ticket.slaTimeLeft : 180);

  const isBreached = Boolean(slaStatus?.isBreached || (resolutionSeconds !== null ? resolutionSeconds <= 0 : minutesLeft <= 0));
  const isResolvedOrClosed = ['Resolved', 'Closed'].includes(ticket?.status);

  if (isResolvedOrClosed) {
    return {
      aiRisk: 'Normal',
      aiRiskScore: 10,
      aiRiskReason: 'Ticket is resolved or closed.',
      recommendTier2: false,
    };
  }

  const isEscalated =
    ticket?.assignedTeam === '2nd Line Support' ||
    ticket?.team === '2nd Line Support' ||
    ticket?.escalatedToTier2 === true;

  if (isEscalated) {
    return {
      aiRisk: 'Normal',
      aiRiskScore: 25,
      aiRiskReason: 'Active 2nd Line Support Tier 2 engagement.',
      recommendTier2: false,
    };
  }

  const isCritical = priority === 'critical' || priority === 'p1';
  const isHigh = priority === 'high' || priority === 'p2';

  const ticketKey = String(ticket?.id || ticket?.ticketId || 'TCK');
  const summaryKey = String(ticket?.summary || '');
  const idSeed = ticketKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  if (isCritical || isBreached || minutesLeft <= 45) {
    const hash = (idSeed * 7 + summaryKey.length * 3) % 10;
    const score = 85 + hash; // 85% - 94%
    return {
      aiRisk: 'High Risk',
      aiRiskScore: score,
      aiRiskReason: isBreached
        ? 'Resolution SLA breached — critical escalation threshold exceeded.'
        : minutesLeft <= 45
        ? `Imminent SLA breach risk: ${minutesLeft}m remaining.`
        : 'Critical priority incident with high business blast radius.',
      recommendTier2: true,
    };
  }

  if (isHigh || minutesLeft <= 90) {
    const hash = (idSeed * 5 + summaryKey.length * 2) % 15;
    const score = 62 + hash; // 62% - 76%
    return {
      aiRisk: 'At Risk',
      aiRiskScore: score,
      aiRiskReason: minutesLeft <= 90
        ? `Elevated risk: SLA window expires in ${minutesLeft}m.`
        : 'High priority incident requiring expedited investigation.',
      recommendTier2: true,
    };
  }

  const hash = (idSeed * 3 + summaryKey.length) % 15;
  const score = 15 + hash; // 15% - 29%
  return {
    aiRisk: 'Normal',
    aiRiskScore: score,
    aiRiskReason: 'Operating within acceptable SLA parameters.',
    recommendTier2: false,
  };
};

const calculateSlaStatus = (ticket, now = new Date()) => {
  const policy = getSlaPolicy(ticket?.priority);

  if (!policy || !parseValidDate(ticket?.createdAt)) {
    const aiRiskFallback = calculateAiRisk(ticket, null);
    return {
      responseTargetAt: null,
      resolutionTargetAt: null,
      slaTargetAt: null,
      responseTimeRemainingSeconds: null,
      slaTimeRemainingSeconds: null,
      slaTimeLeft: typeof ticket?.slaTimeLeft === 'number' ? ticket.slaTimeLeft : null,
      responseBreached: false,
      isBreached: false,
      slaPaused: ticket?.status === 'On Hold',
      aiRisk: aiRiskFallback.aiRisk,
      aiRiskScore: aiRiskFallback.aiRiskScore,
      aiRiskReason: aiRiskFallback.aiRiskReason,
      recommendTier2: aiRiskFallback.recommendTier2,
      escalatedToTier2:
        ticket?.assignedTeam === '2nd Line Support' ||
        ticket?.team === '2nd Line Support' ||
        ticket?.escalatedToTier2 === true,
    };
  }

  const deadlines = getTicketDeadlines(ticket);

  let clockTime = parseValidDate(now) || new Date();

  if (ticket.status === 'On Hold') {
    clockTime = parseValidDate(ticket.holdStartedAt) || clockTime;
  } else if (['Resolved', 'Closed'].includes(ticket.status)) {
    clockTime =
      parseValidDate(ticket.resolvedAt) ||
      parseValidDate(ticket.closedAt) ||
      parseValidDate(ticket.updatedAt) ||
      clockTime;
  }

  const responseMetAt = parseValidDate(ticket.responseMetAt);

  const responseSeconds = responseMetAt
    ? 0
    : Math.max(
        0,
        Math.ceil(
          (deadlines.responseTargetAt.getTime() - clockTime.getTime()) / 1000
        )
      );

  const resolutionSeconds = Math.max(
    0,
    Math.ceil(
      (deadlines.resolutionTargetAt.getTime() - clockTime.getTime()) / 1000
    )
  );

  const isResolutionBreached = clockTime.getTime() >= deadlines.resolutionTargetAt.getTime();
  const aiRiskData = calculateAiRisk(ticket, {
    slaTimeRemainingSeconds: resolutionSeconds,
    isBreached: isResolutionBreached,
  });

  const isOnHold = ticket.status === 'On Hold';
  const isResolvedOrClosed = ['Resolved', 'Closed'].includes(ticket.status);
  const responseMet = Boolean(responseMetAt || ticket.responseTargetMet === true);
  const resolutionMet = Boolean(ticket.resolvedAt || (isResolvedOrClosed && !isResolutionBreached) || ticket.resolutionTargetMet === true);

  const rawMinutes = typeof ticket.slaTimeLeft === 'number' && Number.isFinite(ticket.slaTimeLeft)
    ? ticket.slaTimeLeft
    : Math.round(resolutionSeconds / 60);

  const slaFormatted = ticket.slaFormatted || formatIncidentSla(rawMinutes);

  return {
    responseTargetAt: deadlines.responseTargetAt,
    resolutionTargetAt: deadlines.resolutionTargetAt,
    slaTargetAt: deadlines.resolutionTargetAt,

    responseTimeRemainingSeconds: responseSeconds,
    slaTimeRemainingSeconds: resolutionSeconds,
    slaTimeLeft: rawMinutes,

    responseBreached:
      !responseMet &&
      (clockTime.getTime() >= deadlines.responseTargetAt.getTime() || ticket.responseTargetMet === false),

    isBreached: (isResolutionBreached || ticket.resolutionTargetMet === false) && !resolutionMet,
    slaBreach: (isResolutionBreached || ticket.resolutionTargetMet === false || rawMinutes <= 0) && !resolutionMet,

    slaPaused: isOnHold,
    responseTargetMet: responseMet,
    resolutionTargetMet: resolutionMet,
    slaFormatted,

    aiRisk: aiRiskData.aiRisk,
    aiRiskScore: aiRiskData.aiRiskScore,
    aiRiskReason: aiRiskData.aiRiskReason,
    recommendTier2: aiRiskData.recommendTier2,
    escalatedToTier2:
      ticket.assignedTeam === '2nd Line Support' ||
      ticket.team === '2nd Line Support' ||
      ticket.escalatedToTier2 === true,
  };
};

const prepareSlaStatusUpdate = (
  ticket,
  nextStatus,
  now = new Date()
) => {
  if (!ticket || typeof ticket !== 'object') {
    throw new Error('A valid ticket is required');
  }

  const policy = getSlaPolicy(ticket.priority);

  if (!policy) {
    return {};
  }

  const transitionTime = parseValidDate(now);

  if (!transitionTime) {
    throw new Error('A valid transition date is required');
  }

  const deadlines = getTicketDeadlines(ticket);

  const update = {
    responseTargetAt: deadlines.responseTargetAt,
    resolutionTargetAt: deadlines.resolutionTargetAt,
  };

  const wasOnHold = ticket.status === 'On Hold';
  const willBeOnHold = nextStatus === 'On Hold';

  if (!wasOnHold && willBeOnHold) {
    update.holdStartedAt = transitionTime;
    return update;
  }

  if (wasOnHold && !willBeOnHold) {
    const holdStartedAt = parseValidDate(ticket.holdStartedAt);

    if (holdStartedAt) {
      const pausedMilliseconds = Math.max(
        0,
        transitionTime.getTime() - holdStartedAt.getTime()
      );

      update.responseTargetAt = new Date(
        deadlines.responseTargetAt.getTime() + pausedMilliseconds
      );

      update.resolutionTargetAt = new Date(
        deadlines.resolutionTargetAt.getTime() + pausedMilliseconds
      );
    }

    update.holdStartedAt = null;
  }

  return update;
};

const formatIncidentSla = (minutes) => {
  if (minutes === null || minutes === undefined) {
    return 'N/A';
  }

  if (typeof minutes !== 'number' || !Number.isFinite(minutes)) {
    return 'N/A';
  }

  if (minutes <= 0) {
    return 'SLA Breached';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${remainingMinutes}m`;
};

const addIncidentSlaDetails = (incident) => ({
  ...incident,
  slaFormatted: formatIncidentSla(incident.slaTimeLeft),
  slaBreach:
    typeof incident.slaTimeLeft === 'number' &&
    Number.isFinite(incident.slaTimeLeft) &&
    incident.slaTimeLeft <= 0,
});

module.exports = {
  SLA_POLICIES,
  PRIORITY_ALIASES,
  getSlaPolicy,
  createSlaDeadlines,
  calculateSlaStatus,
  calculateAiRisk,
  prepareSlaStatusUpdate,
  formatIncidentSla,
  addIncidentSlaDetails,
};
