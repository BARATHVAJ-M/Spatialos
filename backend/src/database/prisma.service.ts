import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.logger.log('Connecting to PostgreSQL database via Prisma...');
    try {
      await this.$connect();
      this.logger.log('Successfully connected to spatialos_db!');
    } catch (error) {
      this.logger.error('CRITICAL: Failed to connect to PostgreSQL database. Verify DATABASE_URL in .env.', error);
      process.exit(1); // Force failure so orchestrators can restart
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL database.');
  }
}
