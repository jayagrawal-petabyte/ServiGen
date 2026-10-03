'use strict';

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[servigen] Backend running on http://localhost:${PORT}`);
  console.log(`[servigen] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[servigen] My Work API: http://localhost:${PORT}/api/my-work`);
});
