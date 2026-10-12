import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

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
          name: 'Jeppiaar Engineering College',
          slug: 'jeppiaar-eng-college',
          supportEmail: 'paanda.group@gmail.com',
          domainContext: 'education',
          settings: { notifications: { emailAlerts: true, inAppAlerts: true } }
        }
      });
      this.logger.log('Created Jeppiaar Engineering College Organization.');
    } else {
      // Upsert to ensure it has the new fields even if it exists
      await this.prisma.organization.update({
        where: { id: defaultOrgId },
        data: {
          name: 'Jeppiaar Engineering College',
          slug: 'jeppiaar-eng-college',
          supportEmail: 'paanda.group@gmail.com',
          domainContext: 'education'
        }
      });
    }

    // Ensure default admin exists
    const adminEmail = 'admin@spatialos.com';
    let admin = await this.prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);
      await this.prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Super Admin',
          passwordHash: hash,
          role: 'ADMIN',
          organizationId: defaultOrgId
        }
      });
      this.logger.log('Created default admin user: admin@spatialos.com / admin123');
    }

    const servicesToSeed = [
      { name: 'Classroom', category: 'Academic', description: 'Schedule and details for a specific classroom.' },
      { name: 'Complaint Box', category: 'Communication', description: 'Secure, anonymous grievance submission portal.' },
      { name: 'Staff Details', category: 'Staff', description: 'Profile, contact, and timetable for a staff member.' }
    ];

    for (const srv of servicesToSeed) {
      const existing = await this.prisma.serviceDefinition.findFirst({
        where: { name: srv.name, organizationId: defaultOrgId }
      });
      if (!existing) {
        await this.prisma.serviceDefinition.create({
          data: {
            organizationId: defaultOrgId,
            name: srv.name,
            version: '1.0.0',
            category: srv.category,
            description: srv.description,
            configurationSchema: {},
            contentSchema: {},
            payloadSchema: {}
          }
        });
        this.logger.log(`Seeded Service Definition: ${srv.name}`);
      }
    }

    this.logger.log('Auto-seed completed.');
  }
}
