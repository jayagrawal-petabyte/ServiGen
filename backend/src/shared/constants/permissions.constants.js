'use strict';
const { ROLES } = require('./roles.constants');
const STAFF = Object.freeze([ROLES.SERVICE_AGENT, ROLES.SUPPORT_TEAM_USER]);
// Based on SCR-002..027. Unspecified mutation rights remain Admin-only.
const PERMISSIONS = Object.freeze({
  DASHBOARD_SUMMARY: Object.freeze([ROLES.SERVICE_USER, ...STAFF, ROLES.APPROVER]),
  DASHBOARD: Object.freeze([ROLES.SERVICE_USER, ...STAFF]),
  STAFF,
  CATALOGUE: Object.freeze([ROLES.SERVICE_USER, ROLES.SERVICE_AGENT]),
  APPROVALS: Object.freeze([ROLES.APPROVER]),
  ADMIN_ONLY: Object.freeze([]),
  USERS: Object.freeze([]), // Admin-only: protects user directory and PII from unauthorized roles
  AI: Object.freeze([ROLES.SERVICE_USER, ...STAFF]),
});
module.exports = { PERMISSIONS };
