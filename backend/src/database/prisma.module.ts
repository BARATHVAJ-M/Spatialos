import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IExperiencesRepository } from '../core/contracts/experiences-repository.contract';
import { ExperiencesPrismaRepository } from './repositories/experiences.prisma.repository';
import { IPlacesRepository } from '../core/contracts/places-repository.contract';
import { PlacesPrismaRepository } from './repositories/places.prisma.repository';
import { IPlacementsRepository } from '../core/contracts/placements-repository.contract';
import { PlacementsPrismaRepository } from './repositories/placements.prisma.repository';
import { IContentRepository } from '../core/contracts/content-repository.contract';
import { ContentPrismaRepository } from './repositories/content.prisma.repository';
import { AuthRepository } from './repositories/auth.repository';
import { StaffRepository } from './repositories/staff.repository';

const repositories = [
  { provide: IExperiencesRepository, useClass: ExperiencesPrismaRepository },
  { provide: IPlacesRepository, useClass: PlacesPrismaRepository },
  { provide: IPlacementsRepository, useClass: PlacementsPrismaRepository },
  { provide: IContentRepository, useClass: ContentPrismaRepository },
  AuthRepository,
  StaffRepository,
];

@Global()
@Module({
  providers: [PrismaService, ...repositories],
  exports: [PrismaService, ...repositories],
})
export class PrismaModule {}
