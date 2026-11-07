'use strict';

/**
 * SLA targets are expressed in seconds.
 * Critical/High/Medium/Low are mapped to P1/P2/P3/P4 respectively.
 */
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

/**
 * Creates response and resolution deadlines from the SLA start time.
 */
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

/**
 * Uses persisted deadlines when available.
 * Older tickets without SLA deadlines get calculated from createdAt.
 */
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

/**
 * Calculates live SLA values.
 *
 * During On Hold, the clock is frozen at holdStartedAt.
 * Resolved/Closed tickets use their resolution time when available.
 */
const calculateSlaStatus = (ticket, now = new Date()) => {
  const policy = getSlaPolicy(ticket?.priority);

  if (!policy || !parseValidDate(ticket?.createdAt)) {
    return {
      responseTargetAt: null,
      resolutionTargetAt: null,
      slaTargetAt: null,
      responseTimeRemainingSeconds: null,
      slaTimeRemainingSeconds: null,
      responseBreached: false,
      isBreached: false,
      slaPaused: ticket?.status === 'On Hold',
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

  return {
    responseTargetAt: deadlines.responseTargetAt,
    resolutionTargetAt: deadlines.resolutionTargetAt,

    // The blueprint's slaTargetAt represents the resolution deadline.
    slaTargetAt: deadlines.resolutionTargetAt,

    responseTimeRemainingSeconds: responseSeconds,
    slaTimeRemainingSeconds: resolutionSeconds,

    responseBreached:
      !responseMetAt &&
      clockTime.getTime() >= deadlines.responseTargetAt.getTime(),

    isBreached:
      clockTime.getTime() >= deadlines.resolutionTargetAt.getTime(),

    slaPaused: ticket.status === 'On Hold',
  };
};

/**
 * Generates Prisma fields for a ticket status transition.
 *
 * Entering On Hold records the pause time.
 * Leaving On Hold extends both deadlines by the paused duration.
 */
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

/**
 * Existing SLA formatting helper.
 */
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
  prepareSlaStatusUpdate,
  formatIncidentSla,
  addIncidentSlaDetails,
};
