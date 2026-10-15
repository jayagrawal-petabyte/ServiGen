'use strict';

const db = require('../../config/db');

/**
 * Shared Database Model Accessors.
 * Provides clean Prisma bindings for all backend domain modules.
 */
module.exports = {
  prisma: db,
  organisations: db.organisation,
  sites: db.site,
  users: db.user,
  tickets: db.ticket,
  incidents: db.incident,
  majorIncidents: db.majorIncident,
  majorIncidentUpdates: db.majorIncidentUpdate,
  serviceCatalogueItems: db.serviceCatalogueItem,
  serviceRequests: db.serviceRequest,
  approvals: db.approval,
  configurationItems: db.configurationItem,
  changeRequests: db.changeRequest,
  projects: db.project,
  projectSubtasks: db.projectSubtask,
  customLists: db.customList,
  agentMoods: db.agentMood,
  teams: db.team,
  teamMemberships: db.teamMembership,
  knowledgeArticles: db.knowledgeArticle,
  calendarEvents: db.calendarEvent,
};
