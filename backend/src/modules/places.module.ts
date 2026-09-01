import { Module } from '@nestjs/common';
import { PlacesService } from '../logic/places.service';
import { PlacesController } from '../api/places.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlacesController],
  providers: [PlacesService],
})
export class PlacesModule {}
