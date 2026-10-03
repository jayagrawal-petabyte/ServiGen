'use strict';

/**
 * Standard User Roles for Halo AI / ServiGen RBAC.
 * Derived from the Business Workflow & Functional Specification.
 */
const ROLES = Object.freeze({
  SERVICE_USER: 'Service User',
  SERVICE_AGENT: 'Service Agent',
  APPROVER: 'Approver',
  SUPPORT_TEAM_USER: 'Support Team User',
  ADMIN: 'Admin',
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

module.exports = {
  ROLES,
  ALL_ROLES,
};
