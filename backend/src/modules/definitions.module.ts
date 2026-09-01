import { Module } from '@nestjs/common';
import { DefinitionsController } from '../api/definitions.controller';
import { DefinitionsService } from '../ar_services/definitions.service';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DefinitionsController],
  providers: [DefinitionsService]
})
export class DefinitionsModule {}
