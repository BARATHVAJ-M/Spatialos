import { Module } from '@nestjs/common';
import { ExperiencesService } from './experiences.service';
import { ExperiencesController } from './experiences.controller';
import { PlacementsController } from './placements.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExperiencesController, PlacementsController],
  providers: [ExperiencesService],
})
export class ExperiencesModule {}
