import { killPort } from '@nx/node/utils';
/* eslint-disable */

module.exports = async function () {
  // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
  // Hint: `globalThis` is shared between setup and teardown.
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await killPort(port);
  const { createNodeLogger } = require('../../../tools/logging/node-logger');
  const logger = createNodeLogger({ serviceName: 'api-e2e-global-teardown', logDir: process.env.LOG_DIR || 'tmp/logs/e2e' });
  logger.info(globalThis.__TEARDOWN_MESSAGE__);
};
