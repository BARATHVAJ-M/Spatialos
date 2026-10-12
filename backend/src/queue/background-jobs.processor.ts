import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { StaffSyncService } from '../logic/staff-sync.service';
import { GarbageCollectorService } from '../logic/garbage-collector.service';

@Processor('background-jobs')
export class BackgroundJobsProcessor extends WorkerHost {
  private readonly logger = new Logger(BackgroundJobsProcessor.name);

  constructor(
    private readonly staffSyncService: StaffSyncService,
    private readonly garbageCollectorService: GarbageCollectorService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing background job: ${job.name} (ID: ${job.id})`);
    
    try {
      if (job.name === 'sync-staff-csv') {
        const result = await this.staffSyncService.syncFromGoogleSheet(job.data.organizationId, job.data.csvUrl);
        return result;
      } else if (job.name === 'run-garbage-collection') {
        const result = await this.garbageCollectorService.runGarbageCollection(job.data.organizationId);
        return result;
      }
      
      this.logger.warn(`Unknown job name: ${job.name}`);
    } catch (error) {
      this.logger.error(`Failed to process background job ${job.name}`, error);
      throw error;
    }
  }
}
