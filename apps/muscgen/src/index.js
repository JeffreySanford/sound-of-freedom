const express = require('express');
const app = express();
const { createNodeLogger } = require('../../../tools/logging/node-logger');
const logger = createNodeLogger({ serviceName: 'muscgen', logDir: process.env.LOG_DIR || 'tmp/logs/muscgen' });
const port = process.env.PORT || 4002;

app.get('/', (req, res) => {
  res.json({ name: 'muscgen', status: 'ready' });
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.listen(port, () => logger.info(`muscgen listening on ${port}`));
