import { Module } from '@nestjs/common';
import { PlacesService } from '../logic/places.service';
import { PlacesController } from '../api/places.controller';
import { PrismaModule } from '../database/prisma.module';

import { IPlacesService } from '../core/contracts/places-service.contract';

@Module({
  imports: [PrismaModule],
  controllers: [PlacesController],
  providers: [
    PlacesService,
    { provide: IPlacesService, useClass: PlacesService },
  ],
  exports: [PlacesService, IPlacesService],
})
export class PlacesModule {}
