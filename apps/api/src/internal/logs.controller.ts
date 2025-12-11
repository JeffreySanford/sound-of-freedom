import { Controller, Post, Body, Logger, Get, Query, Delete, Req, ForbiddenException } from '@nestjs/common';
import { LogsService } from './logs.service';
import type { Request } from 'express';
import path from 'path';

export interface FrontendLogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  meta?: any;
  timestamp?: string;
  developer?: boolean;
}

@Controller('internal/logs')
export class LogsController {
  private readonly logger = new Logger(LogsController.name);
  constructor(private readonly logsService: LogsService) {}

  @Post()
  async receive(@Body() entry: FrontendLogEntry) {
    const { level, message, meta, developer, timestamp } = entry || {};
    const metaStr = meta ? JSON.stringify(meta) : '';
    const ts = timestamp || new Date().toISOString();
    const ctx = { developer, timestamp: ts } as any;
    switch (level) {
      case 'debug':
        this.logger.debug(`${message} ${metaStr}`, ctx);
        break;
      case 'warn':
        this.logger.warn(`${message} ${metaStr}`, ctx);
        break;
      case 'error':
        this.logger.error(`${message} ${metaStr}`, ctx);
        break;
      default:
        this.logger.log(`${message} ${metaStr}`, ctx);
        break;
    }
    return { ok: true };
  }

  private checkAdmin(req: Request) {
    const header = (req.headers['authorization'] as string) || (req.headers['x-admin-logs-token'] as string) || '';
    const token = header.startsWith('Bearer ') ? header.split(' ')[1] : header;
    if (!process.env.ADMIN_LOGS_TOKEN) {
      // If no admin token configured, deny deletion/querying for safety
      throw new ForbiddenException('Admin logs token not configured');
    }
    if (!token || token !== process.env.ADMIN_LOGS_TOKEN) {
      throw new ForbiddenException('Invalid admin logs token');
    }
    return true;
  }

  @Get()
  async list(@Req() req: Request, @Query('level') level?: string, @Query('service') service?: string, @Query('start') start?: string, @Query('end') end?: string, @Query('limit') limit?: string, @Query('skip') skip?: string) {
    this.checkAdmin(req);
    const res = await this.logsService.query({ level, service, start, end, limit: limit ? parseInt(limit, 10) : undefined, skip: skip ? parseInt(skip, 10) : undefined });
    return res;
  }

  @Get('health')
  async health(@Req() req: Request) {
    this.checkAdmin(req);
    return this.logsService.stats();
  }

  @Delete()
  async clear(@Req() req: Request, @Query('before') before?: string, @Query('service') service?: string) {
    this.checkAdmin(req);
    const res = await this.logsService.delete({ before, service });
    return res;
  }

  @Get('files')
  async files(@Req() req: Request, @Query('service') service?: string) {
    this.checkAdmin(req);
    const files = await this.logsService.listFiles(undefined, service || undefined);
    return { files };
  }

  @Get('files/tail')
  async tail(
    @Req() req: Request,
    @Query('file') file?: string,
    @Query('lines') lines?: string
  ) {
    this.checkAdmin(req);
    if (!file) return { error: 'file query param required' };
    const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'tmp', 'logs');
    const requestedPath = path.resolve(logDir, file);
    // Ensure requested file is inside our log dir (prevent path traversal)
    if (!requestedPath.startsWith(path.resolve(logDir))) {
      return { error: 'Invalid file path' };
    }
    const maxLines = Number(process.env.LOG_TAIL_MAX_LINES || 500);
    const maxBytes = Number(process.env.LOG_TAIL_MAX_BYTES || 200 * 1024);
    const tailLines = Math.min(maxLines, lines ? Math.max(1, parseInt(lines, 10)) : 200);
    const content = await this.logsService.tailFile(requestedPath, tailLines, maxBytes);
    return { content };
  }
}
