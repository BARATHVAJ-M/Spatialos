import { Module } from '@nestjs/common';
import { ActionsService } from '../logic/actions.service';
import { ActionsController } from '../api/actions.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActionsController],
  providers: [ActionsService],
})
export class ActionsModule {}
