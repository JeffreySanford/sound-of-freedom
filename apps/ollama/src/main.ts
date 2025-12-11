// This file intentionally no longer runs a mock server.
// Ollama should be provided as a Docker container in development and production.
// If you need a local mock override, please use a separate test harness or a
// feature-specific test that spins up a test-only server.
import { createNodeLogger } from '../../../tools/logging/node-logger';
const logger = createNodeLogger({ serviceName: 'ollama-helper', logDir: process.env.LOG_DIR || 'tmp/logs/ollama' });
logger.info('Ollama mock source removed; use Docker Ollama in development.');
