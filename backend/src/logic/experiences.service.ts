import { Injectable } from '@nestjs/common';
import { IExperiencesService } from '../core/contracts/experiences-service.contract';
import { IExperiencesRepository } from '../core/contracts/experiences-repository.contract';
import { ContentService } from './content.service';
import { AppError } from '../core/errors/app-error';

@Injectable()
export class ExperiencesService implements IExperiencesService {
  constructor(
    private readonly repo: IExperiencesRepository,
    private readonly contentService: ContentService,
  ) {}

  async findAll(organizationId: string) {
    return this.repo.findAll(organizationId);
  }

  async findOne(organizationId: string, id: string) {
    const experience = await this.repo.findById(organizationId, id);
    if (!experience) {
      throw AppError.domain('EXPERIENCE_NOT_FOUND', 'Experience not found', 'experiences.service.ts');
    }
    return experience;
  }

  async create(organizationId: string, placeId: string, name: string) {
    return this.repo.create({ organizationId, placeId, name });
  }

  async publish(organizationId: string, id: string) {
    const experience = await this.repo.findByIdBasic(organizationId, id);
    if (!experience) {
      throw AppError.domain('EXPERIENCE_NOT_FOUND', 'Experience not found', 'experiences.service.ts');
    }
    if (experience.status === 'PUBLISHED') {
      return experience;
    }
    return this.repo.publish(organizationId, id, experience.placeId, experience.version);
  }

  async rollback(organizationId: string, id: string) {
    const experience = await this.repo.findByIdBasic(organizationId, id);
    if (!experience) {
      throw AppError.domain('EXPERIENCE_NOT_FOUND', 'Experience not found', 'experiences.service.ts');
    }
    return this.repo.rollback(organizationId, experience.placeId, experience.version);
  }

  async updateNodes(organizationId: string, id: string, nodes: any[]) {
    const experience = await this.repo.findByIdBasic(organizationId, id);
    if (!experience) {
      throw AppError.domain('EXPERIENCE_NOT_FOUND', 'Experience not found', 'experiences.service.ts');
    }
    await this.repo.replaceSpatialNodes(id, nodes);
    return { success: true };
  }

  async updateServiceInstances(organizationId: string, id: string, instances: any[]) {
    const experience = await this.repo.findByIdBasic(organizationId, id);
    if (!experience) {
      throw AppError.domain('EXPERIENCE_NOT_FOUND', 'Experience not found', 'experiences.service.ts');
    }
    await this.repo.replaceServiceInstances(id, instances);
    return { success: true };
  }

  async update(orgId: string, id: string, data: any) {
    const exp = await this.repo.findByIdBasic(orgId, id);
    if (!exp) {
      throw AppError.domain('EXPERIENCE_NOT_FOUND', 'Experience not found', 'experiences.service.ts');
    }
    return this.repo.update(id, data);
  }

  async remove(orgId: string, id: string) {
    const exp = await this.repo.findByIdBasic(orgId, id);
    if (!exp) {
      throw AppError.domain('EXPERIENCE_NOT_FOUND', 'Experience not found', 'experiences.service.ts');
    }
    await this.repo.delete(id);
    return { success: true };
  }
}
