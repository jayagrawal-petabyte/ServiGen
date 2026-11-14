'use strict';

const env = require('./env');
const { PrismaClient } = require('@prisma/client');
const options = {
  datasources: { db: { url: env.DATABASE_URL } },
  log: env.isDevelopment ? ['warn', 'error'] : ['error'],
};
if (env.DATABASE_URL && /db\.[a-z0-9-]+\.supabase\.co/i.test(env.DATABASE_URL)) {
  console.warn(
    '[ServiGen:DB Warning] Detected direct Supabase host in DATABASE_URL. ' +
    'Direct connection resolves over IPv6 only, which fails on Render (P1001). ' +
    'Please configure Render with the Supavisor pooler URL: aws-0-[region].pooler.supabase.com:6543 (or :5432).'
  );
}

// Connection is lazy while modules still use mock data. An explicit $connect()
// must succeed before reporting database readiness.
const prisma = env.isProduction
  ? new PrismaClient(options)
  : (global.__prismaClient || (global.__prismaClient = new PrismaClient(options)));

module.exports = prisma;
