/**
 * Harmonia Backend Server
 *
 * NestJS application entry point with:
 * - Global validation pipe for DTO validation
 * - CORS enabled for frontend communication
 * - API prefix `/api` for all routes
 * - Swagger/OpenAPI documentation
 * - Environment-based configuration
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestWinstonLogger } from '../../../libs/logging/src/lib/nest-logger.service';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Replace Nest default logger with our Winston-backed logger
  const rootLogger = new NestWinstonLogger('api');
  app.useLogger(rootLogger);

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('Harmonia API')
    .setDescription('Comprehensive API for Harmonia Music Generation Platform')
    .setVersion('1.0.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('songs', 'Song generation and management')
    .addTag('health', 'Health check endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Global API prefix
  const globalPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  });

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable type coercion
      },
    })
  );

  // If API debug mode is enabled via env var, wire a request/response logger
  // Add request ID middleware first so debug logs can include it
  app.use((req: Request, res: Response, next: NextFunction) => {
    try {
      const headerId = (req.headers['x-request-id'] as string) || '';
      const reqId = headerId || (globalThis as any).crypto?.randomUUID?.() || crypto.randomUUID();
      (req as any).requestId = reqId;
      res.setHeader('X-Request-Id', reqId);
    } catch (e) {
      // ignore
    }
    next();
  });

  // If API debug mode is enabled via env var, wire a request/response logger
  if (process.env.API_DEBUG_COMMANDS === '1') {
    const apiLogger = new Logger('API-DEBUG');
    const MAX_LEN = parseInt(process.env.API_DEBUG_MAX_BODY_LEN || '2000', 10);
    app.use((req: Request, res: Response, next: NextFunction) => {
      // Sanitize headers
      const headers = { ...req.headers };
      if (headers.authorization) headers.authorization = '[REDACTED]';
      if (headers.cookie) headers.cookie = '[REDACTED]';

      // Log incoming request basic info and (truncated) body
      try {
        const bodyStr = req.body && Object.keys(req.body || {}).length ? JSON.stringify(req.body) : '';
        apiLogger.log(`Incoming request: ${req.method} ${req.originalUrl} headers=${JSON.stringify(headers)} body=${(bodyStr || '').slice(0, MAX_LEN)}`);
      } catch (e) {
        apiLogger.log(`Incoming request: ${req.method} ${req.originalUrl}`);
      }

      // Monkey-patch res.send and res.json to capture response body
      const originalSend = res.send.bind(res);
      (res as any).send = (body?: any) => {
        try {
          let payload = body;
          // If body is a Buffer, convert to string (but don't try to stringify huge buffers)
          if (Buffer.isBuffer(body)) {
            payload = body.toString('utf8').slice(0, MAX_LEN);
          } else if (typeof body === 'object') {
            try {
              payload = JSON.stringify(body);
            } catch (e) {
              payload = String(body);
            }
            if (typeof payload === 'string' && payload.length > MAX_LEN) payload = `${payload.slice(0, MAX_LEN)}...`;
          } else if (typeof body === 'string' && body.length > MAX_LEN) {
            payload = `${body.slice(0, MAX_LEN)}...`;
          }
          apiLogger.log(`Response payload for ${req.method} ${req.originalUrl} status=${res.statusCode} payload=${payload}`);
        } catch (err) {
          apiLogger.log(`Response for ${req.method} ${req.originalUrl} status=${res.statusCode} (payload omitted)`);
        }
        return originalSend(body);
      };

      // Also capture final status
      res.on('finish', () => {
        apiLogger.log(`Response ${res.statusCode} for ${req.method} ${req.originalUrl}`);
      });
      next();
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  Logger.log(
    `📚 Auth endpoints: http://localhost:${port}/${globalPrefix}/auth`
  );
}

bootstrap();
