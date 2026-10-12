import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailListener {
  private readonly logger = new Logger(EmailListener.name);

  constructor(@InjectQueue('email-queue') private emailQueue: Queue) {}

  @OnEvent('auth.registered')
  async handleUserRegisteredEvent(payload: { email: string; otp: string }) {
    this.logger.log(`Received auth.registered event for ${payload.email}`);
    await this.emailQueue.add('send-verification', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
  }

  @OnEvent('auth.password_reset')
  async handlePasswordResetEvent(payload: { email: string; otp: string }) {
    this.logger.log(`Received auth.password_reset event for ${payload.email}`);
    await this.emailQueue.add('send-password-reset', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
  }
}
