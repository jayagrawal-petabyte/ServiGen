'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { X509Certificate } = require('node:crypto');
const { configureDatabaseUrl, SUPABASE_CA_FILE } = require('./database-url');

test('Supabase transaction URLs use verified TLS and Prisma pooler compatibility', () => {
  const source = 'postgresql://postgres.example:synthetic%40password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=no-verify&connection_limit=2&schema=public';
  const url = new URL(configureDatabaseUrl(source));
  assert.equal(url.searchParams.get('sslmode'), 'require');
  assert.equal(url.searchParams.get('sslaccept'), 'strict');
  assert.equal(url.searchParams.get('sslcert'), SUPABASE_CA_FILE);
  assert.equal(url.searchParams.get('pgbouncer'), 'true');
  assert.equal(url.searchParams.get('connection_limit'), '2');
  assert.equal(url.searchParams.get('schema'), 'public');
  assert.equal(url.username, new URL(source).username);
  assert.equal(url.password, new URL(source).password);
});

test('session pooler and direct Supabase URLs also verify TLS without enabling transaction mode', () => {
  for (const host of ['aws-0-ap-northeast-1.pooler.supabase.com', 'db.example.supabase.co']) {
    const url = new URL(configureDatabaseUrl(`postgresql://example:synthetic@${host}:5432/postgres`));
    assert.equal(url.searchParams.get('sslmode'), 'require');
    assert.equal(url.searchParams.get('sslaccept'), 'strict');
    assert.equal(url.searchParams.get('sslcert'), SUPABASE_CA_FILE);
    assert.equal(url.searchParams.has('pgbouncer'), false);
  }
});

test('a configured CA is preserved and Supabase cannot silently downgrade TLS', () => {
  const url = new URL(configureDatabaseUrl('postgresql://example:synthetic@aws-0-example.pooler.supabase.com:6543/postgres?sslcert=/etc/custom-ca.pem&sslmode=disable&sslaccept=accept_invalid_certs&pgbouncer=false'));
  assert.equal(url.searchParams.get('sslcert'), '/etc/custom-ca.pem');
  assert.equal(url.searchParams.get('sslmode'), 'require');
  assert.equal(url.searchParams.get('sslaccept'), 'strict');
  assert.equal(url.searchParams.get('pgbouncer'), 'true');
});

test('other PostgreSQL configurations are preserved exactly', () => {
  for (const source of [
    'postgresql://local:synthetic@localhost:5433/servigen?schema=public',
    'postgres://example:synthetic@postgres.example.com/db?sslmode=require',
    'postgresql://example:synthetic@aws-0-example.pooler.supabase.com.example.org/db',
  ]) assert.equal(configureDatabaseUrl(source), source);
});

test('invalid URLs fail without disclosing credentials', () => {
  for (const source of ['bad-secret', 'https://example:private@example.com/db', 'postgresql://example:private@localhost/']) {
    assert.throws(() => configureDatabaseUrl(source), { message: 'DATABASE_URL must be a valid PostgreSQL connection URL' });
  }
});

test('bundled certificate is the published Supabase root CA', () => {
  const cert = new X509Certificate(readFileSync(SUPABASE_CA_FILE));
  assert.equal(cert.ca, true);
  assert.equal(cert.subject, cert.issuer);
  assert.equal(cert.fingerprint256, '80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA');
  assert.ok(Date.parse(cert.validTo) > Date.now());
});
