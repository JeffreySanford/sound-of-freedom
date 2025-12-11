import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, Logger, Headers, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { JobsGateway } from './gateways/jobs.gateway';
import { JobsService } from '../jobs/jobs.service';
import { JwtService } from '@nestjs/jwt';

@Controller('jobs')
export class JobsController {
  private readonly logger = new Logger(JobsController.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly jobsGateway: JobsGateway,
    private readonly jobsService: JobsService,
    private readonly jwtService: JwtService,
  ) {}

  private get orchestratorUrl(): string {
    return this.configService.get<string>('ORCHESTRATOR_URL') || 'http://orchestrator:4000';
  }

  @HttpCode(HttpStatus.OK)
  @Post('report')
  async report(@Headers('authorization') authHeader: string | undefined, @Body() body: any, @Headers('x-request-id') requestId?: string) {
    const { jobId, type, progress, payload } = body;
    if (!jobId || !type) return { error: 'Missing jobId or type' };
    // If the orchestrator provides a token, validate its role
    try {
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const payloadToken: any = this.jwtService.verify(token);
        if (!payloadToken || !['orchestrator', 'system', 'worker'].includes(payloadToken.role)) {
          throw new UnauthorizedException('Invalid orchestrator token');
        }
      }
    } catch (err: any) {
      const strict = this.configService.get<string>('REQUIRE_ORCHESTRATOR_JWT') === '1' || process.env.REQUIRE_ORCHESTRATOR_JWT === '1' || (this.configService.get<string>('NODE_ENV') === 'production' || process.env.NODE_ENV === 'production');
      const message = (err && err.message) || String(err);
      if (strict) {
        this.logger.warn('Rejecting invalid orchestrator token on jobs.report: ' + message);
        throw new UnauthorizedException('Invalid orchestrator token');
      }
      this.logger.warn('Invalid or missing orchestrator token on jobs.report (continuing): ' + message);
      // Not throwing to maintain backward compatibility for local PoC; for production, fail the request.
    }
    switch (type) {
      case 'status':
        this.jobsGateway.emitJobStatus(jobId, payload?.status || 'unknown');
        break;
      case 'progress':
        this.jobsGateway.emitJobProgress(jobId, progress);
        break;
      case 'completed':
        this.jobsGateway.emitJobCompleted(payload.job || payload);
        break;
      case 'failed':
        this.jobsGateway.emitJobFailed(jobId, payload?.userId || 'unknown', payload?.error || 'error');
        break;
      default:
        break;
    }
    try {
      // Persist updates to job record
      if (jobId) {
        const patch: any = {};
        if (type === 'status' && payload?.status) patch.status = payload.status;
        if (type === 'progress' && typeof progress !== 'undefined') patch.progress = progress;
        if (type === 'completed') {
          patch.status = 'completed';
          if (payload?.artifactUrl) patch.artifactUrl = payload.artifactUrl;
          if (payload?.result) patch.result = payload.result;
          patch.completedAt = new Date();
        }
        if (type === 'failed') {
          patch.status = 'failed';
          patch.error = payload?.error || 'failed';
          patch.completedAt = new Date();
        }
        if (Object.keys(patch).length > 0) {
          if (requestId) patch.requestId = requestId;
          try {
            await this.jobsService.updateJob(jobId, patch);
          } catch (err: any) {
            this.logger.warn(`Failed to persist job update for ${jobId}: ${((err && err.message) || String(err))}`);
          }
        }
      }
    } catch (err: any) {
      this.logger.error('Error while handling job report', (err && err.message) || String(err));
    }
    return { ok: true };
  }

  @Get(':id')
  async getJob(@Param('id') id: string) {
    try {
      const persisted = await this.jobsService.findJobById(id);
      if (persisted) return persisted;
      const resp = await axios.get(`${this.orchestratorUrl}/jobs/${id}`, { timeout: 5_000 });
      return resp.data;
    } catch (err: any) {
      return { error: 'Failed to fetch job from orchestrator', details: (err && err.message) || String(err) };
    }
  }
}

export default JobsController;
