import { IExperiencesClientService } from './contracts/experiences-client.interface';
import { IHttpClient } from '../core/http/http-client.interface';
import { httpClient } from '../core/http/http-client';
import { Result } from '../core/results/result';
import { DashboardError } from '../core/errors/dashboard-error';
import { Experience, CreateExperienceDto, UpdateExperienceDto, ExperienceNode, ServiceInstance } from '../types/api';

export class ExperiencesClientService implements IExperiencesClientService {
  constructor(private readonly http: IHttpClient = httpClient) {}

  async getAll(): Promise<Result<Experience[], DashboardError>> {
    const res = await this.http.get<Experience[]>('/experiences');
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('EXPERIENCES_FETCH_FAILED', res.error.message, 'experiences.service.ts', res.error.details)
      );
    }
    return Result.ok(res.value || []);
  }

  async getById(id: string): Promise<Result<Experience, DashboardError>> {
    const res = await this.http.get<Experience>(`/experiences/${id}`);
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('EXPERIENCE_GET_FAILED', res.error.message, 'experiences.service.ts', res.error.details)
      );
    }
    return Result.ok(res.value);
  }

  async create(dto: CreateExperienceDto): Promise<Result<Experience, DashboardError>> {
    const res = await this.http.post<Experience>('/experiences', dto);
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('EXPERIENCE_CREATE_FAILED', res.error.message, 'experiences.service.ts', res.error.details)
      );
    }
    return Result.ok(res.value);
  }

  async update(id: string, dto: UpdateExperienceDto): Promise<Result<Experience, DashboardError>> {
    const res = await this.http.put<Experience>(`/experiences/${id}`, dto);
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('EXPERIENCE_UPDATE_FAILED', res.error.message, 'experiences.service.ts', res.error.details)
      );
    }
    return Result.ok(res.value);
  }

  async publish(id: string): Promise<Result<Experience, DashboardError>> {
    const res = await this.http.post<Experience>(`/experiences/${id}/publish`);
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('EXPERIENCE_PUBLISH_FAILED', res.error.message, 'experiences.service.ts', res.error.details)
      );
    }
    return Result.ok(res.value);
  }

  async rollback(id: string): Promise<Result<Experience, DashboardError>> {
    const res = await this.http.post<Experience>(`/experiences/${id}/rollback`);
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('EXPERIENCE_ROLLBACK_FAILED', res.error.message, 'experiences.service.ts', res.error.details)
      );
    }
    return Result.ok(res.value);
  }

  async updateNodes(id: string, nodes: ExperienceNode[]): Promise<Result<void, DashboardError>> {
    const res = await this.http.put<void>(`/experiences/${id}/nodes`, { nodes });
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('EXPERIENCE_NODES_UPDATE_FAILED', res.error.message, 'experiences.service.ts', res.error.details)
      );
    }
    return Result.ok(undefined);
  }

  async updateServiceInstances(id: string, instances: ServiceInstance[]): Promise<Result<void, DashboardError>> {
    const res = await this.http.put<void>(`/experiences/${id}/services`, { instances });
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('EXPERIENCE_SERVICES_UPDATE_FAILED', res.error.message, 'experiences.service.ts', res.error.details)
      );
    }
    return Result.ok(undefined);
  }

  async delete(id: string): Promise<Result<void, DashboardError>> {
    const res = await this.http.delete<void>(`/experiences/${id}`);
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('EXPERIENCE_DELETE_FAILED', res.error.message, 'experiences.service.ts', res.error.details)
      );
    }
    return Result.ok(undefined);
  }
}

export const experiencesService = new ExperiencesClientService();
