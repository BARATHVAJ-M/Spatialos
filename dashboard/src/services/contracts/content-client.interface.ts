import { Result } from '../../core/results/result';
import { DashboardError } from '../../core/errors/dashboard-error';

export interface IContentClientService {
  getAll(): Promise<Result<any[], DashboardError>>;
  upload(file: File): Promise<Result<any, DashboardError>>;
  delete(id: string): Promise<Result<void, DashboardError>>;
}
