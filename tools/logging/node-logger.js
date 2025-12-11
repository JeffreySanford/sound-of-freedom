const winston = require('winston');
const path = require('path');
const fs = require('fs');
const DailyRotateFile = require('winston-daily-rotate-file');

function createNodeLogger(options = {}) {
  const serviceName = options.serviceName || process.env.SERVICE_NAME || 'node-service';
  const logDir = options.logDir || process.env.LOG_DIR || path.join(process.cwd(), 'tmp', 'logs');
  if (!fs.existsSync(logDir)) {
    try { fs.mkdirSync(logDir, { recursive: true }); } catch (e) {}
  }
  const transports = [
    new winston.transports.Console({ level: process.env.LOG_LEVEL || 'debug' }),
    new DailyRotateFile({
      level: process.env.LOG_LEVEL || 'info',
      dirname: logDir,
      filename: `${serviceName}-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ];
  // Optional MongoDB transport
  if (process.env.MONGO_LOG_URI) {
    try {
      const MongoDBTransport = require('winston-mongodb').MongoDB;
      transports.push(new MongoDBTransport({
        level: process.env.MONGO_LOG_LEVEL || process.env.LOG_LEVEL || 'info',
        db: process.env.MONGO_LOG_URI,
        collection: process.env.MONGO_LOG_COLLECTION || 'logs',
        tryReconnect: true,
        options: { useUnifiedTopology: true }
      }));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('winston-mongodb not available - skipping Mongo transport');
    }
  }
  const logger = winston.createLogger({ defaultMeta: { service: serviceName }, transports, exitOnError: false });
  return logger;
}

module.exports = { createNodeLogger };
