import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BackgroundJobsProcessor } from '../queue/background-jobs.processor';
import { GarbageCollectorService } from '../logic/garbage-collector.service';
import { StaffModule } from './staff.module';
import { ContentModule } from './content.module';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'background-jobs',
    }),
    StaffModule,
    ContentModule,
    PrismaModule,
  ],
  providers: [BackgroundJobsProcessor, GarbageCollectorService],
  exports: [GarbageCollectorService],
})
export class JobsModule {}
