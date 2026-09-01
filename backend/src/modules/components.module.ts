import { Module } from '@nestjs/common';
import { ComponentsService } from '../logic/components.service';
import { ComponentsController } from '../api/components.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ComponentsController],
  providers: [ComponentsService],
})
export class ComponentsModule {}
