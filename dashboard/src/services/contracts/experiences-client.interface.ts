import { Result } from '../../core/results/result';
import { DashboardError } from '../../core/errors/dashboard-error';
import { Experience, CreateExperienceDto, UpdateExperienceDto, ExperienceNode, ServiceInstance } from '../../types/api';

export interface IExperiencesClientService {
  getAll(): Promise<Result<Experience[], DashboardError>>;
  getById(id: string): Promise<Result<Experience, DashboardError>>;
  create(dto: CreateExperienceDto): Promise<Result<Experience, DashboardError>>;
  update(id: string, dto: UpdateExperienceDto): Promise<Result<Experience, DashboardError>>;
  publish(id: string): Promise<Result<Experience, DashboardError>>;
  rollback(id: string): Promise<Result<Experience, DashboardError>>;
  updateNodes(id: string, nodes: ExperienceNode[]): Promise<Result<void, DashboardError>>;
  updateServiceInstances(id: string, instances: ServiceInstance[]): Promise<Result<void, DashboardError>>;
  delete(id: string): Promise<Result<void, DashboardError>>;
}
