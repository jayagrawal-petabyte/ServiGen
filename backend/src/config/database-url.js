'use strict';

const path = require('node:path');

const SUPABASE_CA_FILE = path.resolve(__dirname, '../../certs/supabase-prod-ca-2021.crt');

/** Configure Prisma's native PostgreSQL TLS options for hosted Supabase. */
const configureDatabaseUrl = (value) => {
  let url;
  try {
    url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || url.pathname.length < 2) {
      throw new Error();
    }
  } catch {
    // Never include the supplied URL: it contains the database password.
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }

  const isSupabase = /^(?:db\.[a-z0-9-]+\.supabase\.co|[a-z0-9-]+\.pooler\.supabase\.com)$/i.test(url.hostname);
  if (!isSupabase) return value;

  // Prisma 5's Rust engine supports disable/prefer/require, not no-verify.
  // Require encryption and validate the private Supabase CA and hostname.
  url.searchParams.set('sslmode', 'require');
  url.searchParams.set('sslaccept', 'strict');
  if (!url.searchParams.get('sslcert')) {
    url.searchParams.set('sslcert', SUPABASE_CA_FILE);
  }
  if (url.hostname.endsWith('.pooler.supabase.com') && url.port === '6543') {
    url.searchParams.set('pgbouncer', 'true');
  }

  return url.toString();
};

module.exports = { configureDatabaseUrl, SUPABASE_CA_FILE };
