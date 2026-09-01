import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as os from 'os';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  @HttpCode(HttpStatus.OK)
  getLiveness() {
    return {
      status: 'ok',
      probe: 'liveness',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);
      
      return {
        status: 'ok',
        probe: 'readiness',
        database: 'connected',
        timestamp: new Date().toISOString(),
        metrics: {
          cpu_load_avg: os.loadavg(),
          memory_total_mb: Math.round(totalMem / 1024 / 1024),
          memory_used_mb: Math.round(usedMem / 1024 / 1024),
          memory_usage_percent: memUsagePercent + '%',
          uptime_seconds: Math.floor(process.uptime()),
        }
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        probe: 'readiness',
        database: 'unreachable',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
