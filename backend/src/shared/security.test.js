'use strict';
process.env.NODE_ENV = 'test';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createRateLimiter } = require('./middleware/rate-limit.middleware');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('IP rate limits reject repeated requests even with changed identity headers', async t => {
  const app = express();
  app.use(createRateLimiter(2));
  app.get('/', (_req,res) => res.json({success:true}));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => {server.closeIdleConnections?.();server.close(resolve);}));
  const url = 'http://127.0.0.1:'+server.address().port;
  assert.equal((await fetch(url)).status, 200);
  assert.equal((await fetch(url, {headers:{'x-user-id':'different','x-real-ip':'192.0.2.1'}})).status, 200);
  const blocked = await fetch(url, {headers:{'x-user-id':'other','x-real-ip':'192.0.2.2'}});
  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), {success:false,message:'Too many requests. Please try again later.'});
  assert.ok(blocked.headers.get('retry-after'));
  assert.ok(blocked.headers.get('ratelimit'));
});

test('production seeding remains blocked before any database operation', () => {
  const seed = path.resolve(__dirname, '../../prisma/seed.js');
  const script = `const Module=require('node:module');const original=Module._load;Module._load=function(id,...args){if(id==='../src/config/db')return new Proxy({}, {get(){throw new Error('DATABASE_OPERATION')}});return original.call(this,id,...args)};require(${JSON.stringify(seed)})`;
  const result = spawnSync(process.execPath, ['-e',script], {encoding:'utf8',env:{
    ...process.env, NODE_ENV:'production', JWT_SECRET:'synthetic-production-test-key-at-least-32-bytes',
    DATABASE_URL:'postgresql://fake:fake@localhost:5433/fake', CORS_ORIGIN:'https://app.example.com',
  }});
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Sample seed accounts are development-only/);
  assert.ok(!result.stderr.includes('DATABASE_OPERATION'));
});
