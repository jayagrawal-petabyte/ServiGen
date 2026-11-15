'use strict';

const { getIncidents } = require('../incidents/incidents.model');
const { createSlaDeadlines, getSlaPolicy } = require('../incidents/incidents.sla.service');
const AppError = require('../../shared/utils/app-error');
const { HTTP_STATUS } = require('../../shared/constants/http.constants');

const VALID_PRIORITIES = ['Critical', 'High', 'Medium', 'Low', 'P1', 'P2', 'P3', 'P4'];

/**
 * Retrieves SLA breach deadlines as calendar events for scheduling & calendar views.
 * Strictly scoped to caller organisationId for tenant boundary isolation.
 */
const getSlaEvents = async (options = {}) => {
  const { organisationId, priority, status, start, end, limit = 50 } = options;

  let incidents = await getIncidents();

  // Multi-tenant boundary
  if (organisationId) {
    incidents = incidents.filter(
      (inc) => inc.organisationId === organisationId
    );
  }

  // Priority filter
  if (priority && typeof priority === 'string') {
    const pTarget = priority.trim().toLowerCase();
    incidents = incidents.filter(
      (inc) => (inc.priority && inc.priority.toLowerCase() === pTarget)
    );
  }

  // Status filter (default to active incidents if status not explicitly given)
  if (status && typeof status === 'string') {
    const sTarget = status.trim().toLowerCase();
    incidents = incidents.filter(
      (inc) => (inc.status && inc.status.toLowerCase() === sTarget)
    );
  }

  const now = new Date();
  const events = [];

  for (const inc of incidents) {
    let deadline = null;
    if (inc.resolutionDueAt) {
      const parsed = new Date(inc.resolutionDueAt);
      if (!Number.isNaN(parsed.getTime())) deadline = parsed;
    } else if (inc.breachTime) {
      const parsed = new Date(inc.breachTime);
      if (!Number.isNaN(parsed.getTime())) deadline = parsed;
    }

    if (!deadline) {
      const startAt = inc.createdAt ? new Date(inc.createdAt) : now;
      const deadlines = createSlaDeadlines(inc.priority || 'Medium', startAt);
      deadline = deadlines.resolutionDeadline || new Date(startAt.getTime() + 24 * 60 * 60 * 1000);
    }

    const startAt = inc.createdAt ? new Date(inc.createdAt) : now;

    // Date range bounds if start/end query parameters provided
    if (start) {
      const startDate = new Date(start);
      if (!Number.isNaN(startDate.getTime()) && deadline < startDate) continue;
    }
    if (end) {
      const endDate = new Date(end);
      if (!Number.isNaN(endDate.getTime()) && deadline > endDate) continue;
    }

    events.push({
      id: `sla-${inc.id}`,
      title: `[SLA Deadline] ${inc.id}: ${inc.summary || 'Incident'}`,
      startsAt: startAt.toISOString(),
      endsAt: deadline.toISOString(),
      appointmentType: 'SLA Deadline',
      priority: inc.priority || 'Medium',
      ticketId: inc.id,
      summary: inc.summary || '',
      status: inc.status || 'Open',
      breached: now > deadline,
      timeRemainingMs: Math.max(0, deadline.getTime() - now.getTime()),
      organisationId: inc.organisationId || organisationId || null,
    });
  }

  // Sort earliest deadline first
  events.sort((a, b) => new Date(a.endsAt) - new Date(b.endsAt));

  const parsedLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  return events.slice(0, parsedLimit);
};

module.exports = {
  getSlaEvents,
};

