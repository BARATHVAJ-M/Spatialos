import { Module } from '@nestjs/common';
import { SettingsController } from '../api/settings.controller';
import { SettingsService } from '../logic/settings.service';
import { EmailService } from '../logic/email.service';
import { PrismaModule } from '../database/prisma.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'background-jobs',
    }),
  ],
  controllers: [SettingsController],
  providers: [SettingsService, EmailService],
})
export class SettingsModule {}
