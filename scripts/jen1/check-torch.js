#!/usr/bin/env node
const axios = require('axios');
const { createNodeLogger } = require('../../tools/logging/node-logger');
const logger = createNodeLogger({ serviceName: 'jen1-check', logDir: process.env.LOG_DIR || 'tmp/logs/scripts' });

const JEN1_URL = process.env.JEN1_URL || 'http://localhost:4001';

async function main() {
  try {
    const resp = await axios.get(`${JEN1_URL}/debug/torch`, { timeout: 5000 });
    logger.info('Torch debug', { data: resp.data });
  } catch (err) {
    logger.error('Failed to query jen1/debug/torch', { message: err.message || err });
  }
  try {
    const resp2 = await axios.get(`${JEN1_URL}/debug/model`, { timeout: 5000 });
    logger.info('Model debug', { data: resp2.data });
  } catch (err) {
    logger.error('Failed to query jen1/debug/model', { message: err.message || err });
  }
}

main();
