'use strict';

const env = require('./env');
const { PrismaClient } = require('@prisma/client');
const options = {
  datasources: { db: { url: env.DATABASE_URL } },
  log: env.isDevelopment ? ['warn', 'error'] : ['error'],
};
// Connection is lazy while modules still use mock data. An explicit $connect()
// must succeed before reporting database readiness.
const prisma = env.isProduction
  ? new PrismaClient(options)
  : (global.__prismaClient || (global.__prismaClient = new PrismaClient(options)));

module.exports = prisma;
