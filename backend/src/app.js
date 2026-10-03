'use strict';

const express = require('express');
const cors = require('cors');

const myWorkRouter = require('./modules/my-work/my-work.routes');
const dashboardRouter = require('./modules/dashboard/dashboard.routes');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, status: 'ok', service: 'servigen-backend' });
});

// ─── Module routes ────────────────────────────────────────────────────────────

app.use('/api/my-work', myWorkRouter);
app.use('/api/dashboard', dashboardRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';
  res.status(status).json({ success: false, message });
});

module.exports = app;
