'use strict';

const { ROLES, ALL_ROLES } = require('./roles.constants');
const {
  TICKET_TYPES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  PRIORITY_ORDER,
  MAJOR_INCIDENT_STATUSES,
  APPROVAL_STATUSES,
  CHANGE_REQUEST_STATUSES,
  CHANGE_TYPES,
} = require('./ticket.constants');
const { PERMISSIONS } = require('./permissions.constants');
const { HTTP_STATUS } = require('./http.constants');

module.exports = {
  ROLES,
  ALL_ROLES,
  TICKET_TYPES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  PRIORITY_ORDER,
  MAJOR_INCIDENT_STATUSES,
  APPROVAL_STATUSES,
  CHANGE_REQUEST_STATUSES,
  CHANGE_TYPES,
  HTTP_STATUS,
  PERMISSIONS,
};
