#!/usr/bin/env node
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { createNodeLogger } = require('../../tools/logging/node-logger');
const logger = createNodeLogger({ serviceName: 'generate-orchestrator-token', logDir: process.env.LOG_DIR || 'tmp/logs/scripts' });

// Read JWT_SECRET from environment or .env file
const secret = process.env.JWT_SECRET || (() => {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const txt = fs.readFileSync(envPath, 'utf8');
    const m = txt.match(/JWT_SECRET=(.*)/);
    if (m) return m[1].trim();
  }
  const { createNodeLogger } = require('../../tools/logging/node-logger');
  const logger = createNodeLogger({ serviceName: 'generate-orchestrator-token', logDir: process.env.LOG_DIR || 'tmp/logs/scripts' });
  logger.error('JWT_SECRET not found in environment or .env');
  process.exit(1);
})();

const payload = {
  sub: process.argv[2] || 'orchestrator-service',
  role: 'orchestrator',
};
const opts = {
  expiresIn: process.argv[3] || '365d',
};
const token = jwt.sign(payload, secret, opts);
logger.info('Generated orchestrator token', { token });
