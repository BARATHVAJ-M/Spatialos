import { Module } from '@nestjs/common';
import { DefinitionsController } from './definitions.controller';
import { DefinitionsService } from './definitions.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DefinitionsController],
  providers: [DefinitionsService]
})
export class DefinitionsModule {}
