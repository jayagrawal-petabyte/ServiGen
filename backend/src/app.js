'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const env = require('./config/env');
const { createRateLimiter } = require('./shared/middleware/rate-limit.middleware');
const { requestLogger, errorHandler, requireAuth, restrictTo, PERMISSIONS, approvalScope } = require('./shared');

// ─── Module Routers ─────────────────────────────────────────────────────────
const myWorkRouter = require('./modules/my-work/my-work.routes');
const dashboardRouter = require('./modules/dashboard/dashboard.routes');
const approvalsRouter = require('./modules/approvals/approvals.routes');
const servicesCatalogueRouter = require('./modules/services-catalogue/services-catalogue.routes');
const majorIncidentsRouter = require('./modules/major-incidents/major-incidents.routes');
const changeRequestsRouter = require('./modules/change-requests/change-requests.routes');
const aiResponseRouter = require('./modules/ai-core/response/response.routes');

const projectsRouter = require('./modules/projects/projects.routes');
const cmdbRouter = require('./modules/cmdb/cmdb.routes');
const listsRouter = require('./modules/list-builder/list-builder.routes');
const incidentsRouter = require('./modules/incidents/incidents.routes');
const organisationsRouter = require('./modules/organisations/organisations.routes');
const authRouter = require('./modules/auth/auth.routes');
const intentRouter = require('./modules/ai-core/intent/intent.routes');
const retrievalRouter = require('./modules/ai-core/retrieval/retrieval.routes');
const escalationRouter = require('./modules/ai-core/escalation/escalation.routes');

const app = express();
app.disable('x-powered-by');

// ─── Core Middleware ────────────────────────────────────────────────────────
app.use(helmet({
  strictTransportSecurity: env.isProduction ? undefined : false,
  contentSecurityPolicy: {
    directives: { 'upgrade-insecure-requests': env.isProduction ? [] : null },
  },
}));
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(requestLogger);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'servigen-backend',
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Limits run before body parsing and authentication. Health and browser
// preflights stay available; AI receives an additional, smaller IP budget.
app.use('/api', createRateLimiter(env.RATE_LIMIT.MAX));
app.use('/api/ai-core', createRateLimiter(env.RATE_LIMIT.AI_MAX));
app.use(express.json({ limit: '100kb' }));

// Authentication module: login is public with strict rate limiting; session requires verified token.
app.use('/api/auth/login', createRateLimiter(20));
app.use('/api/auth', (req, res, next) => {
  if (req.path === '/login') return next();
  return requireAuth(req, res, (err) => {
    if (err) return next(err);
    req.headers['x-user-id'] = req.user.id;
    req.headers['x-user-role'] = req.user.role;
    next();
  });
}, authRouter);

// Authenticate all implemented business APIs.
app.use('/api', requireAuth);
// Temporary compatibility for modules that still read headers/query identity.
// Verified JWT identity takes precedence over client-supplied agent identifiers.
app.use('/api', (req, _res, next) => {
  const targetAgentId = req.user.role === 'Admin' && typeof req.query.agentId === 'string' && req.query.agentId.trim()
    ? req.query.agentId : req.user.id;
  req.headers['x-user-id'] = targetAgentId;
  req.headers['x-user-role'] = req.user.role;
  req.query.agentId = targetAgentId;
  if (req.user.organisationId) {
    req.headers['x-org-id'] = req.user.organisationId;
  } else {
    delete req.headers['x-org-id'];
  }
  if (req.user.email) {
    req.headers['x-user-email'] = req.user.email;
  } else {
    delete req.headers['x-user-email'];
  }
  next();
});

// ─── Mount Module Routes ────────────────────────────────────────────────────
app.use('/api/my-work', restrictTo(...PERMISSIONS.STAFF), myWorkRouter);
app.use('/api/dashboard', (req, res, next) => {
  const roles = req.path.replace(/\/$/, '') === '/summary' ? PERMISSIONS.DASHBOARD_SUMMARY : PERMISSIONS.DASHBOARD;
  return restrictTo(...roles)(req, res, next);
}, dashboardRouter);
app.use('/api/approvals', restrictTo(...PERMISSIONS.APPROVALS),
  approvalScope(require('./modules/approvals/approvals.model').getApprovalById), approvalsRouter);
app.use('/api/services', restrictTo(...PERMISSIONS.CATALOGUE), servicesCatalogueRouter);
app.use('/api/major-incidents', (req, res, next) =>
  restrictTo(...(['GET', 'HEAD'].includes(req.method) ? PERMISSIONS.STAFF : PERMISSIONS.ADMIN_ONLY))(req, res, next), majorIncidentsRouter);
app.use('/api/incidents', restrictTo(...PERMISSIONS.STAFF), incidentsRouter);
app.use('/api/organisations', restrictTo(...PERMISSIONS.STAFF), (req, res, next) => {
  if (req.user.role !== 'Admin') {
    const match = req.path.match(/^\/([^/]+)/);
    if (match && match[1] && (!req.user.organisationId || match[1] !== req.user.organisationId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
  }
  next();
}, organisationsRouter);
app.use('/api/change-requests', restrictTo(...PERMISSIONS.STAFF), changeRequestsRouter);
app.use('/api/ai-core', restrictTo(...PERMISSIONS.AI));
app.use('/api/ai-core/response', aiResponseRouter);
app.use('/api/ai-core/retrieval', (req, res, next) => {
  if (req.user.organisationId && (req.user.role !== 'Admin' || !req.query.organisationId)) {
    req.query.organisationId = req.user.organisationId;
  }
  next();
}, retrievalRouter);
// These routers already contain /projects, /lists and /escalation prefixes.
app.use('/api/projects', restrictTo(...PERMISSIONS.STAFF));
app.use('/api', projectsRouter);
app.use('/api/cmdb', restrictTo(...PERMISSIONS.STAFF), cmdbRouter);
app.use('/api/list-builder', restrictTo(...PERMISSIONS.STAFF), listsRouter);
app.use('/api/ai-core/intent', intentRouter);
app.use('/api/ai-core', escalationRouter);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
