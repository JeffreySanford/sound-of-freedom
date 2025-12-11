// simple placeholder to ensure postinstall steps do not fail when nx is not installed
try { const { createNodeLogger } = require('./logging/node-logger'); const logger = createNodeLogger({ serviceName: 'postinstall', logDir: process.env.LOG_DIR || 'tmp/logs/scripts' }); logger.info('postinstall placeholder'); } catch(e) { }
