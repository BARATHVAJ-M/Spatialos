import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IPlacesRepository } from '../../core/contracts/places-repository.contract';
import { AppError } from '../../core/errors/app-error';

@Injectable()
export class PlacesPrismaRepository implements IPlacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<any[]> {
    try {
      return await this.prisma.place.findMany({
        where: { organizationId },
        include: {
          _count: {
            select: { experiences: { where: { status: 'PUBLISHED' } } },
          },
        },
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_PLACES_FIND_ALL_FAILED', e.message, 'places.prisma.repository.ts');
    }
  }

  async findById(organizationId: string, id: string): Promise<any | null> {
    try {
      return await this.prisma.place.findFirst({
        where: { id, organizationId },
        include: {
          experiences: {
            orderBy: { version: 'desc' },
          },
          children: true,
        },
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_PLACES_FIND_BY_ID_FAILED', e.message, 'places.prisma.repository.ts');
    }
  }

  async create(data: { organizationId: string; name: string; parentId?: string; qrTargetId: string }): Promise<any> {
    try {
      return await this.prisma.place.create({
        data: {
          organizationId: data.organizationId,
          name: data.name,
          parentId: data.parentId,
          qrTargetId: data.qrTargetId,
        },
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_PLACES_CREATE_FAILED', e.message, 'places.prisma.repository.ts');
    }
  }

  async update(id: string, data: { name?: string }): Promise<any> {
    try {
      return await this.prisma.place.update({
        where: { id },
        data,
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_PLACES_UPDATE_FAILED', e.message, 'places.prisma.repository.ts');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.place.delete({
        where: { id },
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_PLACES_DELETE_FAILED', e.message, 'places.prisma.repository.ts');
    }
  }
}
