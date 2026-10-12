import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from '../logic/email.service';

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing email job: ${job.name} for ${job.data.email}`);
    
    try {
      if (job.name === 'send-verification') {
        await this.emailService.sendVerificationEmail(job.data.email, job.data.otp);
      } else if (job.name === 'send-password-reset') {
        await this.emailService.sendPasswordResetEmail(job.data.email, job.data.otp);
      }
      this.logger.log(`Email job ${job.name} completed for ${job.data.email}`);
    } catch (error) {
      this.logger.error(`Failed to process email job ${job.name}`, error);
      throw error; // Let BullMQ handle the retry
    }
  }
}
