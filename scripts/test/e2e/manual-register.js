const axios = require('axios');
const { createNodeLogger } = require('../../tools/logging/node-logger');
const logger = createNodeLogger({ serviceName: 'e2e-manual-register', logDir: process.env.LOG_DIR || 'tmp/logs/e2e' });

(async () => {
  try {
    const resp = await axios.post('http://localhost:3000/api/auth/register', { email: 'e2e-test-manual2@example.com', username: 'e2e_test_manual2', password: 'testpassword123' }, { timeout: 10000 });
    logger.info('SUCCESS', { status: resp.status, data: resp.data });
  } catch (err) {
    logger.error('ERROR', { message: err && err.message ? err.message : err });
    logger.error('ERROR DETAILS', { err: err && err.response ? err.response.data : err });
    if (err.response) {
      logger.error('STATUS', { status: err.response.status });
      logger.error('BODY', { body: err.response.data });
    }
    process.exit(1);
  }
})();
