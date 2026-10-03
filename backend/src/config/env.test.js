'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const config = path.join(__dirname, 'env.js');
function run(overrides) {
  return spawnSync(process.execPath, ['-e', "require('dotenv').config = () => ({}); console.log(JSON.stringify(require(" + JSON.stringify(config) + ")))"] , {
    env: {...process.env, NODE_ENV:'test', PORT:'3000', DATABASE_URL:'postgresql://local:local@localhost:5433/servigen', JWT_SECRET:'test-secret', ...overrides}, encoding:'utf8'
  });
}
test('invalid environment and ports fail configuration', () => {
  for (const overrides of [{NODE_ENV:'prod'}, {PORT:'3000abc'}, {PORT:'0'}, {PORT:'65536'}]) assert.notEqual(run(overrides).status, 0);
});
test('production requires explicit database and rejects dev auth overrides', () => {
  assert.notEqual(run({NODE_ENV:'production', DATABASE_URL:''}).status, 0);
  const result = run({NODE_ENV:'production', ALLOW_DEV_AUTH_OVERRIDE:'true'});
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).ALLOW_DEV_AUTH_OVERRIDE, false);
});
test('malformed database URL is rejected', () => assert.notEqual(run({DATABASE_URL:'https://example.com/db'}).status, 0));

test('Prisma receives validated URL without registering process shutdown handlers', () => {
  const script = "const Module=require('node:module'); const original=Module._load; let options; Module._load=function(id,...args){if(id==='@prisma/client')return {PrismaClient:class {constructor(value){options=value}}};if(id==='./env')return {DATABASE_URL:'postgresql://test:test@localhost:5433/test',isProduction:true,isDevelopment:false};return original.call(this,id,...args)};const before=process.listenerCount('SIGTERM');require(" + JSON.stringify(path.join(__dirname,'db.js')) + "); console.log(JSON.stringify({url:options.datasources.db.url,handlers:process.listenerCount('SIGTERM')-before}))";
  const result = spawnSync(process.execPath, ['-e', script], {encoding:'utf8'});
  assert.equal(result.status,0);
  assert.deepEqual(JSON.parse(result.stdout),{url:'postgresql://test:test@localhost:5433/test',handlers:0});
});
