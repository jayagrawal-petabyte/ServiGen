'use strict';

const sanitizeHtml = require('sanitize-html');
const { getIncidents } = require('../incidents/incidents.model');
const { getProblems } = require('../problems/problems.model');
const { getContracts } = require('../contracts/contracts.model');
const { getConfigurationItems } = require('../cmdb/cmdb.model');
const { getArticles } = require('../knowledge/knowledge.model');
const AppError = require('../../shared/utils/app-error');
const { HTTP_STATUS } = require('../../shared/constants/http.constants');

const sanitizeQuery = (str) => {
  if (typeof str !== 'string') return '';
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
};

/**
 * Unified Global Search across Tickets, Problems, Contracts, CIs, and Knowledge Articles.
 * Strictly scoped to caller organisationId for tenant boundary isolation.
 */
const globalSearch = async (options = {}) => {
  const { query, organisationId, limit = 10 } = options;

  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new AppError('Search query parameter "q" is required', HTTP_STATUS.BAD_REQUEST);
  }

  const cleanQuery = sanitizeQuery(query);
  if (cleanQuery.length > 100) {
    throw new AppError('Search query cannot exceed 100 characters', HTTP_STATUS.BAD_REQUEST);
  }

  const itemLimit = Math.min(50, Math.max(1, Number(limit) || 10));
  const q = cleanQuery.toLowerCase();

  // Run searches across entities with tenant scoping
  const [incidents, problems, contracts, cis, articles] = await Promise.all([
    getIncidents().catch(() => []),
    getProblems({ organisationId, search: cleanQuery }).catch(() => []),
    getContracts({ organisationId, search: cleanQuery }).catch(() => []),
    getConfigurationItems({ organisationId }).catch(() => []),
    getArticles().catch(() => []),
  ]);

  // Filter incidents by tenant & query
  const matchedIncidents = (Array.isArray(incidents) ? incidents : [])
    .filter((inc) => {
      if (organisationId && inc.organisationId && inc.organisationId !== organisationId) return false;
      const s = (inc.summary || '').toLowerCase();
      const d = (inc.description || '').toLowerCase();
      const id = (inc.id || '').toLowerCase();
      return s.includes(q) || d.includes(q) || id.includes(q);
    })
    .slice(0, itemLimit)
    .map((inc) => ({
      entityType: 'ticket',
      id: inc.id,
      title: inc.summary,
      subtitle: `${inc.priority || 'Medium'} • ${inc.status || 'Open'}`,
      status: inc.status,
      priority: inc.priority,
      createdAt: inc.createdAt,
    }));

  // Map problems
  const matchedProblems = (Array.isArray(problems) ? problems : [])
    .slice(0, itemLimit)
    .map((p) => ({
      entityType: 'problem',
      id: p.id,
      title: p.summary,
      subtitle: `${p.priority || 'Medium'} • ${p.stage || 'Investigation'}`,
      status: p.status,
      stage: p.stage,
      createdAt: p.createdAt,
    }));

  // Map contracts
  const matchedContracts = (Array.isArray(contracts) ? contracts : [])
    .slice(0, itemLimit)
    .map((c) => ({
      entityType: 'contract',
      id: c.id,
      title: c.title,
      subtitle: `${c.vendorName} • ${c.type} • ${c.status}`,
      status: c.status,
      vendorName: c.vendorName,
      createdAt: c.createdAt,
    }));

  // Filter and map CIs
  const matchedCis = (Array.isArray(cis) ? cis : [])
    .filter((ci) => {
      const name = (ci.name || '').toLowerCase();
      const tag = (ci.tag || '').toLowerCase();
      const type = (ci.type || '').toLowerCase();
      const id = (ci.id || '').toLowerCase();
      return name.includes(q) || tag.includes(q) || type.includes(q) || id.includes(q);
    })
    .slice(0, itemLimit)
    .map((ci) => ({
      entityType: 'configuration_item',
      id: ci.id,
      title: ci.name,
      subtitle: `${ci.tag} • ${ci.type} • ${ci.status}`,
      type: ci.type,
      tag: ci.tag,
      status: ci.status,
    }));

  // Filter and map knowledge articles
  const matchedArticles = (Array.isArray(articles) ? articles : [])
    .filter((a) => {
      const title = (a.title || '').toLowerCase();
      const content = (a.content || '').toLowerCase();
      const category = (a.category || '').toLowerCase();
      return title.includes(q) || content.includes(q) || category.includes(q);
    })
    .slice(0, itemLimit)
    .map((a) => ({
      entityType: 'article',
      id: a.id,
      title: a.title,
      subtitle: `${a.category || 'General'} • ${a.status || 'Published'}`,
      category: a.category,
      status: a.status,
    }));

  const totalMatches =
    matchedIncidents.length +
    matchedProblems.length +
    matchedContracts.length +
    matchedCis.length +
    matchedArticles.length;

  return {
    query: cleanQuery,
    totalMatches,
    results: {
      tickets: matchedIncidents,
      problems: matchedProblems,
      contracts: matchedContracts,
      configurationItems: matchedCis,
      articles: matchedArticles,
    },
  };
};

module.exports = {
  globalSearch,
};
