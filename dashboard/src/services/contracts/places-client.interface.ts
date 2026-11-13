import { Result } from '../../core/results/result';
import { DashboardError } from '../../core/errors/dashboard-error';
import { Place, CreatePlaceDto, UpdatePlaceDto } from '../../types/api';

export interface IPlacesClientService {
  getAll(): Promise<Result<Place[], DashboardError>>;
  getById(id: string): Promise<Result<Place, DashboardError>>;
  create(dto: CreatePlaceDto): Promise<Result<Place, DashboardError>>;
  update(id: string, dto: UpdatePlaceDto): Promise<Result<Place, DashboardError>>;
  delete(id: string): Promise<Result<void, DashboardError>>;
}
