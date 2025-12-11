import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

export interface LoggerOptions {
  serviceName?: string;
  level?: string;
  logDir?: string;
  developerMode?: boolean;
}

export function createLogger(options: LoggerOptions = {}) {
  const serviceName = options.serviceName || 'harmonia';
  const level = options.level || process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
  const logDir = options.logDir || process.env.LOG_DIR || path.join(process.cwd(), 'tmp', 'logs');
  const developerMode = options.developerMode || process.env.DEVELOPER_LOGS === '1';

  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (e) {
      // ignore; directory may be created by container mount
    }
  }

  const format = winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${serviceName}] ${level}: ${message}${metaStr}`;
    })
  );

  const transports: winston.transport[] = [];

  // Console transport for all envs
  transports.push(
    new winston.transports.Console({
      level,
      format: winston.format.combine(
        winston.format.colorize({ all: !developerMode }),
        format
      ),
    })
  );

  // File transport always (for long-term logs) using daily rotation
  transports.push(
    new DailyRotateFile({
      level,
      dirname: logDir,
      filename: `${serviceName}-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '14d',
      format,
    })
  );

  // Optional MongoDB transport for centralized persistence if configured
  if (process.env.MONGO_LOG_URI) {
    try {
      // Use require to avoid type issues when package is not installed in some environments
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const MongoDBTransport = require('winston-mongodb').MongoDB;
      transports.push(
        new MongoDBTransport({
          level: process.env.MONGO_LOG_LEVEL || level,
          db: process.env.MONGO_LOG_URI,
          collection: process.env.MONGO_LOG_COLLECTION || 'logs',
          tryReconnect: true,
          options: { useUnifiedTopology: true },
        })
      );
    } catch (e) {
      // If winston-mongodb is not available, continue without Mongo transport
      // Console-level debug helpful in dev
      // eslint-disable-next-line no-console
      console.warn('winston-mongodb transport not available, skipping Mongo transport for logs');
    }
  }

  const logger = winston.createLogger({
    level,
    defaultMeta: { service: serviceName },
    transports,
    exitOnError: false,
  });

  return logger;
}
