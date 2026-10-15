'use strict';

const TICKET_TYPES = Object.freeze({
  INCIDENT: 'Incident',
  SERVICE_REQUEST: 'Service Request',
  MAJOR_INCIDENT: 'Major Incident',
});

const TICKET_STATUSES = Object.freeze({
  ACTIVE: 'Active',
  PENDING: 'Pending',
  ACTIONED: 'Actioned',
  ON_HOLD: 'On Hold',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
});

const TICKET_PRIORITIES = Object.freeze({
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  P1: 'P1',
  P2: 'P2',
});

const PRIORITY_ORDER = Object.freeze({
  P1: 0,
  Critical: 1,
  P2: 2,
  High: 3,
  Medium: 4,
  Low: 5,
});

const MAJOR_INCIDENT_STATUSES = Object.freeze({
  INVESTIGATING: 'Investigating',
  IDENTIFIED: 'Identified',
  MONITORING: 'Monitoring',
  RESOLVED: 'Resolved',
});

const APPROVAL_STATUSES = Object.freeze({
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
});

const CHANGE_REQUEST_STATUSES = Object.freeze({
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  ACTIVE: 'Active',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
});

const CHANGE_TYPES = Object.freeze({
  STANDARD: 'Standard',
  NORMAL: 'Normal',
  EMERGENCY: 'Emergency',
});

module.exports = {
  TICKET_TYPES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  PRIORITY_ORDER,
  MAJOR_INCIDENT_STATUSES,
  APPROVAL_STATUSES,
  CHANGE_REQUEST_STATUSES,
  CHANGE_TYPES,
};
