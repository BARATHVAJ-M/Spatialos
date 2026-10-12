import { Module } from '@nestjs/common';
import { StaffController } from '../api/staff.controller';
import { StaffService } from '../logic/staff.service';
import { StaffRepository } from '../database/repositories/staff.repository';
import { PrismaModule } from '../database/prisma.module';
import { ContentModule } from './content.module';
import { StaffSyncService } from '../logic/staff-sync.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule, 
    ContentModule,
    BullModule.registerQueue({
      name: 'background-jobs',
    }),
  ],
  controllers: [StaffController],
  providers: [StaffService, StaffRepository, StaffSyncService],
  exports: [StaffService, StaffRepository, StaffSyncService]
})
export class StaffModule {}
