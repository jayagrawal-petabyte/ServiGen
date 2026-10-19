'use strict';

const { Prisma } = require('@prisma/client');
const { env, db } = require('../src/config');

const redactError = (message) => {
  let safe = String(message).replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[REDACTED_DATABASE_URL]');
  // Some errors quote individual URL components instead of the full URL.
  const configured = process.env.DATABASE_URL;
  if (configured) {
    const password = new URL(configured).password;
    let decoded = password;
    try { decoded = decodeURIComponent(password); } catch { /* Keep the encoded value. */ }
    for (const secret of [password, decoded]) {
      if (secret) safe = safe.split(secret).join('[REDACTED]');
    }
  }
  return safe;
};

(async () => {
  const url = new URL(env.DATABASE_URL);
  console.log(JSON.stringify({
    node: process.version,
    openssl: process.versions.openssl,
    platform: process.platform,
    prisma: Prisma.prismaVersion,
    datasource: {
      host: url.hostname,
      port: url.port || '5432',
      sslmode: url.searchParams.get('sslmode'),
      sslaccept: url.searchParams.get('sslaccept'),
      sslcert: url.searchParams.get('sslcert'),
      pgbouncer: url.searchParams.get('pgbouncer'),
    },
  }, null, 2));

  try {
    await db.$queryRaw`SELECT 1`;
    // Exercise the same Prisma model operation used by login without exposing users.
    await db.user.findFirst({ select: { id: true } });
    console.log('Database connection and User read succeeded.');
  } catch (error) {
    console.error(JSON.stringify({
      name: error.name,
      code: error.code || error.errorCode,
      message: redactError(error.message),
    }));
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
})().catch(error => {
  console.error(redactError(error.message));
  process.exitCode = 1;
});
