import { Result } from '../../core/results/result';
import { DashboardError } from '../../core/errors/dashboard-error';
import { LoginDto } from '../../types/api';

export interface IAuthClientService {
  login(credentials: LoginDto): Promise<Result<{ token: string; user?: any }, DashboardError>>;
  logout(): void;
  getToken(): string | null;
  isAuthenticated(): boolean;
}
