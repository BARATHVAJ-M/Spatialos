import { Result } from '../results/result';
import { DashboardError } from '../errors/dashboard-error';

export interface IHttpClient {
  get<T>(endpoint: string, options?: RequestInit): Promise<Result<T, DashboardError>>;
  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<Result<T, DashboardError>>;
  put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<Result<T, DashboardError>>;
  patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<Result<T, DashboardError>>;
  delete<T>(endpoint: string, options?: RequestInit): Promise<Result<T, DashboardError>>;
  upload<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<Result<T, DashboardError>>;
}
