import { Module } from '@nestjs/common';
import { ExperiencesService } from '../logic/experiences.service';
import { PlacementsService } from '../logic/placements.service';
import { ExperiencesController } from '../api/experiences.controller';
import { PlacementsController } from '../api/placements.controller';
import { PrismaModule } from '../database/prisma.module';
import { ContentModule } from './content.module';

import { IExperiencesService } from '../core/contracts/experiences-service.contract';
import { IPlacementsService } from '../core/contracts/placements-service.contract';

@Module({
  imports: [PrismaModule, ContentModule],
  controllers: [ExperiencesController, PlacementsController],
  providers: [
    ExperiencesService,
    { provide: IExperiencesService, useClass: ExperiencesService },
    PlacementsService,
    { provide: IPlacementsService, useClass: PlacementsService },
  ],
  exports: [ExperiencesService, IExperiencesService, PlacementsService, IPlacementsService],
})
export class ExperiencesModule {}
