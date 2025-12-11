import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  constructor(private readonly configService: ConfigService) {}

  private get orchestratorUrl(): string {
    return this.configService.get<string>('ORCHESTRATOR_URL') || 'http://localhost:4000';
  }

  async generateSong(payload: Record<string, any>, requestId?: string) {
    try {
      const headers: any = {};
      if (requestId) headers['X-Request-Id'] = requestId;
      const resp = await axios.post(`${this.orchestratorUrl}/compose`, payload, { timeout: 60_000, headers });
      return resp.data;
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Orchestrator request failed: ${msg}`);
      throw err;
    }
  }

  async submitJob(payload: Record<string, any>, requestId?: string) {
    try {
      const headers: any = {};
      if (requestId) headers['X-Request-Id'] = requestId;
      const resp = await axios.post(`${this.orchestratorUrl}/jobs`, payload, { timeout: 5_000, headers });
      return resp.data; // { jobId }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Orchestrator job submit failed: ${msg}`);
      throw err;
    }
  }
}

export default OrchestratorService;
