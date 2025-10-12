import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('healthz')
  async healthz() {
    const status = {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: 'unknown' as 'up' | 'down' | 'unknown',
      },
    };

    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      status.checks.database = 'up';
      return status;
    } catch (error) {
      status.checks.database = 'down';
      throw new ServiceUnavailableException({
        ...status,
        status: 'error' as const,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
