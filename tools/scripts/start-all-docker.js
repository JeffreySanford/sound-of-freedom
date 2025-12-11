#!/usr/bin/env node
/* eslint-disable no-console */
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');
const { createNodeLogger } = require('../logging/node-logger');
const logger = createNodeLogger({ serviceName: 'start-all-docker', logDir: process.env.LOG_DIR || 'tmp/logs/start-all-docker' });

// Allow specifying a compose file via env or CLI. If missing, skip docker and fall back to NX local serves.
let COMPOSE_FILE = 'docker-compose.yml';
// Support overriding via env variable
if (process.env.COMPOSE_FILE && process.env.COMPOSE_FILE.trim()) {
  COMPOSE_FILE = process.env.COMPOSE_FILE.trim();
}
// We'll validate compose file exists after parsing CLI args so overrides are respected
// COMPOSE_CMD removed (use wrappers). Keep COMPOSE_FILE and COMPOSE_EXISTS
let COMPOSE_EXISTS = false;

function runSync(cmd, args) {
  logger.info(`> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited with ${r.status}`);
  }
}

function runDetached(cmd, args, env) {
  logger.info(`> ${cmd} ${args.join(' ')}`);
  const child = spawn(cmd, args, { stdio: 'inherit', env: { ...process.env, ...(env || {}) } });
  child.on('exit', (code) => {
    logger.info(`${cmd} ${args.join(' ')} exited with ${code}`);
  });
  return child;
}

function waitForPort(host, port, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function tryConnect() {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket
        .once('error', () => {
          socket.destroy();
          if (Date.now() - start > timeoutMs) return reject(new Error(`Timed out waiting for ${host}:${port}`));
          setTimeout(tryConnect, 500);
        })
        .once('timeout', () => {
          socket.destroy();
          if (Date.now() - start > timeoutMs) return reject(new Error(`Timed out waiting for ${host}:${port}`));
          setTimeout(tryConnect, 500);
        })
        .connect(port, host, () => {
          socket.end();
          resolve();
        });
    }
    tryConnect();
  });
}

function getHostPortForService(service, containerPort) {
  // Use `docker compose port` to map container port to host
  if (!COMPOSE_EXISTS) return null;
  try {
    const r = spawnSync('docker', ['compose', '-f', COMPOSE_FILE, 'port', service, String(containerPort)], { encoding: 'utf8' });
    if (r.status !== 0) return null;
    const out = (r.stdout || '').trim();
    if (!out) return null;
    const colonIndex = out.lastIndexOf(':');
    const hostPort = out.substring(colonIndex + 1);
    return parseInt(hostPort, 10);
  } catch (err) {
    return null;
  }
}

function runDockerComposeSync(argsArr) {
  if (!COMPOSE_EXISTS) {
    logger.warn(`Skipping docker compose command because compose file not found: docker compose ${argsArr.join(' ')}`);
    return null;
  }
  // If API_DEBUG_COMMANDS is enabled in the current shell, create a temporary env file for compose
  const envFilePath = COMPOSE_EXISTS && (process.env.API_DEBUG_COMMANDS === '1' || process.env.REQUIRE_OLLAMA === '1') ? path.join(process.cwd(), '.env.debug') : null;
  if (envFilePath) {
    try {
      let envBody = '';
      if (process.env.API_DEBUG_COMMANDS === '1') envBody += `API_DEBUG_COMMANDS=1\nAPI_DEBUG_MAX_BODY_LEN=${process.env.API_DEBUG_MAX_BODY_LEN || '2000'}\n`;
      if (process.env.REQUIRE_OLLAMA === '1') envBody += `REQUIRE_OLLAMA=1\n`;
      // Ensure containers use the 'ollama' compose service by default if not set
      if (!process.env.OLLAMA_URL) envBody += `OLLAMA_URL=http://ollama:11434\n`;
      // Prefer Minstral3 as the default model for dev; allow override through env
      if (!process.env.OLLAMA_MODEL) envBody += `OLLAMA_MODEL=minstral3\n`;
      fs.writeFileSync(envFilePath, envBody);
    } catch (e) {
      logger.warn('Could not create .env.debug file for docker compose debug mode', { message: e.message });
    }
  }
  const argsForCmd = envFilePath ? ['--env-file', envFilePath, '-f', COMPOSE_FILE, ...argsArr] : ['-f', COMPOSE_FILE, ...argsArr];
  const result = runSync('docker', ['compose', ...argsForCmd]);
  if (envFilePath) {
    try { fs.unlinkSync(envFilePath); } catch (e) { /* ignore */ }
  }
  return result;
}

function runDockerComposeCapture(argsArr) {
  if (!COMPOSE_EXISTS) {
    logger.warn(`Skipping docker compose command (capture) because compose file not found: docker compose ${argsArr.join(' ')}`);
    return null;
  }
  logger.info(`> docker compose -f ${COMPOSE_FILE} ${argsArr.join(' ')}`);
  const envFilePath = (process.env.API_DEBUG_COMMANDS === '1' || process.env.REQUIRE_OLLAMA === '1') ? path.join(process.cwd(), '.env.debug') : null;
  if (envFilePath) {
    try {
      let envBody = '';
      if (process.env.API_DEBUG_COMMANDS === '1') envBody += `API_DEBUG_COMMANDS=1\nAPI_DEBUG_MAX_BODY_LEN=${process.env.API_DEBUG_MAX_BODY_LEN || '2000'}\n`;
      if (process.env.REQUIRE_OLLAMA === '1') envBody += `REQUIRE_OLLAMA=1\n`;
      fs.writeFileSync(envFilePath, envBody);
    } catch (e) { /* ignore */ }
  }
  const composeArgs = envFilePath ? ['--env-file', envFilePath, '-f', COMPOSE_FILE, ...argsArr] : ['-f', COMPOSE_FILE, ...argsArr];
  const r = spawnSync('docker', ['compose', ...composeArgs], { encoding: 'utf8' });
  if (r.error) throw r.error;
  if (envFilePath) {
    try { fs.unlinkSync(envFilePath); } catch (e) { /* ignore */ }
  }
  return r;
}

function parseArgs() {
  // simple parser for CLI flags like --include=frontend,api and --skip-local
  const argv = process.argv.slice(2);
  const parsed = { include: null, skipLocal: false, forceLocal: null };
  for (const a of argv) {
    if (a.startsWith('--include=')) parsed.include = a.split('=')[1];
    if (a === '--skip-local') parsed.skipLocal = true;
    if (a.startsWith('--force-local=')) parsed.forceLocal = a.split('=')[1];
  }
  return parsed;
}

// Add parsing for a flag that causes docker compose to include additional services
function parseArgsExtended() {
  const argv = process.argv.slice(2);
  const parsed = { include: null, skipLocal: false, forceLocal: null, dockerInclude: null, composeFile: null, debug: false, requireOllama: false };
  for (const a of argv) {
    if (a.startsWith('--include=')) parsed.include = a.split('=')[1];
    if (a === '--skip-local') parsed.skipLocal = true;
    if (a.startsWith('--force-local=')) parsed.forceLocal = a.split('=')[1];
    if (a.startsWith('--docker-include=')) parsed.dockerInclude = a.split('=')[1];
    if (a.startsWith('--compose-file=')) parsed.composeFile = a.split('=')[1];
    if (a === '--debug') parsed.debug = true;
    if (a === '--require-ollama') parsed.requireOllama = true;
  }
  return parsed;
}

async function main() {
  // Use extended args parser to support dockerInclude
  const args = parseArgsExtended();
  logger.info('start-all-docker args:', args);
  // If CLI provided a compose file, override env/default
  if (args.composeFile && args.composeFile.trim()) {
    COMPOSE_FILE = args.composeFile.trim();
  }
  // If debug CLI flag is set, enable API_DEBUG_COMMANDS env var locally and for docker
  if (args.debug) {
    logger.info('DEBUG MODE: API debug logging will be enabled (API_DEBUG_COMMANDS=1)');
    process.env.API_DEBUG_COMMANDS = '1';
  }
  // Re-validate compose file existence after potential CLI override
  if (COMPOSE_FILE && fs.existsSync(path.join(process.cwd(), COMPOSE_FILE))) {
    COMPOSE_EXISTS = true;
    COMPOSE_CMD = `docker compose -f ${COMPOSE_FILE}`;
  } else {
    COMPOSE_EXISTS = false;
    COMPOSE_FILE = null;
    logger.warn('No Docker compose file found. Docker compose commands will be skipped and local NX serves will be used instead.');
    logger.warn('Tip: run with --compose-file docker-compose.dev.example.yml or copy that example to docker-compose.yml to enable docker infra.');
  }
    // If the caller wants to require Ollama for the API container and local serve
    if (args.requireOllama) {
      logger.info('Enabling REQUIRE_OLLAMA=1 for local env & docker-compose');
      process.env.REQUIRE_OLLAMA = '1';
    }
  try {
    logger.info('Bringing down docker compose stack (if running) to free ports...');
    try { runDockerComposeSync(['down', '-v', '--remove-orphans']); } catch (e) { logger.warn(e.message); }

    // Before starting up, check if any ports expected by compose are already in use by other host processes
    async function isPortFree(port) {
      return new Promise((resolve) => {
        const s = net.createServer();
        s.once('error', (err) => {
          if (err && err.code === 'EADDRINUSE') resolve(false);
          else resolve(true);
        });
        s.once('listening', () => { s.close(); resolve(true); });
        s.listen(port, '127.0.0.1');
      });
    }

    const portsToCheck = Object.values({
      frontend: 4200,
      api: 3000,
      jen1: 4001,
      muscgen: 4002,
      orchestrator: 4000,
      redis: 6379,
      ollama: 11434,
    });
    for (const p of portsToCheck) {
      // check if any other process is using this port
      // if a host process is still listening (not docker), warn and stop
      // We allow docker containers to bind to ports, but if port is in use by host, docker can't bind.
      // We expect docker compose down to free existing docker ports, but host processes may remain.
      // Check if port is used
      // eslint-disable-next-line no-await-in-loop
      const free = await isPortFree(p);
      if (!free) {
        logger.error(`\nPort ${p} appears to be in use on the host. This will cause docker compose to fail to bind the same port.\n`);
        logger.error('Please stop the process that is listening on this port, or change the port mapping in docker-compose.yml.');
        logger.error('\nCommon commands to find and stop the process:');
        logger.error('  Linux/WSL: sudo lsof -i :' + p + ' && sudo kill -9 <PID>');
        logger.error('  macOS: lsof -i :' + p + ' && kill -9 <PID>');
        logger.error('  Windows (Powershell): netstat -ano | findstr :' + p + ' && taskkill /F /PID <PID>');
        process.exit(1);
      }
    }

    logger.info(`Building docker images for infra services using compose file: ${COMPOSE_FILE} ...`);
    try {
      runDockerComposeSync(['build', 'jen1', 'muscgen', 'redis', 'ollama', 'orchestrator']);
    } catch (e) {
      logger.warn('docker compose build failed, continuing to up with existing images');
    }
    // Determine which services should be started by docker compose.
    // By default start the infra services (jen1, muscgen, redis, ollama, orchestrator).
    // If --docker-include flag is provided, add services like 'api' and/or 'frontend'.
    const defaultServices = ['jen1', 'muscgen', 'redis', 'ollama', 'orchestrator'];
    const dockerIncludes = args.dockerInclude ? args.dockerInclude.split(',').map((s) => s.trim()) : [];
    let composeServicesToStart = Array.from(new Set(defaultServices.concat(dockerIncludes.filter(Boolean))));
    // If we have a compose file, only consider services actually defined in it
    if (COMPOSE_EXISTS) {
      const cfg = runDockerComposeCapture(['config', '--services']);
      const composeDefinedServices = (cfg && cfg.stdout) ? (cfg.stdout || '').trim().split(/\s+/).filter(Boolean) : [];
      // Only start services that compose actually defines and we want
      composeServicesToStart = composeServicesToStart.filter((s) => composeDefinedServices.includes(s));
    }
    // Filter composeServicesToStart to those that actually have a Dockerfile path if they are expected to be built.
    // For services without a Dockerfile, fall back to local serve (they're added to nxToServe later).
    const serviceDockerfileMap = {
      frontend: 'apps/frontend/Dockerfile',
      api: 'apps/api/Dockerfile',
      jen1: 'apps/jen1/Dockerfile',
      muscgen: 'apps/muscgen/Dockerfile',
      orchestrator: 'apps/orchestrator/Dockerfile',
      ollama: 'apps/ollama/Dockerfile',
    };
    const validatedComposeServices = [];
    const fallbackToLocal = [];
    for (const svc of composeServicesToStart) {
      const dockerfile = serviceDockerfileMap[svc];
      if (!dockerfile) {
        // Unknown service, keep in compose list
        validatedComposeServices.push(svc);
        continue;
      }
      if (fs.existsSync(path.join(process.cwd(), dockerfile))) {
        validatedComposeServices.push(svc);
      } else {
        logger.warn(`Dockerfile for service '${svc}' not found at ${dockerfile}, will fall back to local serve`);
        fallbackToLocal.push(svc);
      }
    }
    // Any services that we planned to include in docker but do not have Dockerfiles should be removed from compose up.
    // Explicitly exclude frontend and api from docker compose in order to prefer local NX serve for these
    const removedServices = [];
    const composeFinalServices = validatedComposeServices.filter((s) => {
      if (s === 'frontend' || s === 'api') {
        removedServices.push(s);
        return false;
      }
      return true;
    });
    if (removedServices.length) {
      logger.info(`Removing from docker compose (will be served locally instead): ${removedServices.join(', ')}`);
    }
    logger.info('Starting docker compose stack for infra (including any docker-include values): ' + composeFinalServices.join(', '));
    if (composeFinalServices.length > 0) {
      runDockerComposeSync(['up', '-d', ...composeFinalServices]);
    }
    // If any requested dockerIncludes didn't have Dockerfiles, we'll add them to local serve
    // list after we compute which services are provided by Docker.

    // Determine which services are in the compose file
    let services = [];
    if (COMPOSE_EXISTS) {
      const r = runDockerComposeCapture(['config', '--services']);
      if (r && r.stdout) services = (r.stdout || '').trim().split(/\s+/).filter(Boolean);
    }
    logger.info('Services in docker compose: ' + services.join(', '));

    // Known mapping of service -> container port
    const serviceToPort = {
      frontend: 4200,
      api: 3000,
      jen1: 4001,
      muscgen: 4002,
      orchestrator: 4000,
      redis: 6379,
      ollama: 11434,
    };

    // Wait for service ports to become available on host
    for (const svc of Object.keys(serviceToPort)) {
      if (services.includes(svc)) {
        const contPort = serviceToPort[svc];
        const hostPort = getHostPortForService(svc, contPort) || contPort;
        logger.info(`Waiting for ${svc} on port ${hostPort}...`);
        try {
          // eslint-disable-next-line no-await-in-loop
          await waitForPort('127.0.0.1', hostPort, 45_000);
          logger.info(`${svc} is listening on ${hostPort}`);
        } catch (err) {
          logger.warn(`Timed out waiting for ${svc}:${hostPort} - continuing. ${err.message}`);
        }
      }
    }

    // Decide which Nx projects need local serve (only those which DO NOT have a docker container running)
    let nxToServe = [];
    const serviceProvided = (svc, containerPort) => !!getHostPortForService(svc, containerPort);
    if (!serviceProvided('frontend', serviceToPort.frontend)) nxToServe.push('frontend');
    if (!serviceProvided('api', serviceToPort.api)) nxToServe.push('api');

    // Allow forcing local serve via environment variable or --force-local flag
    const forcedEnv = process.env.FORCE_LOCAL_SERVE ? process.env.FORCE_LOCAL_SERVE.split(',').map((s) => s.trim()) : [];
    const forcedFlag = args.forceLocal ? args.forceLocal.split(',').map((s) => s.trim()) : [];
    const forced = [...forcedEnv, ...forcedFlag].filter(Boolean);
    for (const f of forced) {
      if (!nxToServe.includes(f)) nxToServe.push(f);
    }

    // CLI include explicitly includes services to start locally (overrides automatic detection)
    if (args.include) {
      const inc = args.include.split(',').map((s) => s.trim());
      for (const f of inc) {
        if (!nxToServe.includes(f)) nxToServe.push(f);
      }
    }

    // If the caller asked for services to be included in Docker, then we should not start those services locally.
    if (dockerIncludes.length) {
      for (const d of dockerIncludes) {
        if (nxToServe.includes(d)) nxToServe = nxToServe.filter((v) => v !== d);
      }
    }

    if (args.skipLocal) {
      nxToServe = [];
    }

    // If any requested dockerIncludes didn't have Dockerfiles (and then were removed from compose up), add them to local serve list.
    if (typeof fallbackToLocal !== 'undefined' && fallbackToLocal.length) {
      for (const s of fallbackToLocal) {
        if (!nxToServe.includes(s)) nxToServe.push(s);
      }
    }

    if (nxToServe.length === 0) {
      logger.info('All projects are provided by docker compose. Nothing to serve locally.');
      logger.info('You can view frontend at http://localhost:4200 and api at http://localhost:3000 (if present).');
      process.exit(0);
    }

    // Pick ports for local Nx serves to avoid conflicts with docker containers and existing processes
    function findAvailablePort(preferred) {
      return new Promise((resolve) => {
        const s = net.createServer();
        s.once('error', () => { s.close(); resolve(null); });
        s.once('listening', () => {
          const addr = s.address();
          const port = addr && addr.port ? addr.port : preferred;
          s.close();
          resolve(port);
        });
        s.listen(preferred, '127.0.0.1');
      });
    }

    const frontPort = await findAvailablePort(4200);
    const apiPort = await findAvailablePort(3000);

    const serveProcs = [];
    function cleanupAndExit(code = 0) {
      logger.info('Stopping local serve processes...');
      for (const p of serveProcs) {
        try {
          p.kill('SIGINT');
        } catch (e) {
          // ignore
        }
      }
      process.exit(code);
    }
    process.on('SIGINT', () => cleanupAndExit(0));
    process.on('SIGTERM', () => cleanupAndExit(0));
    // Check if pnpm is available first (so we can fail gracefully)
    const pnpmCheck = spawnSync('pnpm', ['-v'], { encoding: 'utf8', shell: true });
    const npmCheck = spawnSync('npm', ['-v'], { encoding: 'utf8', shell: true });
    const pnpmAvailable = pnpmCheck.status === 0;
    const npmAvailable = npmCheck.status === 0;
    let pnpmExecCmd = 'pnpm';
    // Use workspace-aware pnpm execution so `nx` resolves to the workspace root
    let pnpmExecArgsPrefix = ['-w', 'exec', '--'];
    if (!pnpmAvailable && npmAvailable) {
      logger.warn('pnpm not found, falling back to `npm exec -- pnpm`');
      pnpmExecCmd = 'npm';
      // Fallback: use `npm exec -- nx` which should run a local nx if available.
      pnpmExecArgsPrefix = ['exec', '--'];
    }
    if (!pnpmAvailable) {
      logger.warn('pnpm not found in PATH for spawning local serves; local frontend/api will not be started.');
    }
    for (const p of nxToServe) {
      if (p === 'frontend') {
        const port = frontPort || 4201;
        // If Docker provides API or orchestrator, prefer to set API_URL to localhost mapped ports
        const orchPort = getHostPortForService('orchestrator', 4000) || getHostPortForService('api', 3000);
        const apiHost = orchPort ? `http://127.0.0.1:${orchPort}` : (getHostPortForService('api', 3000) ? `http://127.0.0.1:${getHostPortForService('api', 3000)}` : 'http://127.0.0.1:3000');
        const env = { ...process.env, API_URL: apiHost };
        logger.info(`Starting local frontend on port ${port} (if docker does not provide it) with API_URL=${apiHost}`);
        if (pnpmAvailable || npmAvailable) {
          const args = pnpmExecArgsPrefix.concat(['nx', 'serve', 'frontend', '--', `--port=${port}`]);
          serveProcs.push(spawn(pnpmExecCmd, args, { stdio: 'inherit', env, shell: true }));
        }
      }
      if (p === 'api') {
        const port = apiPort || 3001;
        logger.info(`Starting local api on port ${port} (if docker does not provide it)`);
        // Build env pointing to host-mapped container ports for dependencies
        const redisPort = getHostPortForService('redis', 6379) || 6379;
        const j1Port = getHostPortForService('jen1', 4001) || 4001;
        const mgPort = getHostPortForService('muscgen', 4002) || 4002;
        const ollamaPort = getHostPortForService('ollama', 11434) || 11434;
        const env = {
          ...process.env,
          PORT: String(port),
          REDIS_URL: `redis://127.0.0.1:${redisPort}`,
          JEN1_URL: `http://127.0.0.1:${j1Port}/`,
          MUSCGEN_URL: `http://127.0.0.1:${mgPort}/`,
          OLLAMA_URL: `http://127.0.0.1:${ollamaPort}`,
        };
        if (pnpmAvailable || npmAvailable) {
          const args = pnpmExecArgsPrefix.concat(['nx', 'serve', 'api']);
          serveProcs.push(spawn(pnpmExecCmd, args, { stdio: 'inherit', env, shell: true }));
        }
      }
    }

    logger.info('Started local NX serve for: ' + nxToServe.join(', '));
    logger.info('Press Ctrl+C to stop.');
  } catch (err) {
    logger.error('Error in start-all-docker script', { error: err });
    process.exit(1);
  }
}

main();
