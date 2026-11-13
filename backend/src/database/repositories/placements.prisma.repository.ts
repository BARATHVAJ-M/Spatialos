import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IPlacementsRepository } from '../../core/contracts/placements-repository.contract';
import { AppError } from '../../core/errors/app-error';

@Injectable()
export class PlacementsPrismaRepository implements IPlacementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findExperienceById(targetId: string): Promise<any | null> {
    try {
      return await this.prisma.experience.findFirst({
        where: { id: targetId },
        include: {
          spatialNodes: true,
          serviceInstances: { include: { serviceDefinition: true } },
        },
      });
    } catch (e: any) {
      // Return null on invalid UUID without throwing
      return null;
    }
  }

  async findPublishedExperienceByQrCode(qrCode: string): Promise<any | null> {
    try {
      const place = await this.prisma.place.findFirst({
        where: { qrTargetId: qrCode },
        include: {
          experiences: {
            where: { status: 'PUBLISHED' },
            include: {
              spatialNodes: true,
              serviceInstances: { include: { serviceDefinition: true } },
            },
            orderBy: { version: 'desc' },
            take: 1,
          },
        },
      });
      if (place && place.experiences && place.experiences.length > 0) {
        return place.experiences[0];
      }
      return null;
    } catch (e: any) {
      throw AppError.dataAccess('DB_PLACEMENTS_FIND_BY_QR_FAILED', e.message, 'placements.prisma.repository.ts');
    }
  }

  async getMiniAppData(serviceType: string, identifier: string): Promise<any> {
    try {
      if (serviceType === 'STAFF_DETAILS' && identifier) {
        return await this.prisma.staffDirectory.findFirst({
          where: { staffId: identifier },
        });
      }
      return null;
    } catch (e: any) {
      throw AppError.dataAccess('DB_PLACEMENTS_MINIAPP_DATA_FAILED', e.message, 'placements.prisma.repository.ts');
    }
  }
}
