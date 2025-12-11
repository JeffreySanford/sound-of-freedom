#!/usr/bin/env node
/* eslint-disable no-console */
const { spawn, spawnSync } = require('child_process');
const { createNodeLogger } = require('../../../tools/logging/node-logger');
const logger = createNodeLogger({ serviceName: 'e2e-runner', logDir: process.env.LOG_DIR || 'tmp/logs/e2e' });
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

const mockServerPath = 'apps/ollama/docker/mock-server.js';
const apiStartCmd = process.platform === 'win32' ? 'npm' : 'pnpm';
const apiStartArgs = process.platform === 'win32' ? ['run', 'start:api'] : ['start:api'];

const waitFor = async (checkFn, timeout = 20000, interval = 500) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const ok = await checkFn();
      if (ok) return true;
    } catch (err) {
      // ignore
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
};

const run = async () => {
  const args = process.argv.slice(2);
  const isCI = args.includes('--ci');
  const isDebug = args.includes('--debug');
  // Allow --compose-file=path or --compose-file path as option
  let composeFile = 'docker-compose.e2e.yml';
  const composeIndex = args.findIndex((a) => a.startsWith('--compose-file='));
  if (composeIndex !== -1) {
    composeFile = args[composeIndex].split('=')[1] || composeFile;
  } else {
    const idx = args.indexOf('--compose-file');
    if (idx !== -1 && args.length > idx + 1) composeFile = args[idx + 1];
  }

  // Load .env variables if present so child processes and docker compose use the expected settings
  let repoEnv = {};
  try {
    if (fs.existsSync('.env')) {
      const envStr = fs.readFileSync('.env', 'utf8');
      envStr.split(/\r?\n/).forEach((l) => {
        const s = l.trim();
        if (!s || s.startsWith('#')) return;
        const idx = s.indexOf('=');
        if (idx === -1) return;
        const k = s.slice(0, idx);
        const v = s.slice(idx + 1);
        repoEnv[k] = v;
      });
    }
  } catch (e) { /* ignore */ }

  const ensureDir = (p) => {
    try {
      fs.mkdirSync(p, { recursive: true });
    } catch (e) {
      // ignore
    }
  };

  let debugStreams = null;
  if (isDebug) {
    ensureDir('tmp/e2e');
    debugStreams = {
      apiOut: fs.createWriteStream('tmp/e2e/api.stdout.log'),
      apiErr: fs.createWriteStream('tmp/e2e/api.stderr.log'),
      mockOut: fs.createWriteStream('tmp/e2e/mock.stdout.log'),
      mockErr: fs.createWriteStream('tmp/e2e/mock.stderr.log'),
      composeLogs: fs.createWriteStream('tmp/e2e/compose.logs.log'),
    };
  }

  const runDockerComposeSync = (argsArr) => {
    logger.info(`> docker compose ${argsArr.join(' ')}`);
    const r = spawnSync('docker', ['compose', ...argsArr], { encoding: 'utf8' });
    if (r.error) throw r.error;
    if (r.status !== 0) throw new Error(r.stderr || `docker compose failed: ${r.status}`);
    return r.stdout;
  };

  const teardown = (errMsg) => {
    try {
      if (!isCI) {
        if (mock) mock.kill();
        if (api) api.kill();
      } else {
        try { runDockerComposeSync(['-f', composeFile, 'down', '-v', '--remove-orphans']); } catch (e) { /* ignore */ }
        if (composeLogsProc) try { composeLogsProc.kill(); } catch (e) { /* ignore */ }
      }
    } catch (e) {
      // ignore
    }
    if (errMsg) logger.error(errMsg);
    process.exit(1);
  };
  process.on('SIGINT', () => { teardown('Received SIGINT'); });
  process.on('SIGTERM', () => { teardown('Received SIGTERM'); });
  // If we're not running in CI mode, prefer starting or detecting a local ollama/mock
  let mock;
  let composeLogsProc;
  if (!isCI) {
    try {
      const listResp = await axios.get('http://localhost:11434/api/tags', { timeout: 1000 });
      logger.info('Detected existing Ollama instance on 11434. Skipping mock server startup.');
    } catch (e) {
      // spawn local mock server, optionally capture logs
      if (isDebug && debugStreams) {
        mock = spawn('node', [mockServerPath], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...repoEnv } });
        mock.stdout.pipe(debugStreams.mockOut);
        mock.stderr.pipe(debugStreams.mockErr);
      } else {
        mock = spawn('node', [mockServerPath], { stdio: 'inherit', env: { ...process.env, ...repoEnv } });
      }
      mock.on('exit', (code, signal) => logger.info(`Mock server exited with code=${code} signal=${signal}`));
      logger.info('Started ollama mock server');
    }
  } else {
    // CI mode: bring up docker-compose e2e stack (api + mock + infra)
    try {
      // If .env is present and points to a localhost/host mongo instance, prefer
      // not to start the mongodb service inside compose so we use the host Mongo
      let composeServices = [];
      let useHostMongo = false;
      let useHostRedis = false;
      if (repoEnv && repoEnv.MONGODB_URI) useHostMongo = /(localhost|127\.)/.test(repoEnv.MONGODB_URI);
      if (repoEnv && repoEnv.REDIS_URL) useHostRedis = /(localhost|127\.)/.test(repoEnv.REDIS_URL);
      // By default, start api, redis, ollama-mock, and mongodb unless host-based
      composeServices = ['api', 'ollama-mock'];
      if (!useHostRedis) composeServices.push('redis');
      if (!useHostMongo) composeServices.push('mongodb');
      // Start the selected services only
      runDockerComposeSync(['-f', composeFile, 'up', '-d', '--build', ...composeServices]);
      logger.info('Docker compose E2E stack started');
      if (isDebug && debugStreams) {
        // capture compose logs to a file
        composeLogsProc = spawn('docker', ['compose', '-f', composeFile, 'logs', '-f'], { stdio: ['ignore', 'pipe', 'pipe'] });
        composeLogsProc.stdout.pipe(debugStreams.composeLogs);
        composeLogsProc.stderr.pipe(debugStreams.composeLogs);
      }
    } catch (err) {
      teardown(`Failed to start docker compose E2E stack: ${err.message || err}`);
    }
  }

  const spawnApi = (candidates, opts = {}) => {
    return new Promise((resolve, reject) => {
      const trySpawn = (idx) => {
        if (idx >= candidates.length) return reject(new Error('No candidate to spawn API'));
        const [cmd, ...args] = candidates[idx];
        logger.info(`Attempting to spawn API using: ${cmd} ${args.join(' ')}`);
        const env = { ...process.env, ...repoEnv, OLLAMA_URL: 'http://localhost:11434', NODE_ENV: 'test' };
        // When running in CI we expect the API to be available via compose and exposed on host:3000
        if (isCI) env.OLLAMA_URL = 'http://ollama-mock:11434';
        let child;
        if (opts.debug && debugStreams) {
          child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], env });
          child.stdout.pipe(debugStreams.apiOut);
          child.stderr.pipe(debugStreams.apiErr);
        } else {
          child = spawn(cmd, args, { stdio: 'inherit', env });
        }
        child.on('exit', (code, signal) => logger.info(`API child exited with code=${code} signal=${signal}`));
        child.on('error', (err) => {
          if (err && err.code === 'ENOENT') {
            logger.warn(`Command ${cmd} not found, trying next candidate...`);
            trySpawn(idx + 1);
          } else {
            logger.warn(`Failed to spawn ${cmd}: ${err.message}`);
            trySpawn(idx + 1);
          }
        });
        // If child starts without error, resolve
        // Spawn doesn't emit an event on success; assume success if no immediate 'error' within short timeout
        setTimeout(() => resolve(child), 500);
      };
      trySpawn(0);
    });
  };

  const candidates = [];
  if (process.platform === 'win32') {
    candidates.push(['npm', 'run', 'start:api']);
  } else {
    candidates.push(['pnpm', 'start:api']);
  }
  // prefer starting from dist if available
  const distEntry = './dist/apps/api/main.js';
  if (fs.existsSync(distEntry)) {
    candidates.unshift(['node', distEntry]);
  }
  candidates.push(['npx', 'nx', 'serve', 'api']);
  // prefer using @nrwl's node entrypoint rather than the shell wrapper if it exists
  const nrwlBin = './node_modules/@nrwl/cli/bin/nx.js';
  if (fs.existsSync(nrwlBin)) {
    candidates.push(['node', nrwlBin, 'serve', 'api']);
  }
  // fallback to the bin shim (may be a shell script on some platforms)
  const binShim = './node_modules/.bin/nx';
  if (fs.existsSync(binShim)) {
    candidates.push(['node', binShim, 'serve', 'api']);
  }

  let api;
  try {
    // If we're in CI, prefer running the built dist entry or rely on docker compose's api container
    if (isCI) {
      // If dist entry exists and we prefer running local process (edge cases), unshift it
      if (fs.existsSync('./dist/apps/api/main.js')) {
        candidates.unshift(['node', './dist/apps/api/main.js']);
      }
      // We prefer dockerized api in CI; don't spawn local API unless explicitly desired.
      logger.info('CI mode: expecting API to be available as a container on port 3000');
    } else {
      api = await spawnApi(candidates, { debug: isDebug });
      logger.info('Started API server');
    }
  } catch (err) {
    logger.warn('Unable to spawn API server automatically. Proceeding and waiting for an externally started API (if available).');
  }
  logger.info('API server spawn completed (if a candidate succeeded)');

  const healthOk = await waitFor(async () => {
    const res = await axios.get('http://localhost:3000/api/__health');
    return res.status === 200;
  }, 60000);
  if (!healthOk) {
    teardown('API health check did not pass within timeout (60s)');
  }
  logger.info('API is healthy');

  // Ensure Ollama probe route works
  const probeOk = await waitFor(async () => {
    const r = await axios.get('http://localhost:3000/api/__health/ollama');
    return r.status === 200 && r.data && r.data.ok !== undefined;
  }, 30000);
  if (!probeOk) {
    teardown('Ollama probe failed within timeout (30s)');
  }
  logger.info('Ollama probe OK');

  // Register a test user
  const email = `e2e-test-${crypto.randomBytes(3).toString('hex')}@example.com`;
  const password = 'testpassword123';
  // Username must match /^[a-zA-Z0-9_]+$/ per RegisterDto; sanitize generated value
  const rawUsername = email.split('@')[0];
  const username = rawUsername.replace(/[^a-zA-Z0-9_]/g, '_');
  logger.info(`Registering test user: ${email} (username: ${username})`);
  await axios.post('http://localhost:3000/api/auth/register', { email, username, password });
  const login = await axios.post('http://localhost:3000/api/auth/login', { emailOrUsername: email, password });
  const token = login.data?.accessToken;
  if (!token) {
    teardown('Login failed to return token');
  }
  logger.info('User login OK');

  // Call generate metadata
  const resp = await axios.post('http://localhost:3000/api/songs/generate-metadata', { narrative: 'A short story about a shader', duration: 45 }, { headers: { Authorization: `Bearer ${token}` } });
  if (resp.status !== 200) {
    teardown('Generate metadata did not return 200');
  }
  const body = resp.data;
  logger.info('Generate metadata response', { body });

  const ok = body && body.title && body.lyrics;
  if (!ok) {
    teardown('Generated metadata missing title/lyrics');
  }
  logger.info('E2E script validated basic metadata output');

  // Cleanup test user
  await axios.delete(`http://localhost:3000/api/auth/test-user/${encodeURIComponent(email)}`); // allowed in NODE_ENV=test

  try {
    if (!isCI) {
      if (mock) mock.kill();
      if (api) api.kill();
    } else {
      // Tear down the docker compose E2E stack
      try {
        runDockerComposeSync(['-f', composeFile, 'down', '-v', '--remove-orphans']);
        logger.info('Docker compose E2E stack removed');
      } catch (err) {
        logger.warn('Failed to tear down docker compose E2E stack', { message: err.message || err });
      }
      // Stop any compose logs proc
      if (composeLogsProc) {
        try { composeLogsProc.kill(); } catch (e) { /* no-op */ }
      }
    }
  } catch (_e) {
    // ignore
  }
  logger.info('E2E script completed successfully');
};

run().catch((err) => {
  // Ensure cleanup on unexpected errors
  try { teardown(`E2E script failed: ${err && err.message ? err.message : err}`); } catch (e) { logger.error('E2E script failed', { error: err }); process.exit(1); }
});
