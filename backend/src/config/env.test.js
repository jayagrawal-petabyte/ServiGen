'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const config = path.join(__dirname, 'env.js');
function run(overrides) {
  return spawnSync(process.execPath, ['-e', "require('dotenv').config = () => ({}); console.log(JSON.stringify(require(" + JSON.stringify(config) + ")))"] , {
    env: {...process.env, NODE_ENV:'test', PORT:'3000', DATABASE_URL:'postgresql://local:local@localhost:5433/servigen', JWT_SECRET:'synthetic-test-secret-with-at-least-32-bytes', CORS_ORIGIN:'https://app.example.com', ...overrides}, encoding:'utf8'
  });
}
test('invalid environment and ports fail configuration', () => {
  for (const overrides of [{NODE_ENV:''}, {NODE_ENV:'prod'}, {PORT:'3000abc'}, {PORT:'0'}, {PORT:'65536'}]) assert.notEqual(run(overrides).status, 0);
});
test('production requires explicit database and rejects dev auth overrides', () => {
  assert.notEqual(run({NODE_ENV:'production', DATABASE_URL:''}).status, 0);
  const result = run({NODE_ENV:'production', ALLOW_DEV_AUTH_OVERRIDE:'true'});
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).ALLOW_DEV_AUTH_OVERRIDE, false);
});
test('malformed database URL is rejected', () => assert.notEqual(run({DATABASE_URL:'https://example.com/db'}).status, 0));

test('development and production reject missing, short and known JWT keys', () => {
  for (const NODE_ENV of ['development', 'production']) {
    for (const JWT_SECRET of ['', 'short-key', 'servigen-super-secret-jwt-key-dev-only-change-in-prod']) {
      const result = run({NODE_ENV, JWT_SECRET});
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /JWT_SECRET/);
    }
  }
});

test('test-only keys are random and development override remains explicit', () => {
  const first = JSON.parse(run({JWT_SECRET:'', ALLOW_DEV_AUTH_OVERRIDE:''}).stdout);
  const second = JSON.parse(run({JWT_SECRET:'', ALLOW_DEV_AUTH_OVERRIDE:''}).stdout);
  assert.notEqual(first.JWT.SECRET, second.JWT.SECRET);
  assert.equal(Buffer.byteLength(first.JWT.SECRET), 64);
  assert.equal(first.ALLOW_DEV_AUTH_OVERRIDE, false);
  assert.equal(JSON.parse(run({NODE_ENV:'development', ALLOW_DEV_AUTH_OVERRIDE:'true'}).stdout).ALLOW_DEV_AUTH_OVERRIDE, true);
});

test('CORS requires a production allowlist and rejects non-origin entries', () => {
  assert.notEqual(run({NODE_ENV:'production', CORS_ORIGIN:''}).status, 0);
  for (const CORS_ORIGIN of ['*', 'https://app.example.com/path', 'https://user:pass@app.example.com',
    'https://app.example.com?query=1', 'https://app.example.com#fragment', 'null', 'file:///tmp/a', 'https://app.example.com,']) {
    assert.notEqual(run({CORS_ORIGIN}).status, 0, CORS_ORIGIN);
  }
  assert.deepEqual(JSON.parse(run({CORS_ORIGIN:''}).stdout).CORS_ORIGIN,
    ['http://localhost:5173', 'http://localhost:3000']);
  assert.deepEqual(JSON.parse(run({CORS_ORIGIN:' https://APP.example.com:443/ , https://second.example.com '}).stdout).CORS_ORIGIN,
    ['https://app.example.com', 'https://second.example.com']);
});

test('rate-limit configuration rejects unsafe or disabled limits', () => {
  for (const override of [{RATE_LIMIT_MAX:'0'}, {AI_RATE_LIMIT_MAX:'Infinity'},
    {RATE_LIMIT_WINDOW_MS:'2147483648'}, {RATE_LIMIT_MAX:'5x'}]) {
    assert.notEqual(run(override).status, 0);
  }
});

test('Prisma receives validated URL without registering process shutdown handlers', () => {
  const script = "const Module=require('node:module'); const original=Module._load; let options; Module._load=function(id,...args){if(id==='@prisma/client')return {PrismaClient:class {constructor(value){options=value}}};if(id==='./env')return {DATABASE_URL:'postgresql://test:test@localhost:5433/test',isProduction:true,isDevelopment:false};return original.call(this,id,...args)};const before=process.listenerCount('SIGTERM');require(" + JSON.stringify(path.join(__dirname,'db.js')) + "); console.log(JSON.stringify({url:options.datasources.db.url,handlers:process.listenerCount('SIGTERM')-before}))";
  const result = spawnSync(process.execPath, ['-e', script], {encoding:'utf8'});
  assert.equal(result.status,0);
  assert.deepEqual(JSON.parse(result.stdout),{url:'postgresql://test:test@localhost:5433/test',handlers:0});
});
