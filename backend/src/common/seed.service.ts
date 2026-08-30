import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('Running auto-seed checks...');
    
    // Ensure default organization exists
    const defaultOrgId = '00000000-0000-0000-0000-000000000000';
    let org = await this.prisma.organization.findUnique({
      where: { id: defaultOrgId }
    });

    if (!org) {
      org = await this.prisma.organization.create({
        data: {
          id: defaultOrgId,
          name: 'Default Organization',
          slug: 'default-org',
        }
      });
      this.logger.log('Created Default Organization.');
    }

    // Removed Notice Board v1.0.0 seeding as per user request to delete it permanently.

    this.logger.log('Auto-seed completed.');
  }
}
