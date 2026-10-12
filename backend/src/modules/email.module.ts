import { Module } from '@nestjs/common';
import { EmailService } from '../logic/email.service';
import { EmailProcessor } from '../queue/email.processor';
import { EmailListener } from '../events/email.listener';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  providers: [EmailService, EmailProcessor, EmailListener],
  exports: [EmailService],
})
export class EmailModule {}
