import { LoggerService, Injectable } from '@nestjs/common';
import { createLogger } from './create-logger';
import type winston from 'winston';

@Injectable()
export class NestWinstonLogger implements LoggerService {
  private logger: winston.Logger;

  constructor(serviceName = 'harmonia') {
    this.logger = createLogger({ serviceName });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }
  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }
  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }
  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }
  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
