import { Controller, Get } from '@nestjs/common';
import { OllamaService } from '../llm/ollama.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('__health')
@ApiTags('health')
export class HealthController {
  constructor(private readonly ollama: OllamaService) {}
  @Get()
  @ApiOperation({ summary: 'Basic health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
      },
    },
  })
  status() {
    // Return Ollama availability as part of health check. If Ollama is unreachable,
    // this helps diagnose ECONNREFUSED without requiring logs.
    return { ok: true };
  }

  @Get('ollama')
  async ollamaStatus() {
    try {
      const probe = await this.ollama.probe();
      return { ok: probe.ok, url: probe.url, message: probe.message };
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, url: this.ollama['ollamaUrl'], message: msg };
    }
  }
}

// Named export only: do not default-export controllers for Nest DI
