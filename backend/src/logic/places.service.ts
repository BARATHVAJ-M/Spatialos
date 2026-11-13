import { Injectable } from '@nestjs/common';
import { IPlacesService } from '../core/contracts/places-service.contract';
import { IPlacesRepository } from '../core/contracts/places-repository.contract';
import { AppError } from '../core/errors/app-error';

@Injectable()
export class PlacesService implements IPlacesService {
  constructor(private readonly repo: IPlacesRepository) {}

  async findAll(organizationId: string) {
    return this.repo.findAll(organizationId);
  }

  async findOne(organizationId: string, id: string) {
    const place = await this.repo.findById(organizationId, id);
    if (!place) {
      throw AppError.domain('PLACE_NOT_FOUND', 'Place not found', 'places.service.ts');
    }
    return place;
  }

  async create(organizationId: string, name: string, parentId?: string) {
    if (parentId) {
      const parent = await this.repo.findById(organizationId, parentId);
      if (!parent) {
        throw AppError.domain('PARENT_PLACE_NOT_FOUND', 'Parent place not found', 'places.service.ts');
      }
    }
    const qrTargetId = `spatialos://resolve?id=${Math.random().toString(36).substring(7)}`;
    return this.repo.create({ organizationId, name, parentId, qrTargetId });
  }

  async update(organizationId: string, id: string, name: string) {
    const place = await this.repo.findById(organizationId, id);
    if (!place) {
      throw AppError.domain('PLACE_NOT_FOUND', 'Place not found', 'places.service.ts');
    }
    return this.repo.update(id, { name });
  }

  async remove(organizationId: string, id: string) {
    const place = await this.repo.findById(organizationId, id);
    if (!place) {
      throw AppError.domain('PLACE_NOT_FOUND', 'Place not found', 'places.service.ts');
    }
    await this.repo.delete(id);
    return { success: true };
  }
}
