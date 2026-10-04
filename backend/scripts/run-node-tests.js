'use strict';

const { readdirSync } = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const folders = [
  'src/config', 'src', 'src/shared', 'src/modules/approvals',
  'src/modules/services-catalogue', 'src/modules/ai-core/response',
  'src/modules/major-incidents',
];
const files = folders.flatMap(folder => readdirSync(path.join(root, folder))
  .filter(file => file.endsWith('.test.js')).map(file => path.join(root, folder, file)));
const result = spawnSync(process.execPath, ['--test', ...files], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'test',
    JWT_SECRET: randomBytes(32).toString('hex'),
    ALLOW_DEV_AUTH_OVERRIDE: 'false',
    CORS_ORIGIN: 'http://localhost:5173,http://localhost:3000',
    RATE_LIMIT_WINDOW_MS: '60000', RATE_LIMIT_MAX: '300', AI_RATE_LIMIT_MAX: '30',
  },
});
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
