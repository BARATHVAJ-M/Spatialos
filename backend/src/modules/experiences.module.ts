import { Module } from '@nestjs/common';
import { ExperiencesService } from '../logic/experiences.service';
import { ExperiencesController } from '../api/experiences.controller';
import { PlacementsController } from '../api/placements.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExperiencesController, PlacementsController],
  providers: [ExperiencesService],
})
export class ExperiencesModule {}
