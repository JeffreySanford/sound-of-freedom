#!/usr/bin/env node
const axios = require('axios');
const crypto = require('crypto');
const { createNodeLogger } = require('../../tools/logging/node-logger');
const logger = createNodeLogger({ serviceName: 'poc-send-narrative', logDir: process.env.LOG_DIR || 'tmp/logs/scripts' });

const API_ROOT = process.env.API_URL || 'http://localhost:3000/api';

async function main() {
  try {
    const unique = (crypto.randomUUID && crypto.randomUUID().slice(0, 8)) || crypto.randomBytes(4).toString('hex');
    const user = { email: `poc+${unique}@example.local`, username: `poc_${unique}`, password: 'poc-pass-123' };

    logger.info('Registering test user', { email: user.email });
    try {
      await axios.post(`${API_ROOT}/auth/register`, user, { timeout: 10000 });
    } catch (e) {
      // ignore if already exists
      if (e.response && e.response.status === 409) logger.info('User already exists', { email: user.email });
      else logger.warn('Register error (ignored)', { message: e.message || e });
    }

    logger.info('Logging in');
    const loginResp = await axios.post(`${API_ROOT}/auth/login`, { emailOrUsername: user.email, password: user.password }, { timeout: 10000 });
    const token = loginResp.data?.accessToken;
    if (!token) throw new Error('No accessToken from login');

    logger.info('Sending generate-metadata request to API -> Ollama');
    const narrative = process.argv.slice(2).join(' ') || 'A small story about a lonely robot learning to play the guitar in a rainy city.';
    const resp = await axios.post(`${API_ROOT}/songs/generate-metadata`, { narrative, duration: 45, model: process.env.OLLAMA_MODEL || undefined }, { headers: { Authorization: `Bearer ${token}` }, timeout: 60000 });

    logger.info('Response from API (generated metadata)', { data: resp.data });
  } catch (err) {
    logger.error('Error while sending narrative', { message: err.message || err.toString() });
    if (err.response) {
      logger.error('Response status', { status: err.response.status });
      try { logger.error('Response data', { data: err.response.data }); } catch (e) { logger.error('Response data', { data: err.response.data }); }
    }
    process.exit(1);
  }
}

main();
