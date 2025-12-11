import { Controller, Post, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ApiTags } from '@nestjs/swagger';

class ServiceTokenDto {
  sub: string;
  role?: string;
  expiresIn?: string;
}

@Controller('auth/service-tokens')
@ApiTags('auth')
export class ServiceTokensController {
  constructor(private readonly jwtService: JwtService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: any, @Body() body: ServiceTokenDto) {
    // Only allow admin users to create service tokens
    const user = req.user as any;
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Only admin users can create service tokens');
    }
    const role = body.role || 'orchestrator';
    const sub = body.sub || 'orchestrator-service';
    const expiresIn = body.expiresIn || '365d';
    const payload = { sub, role };
    // signAsync types can be picky with jwt version/type mismatches; cast for safety
    const token = await this.jwtService.signAsync(payload as any, { expiresIn: expiresIn as any });
    return { token, expiresIn, sub, role };
  }
}

export default ServiceTokensController;
