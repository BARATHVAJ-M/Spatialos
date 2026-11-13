import { IAuthClientService } from './contracts/auth-client.interface';
import { IHttpClient } from '../core/http/http-client.interface';
import { httpClient } from '../core/http/http-client';
import { Result } from '../core/results/result';
import { DashboardError } from '../core/errors/dashboard-error';
import { LoginDto } from '../types/api';

interface BackendAuthResponse {
  success: boolean;
  data: {
    token: string;
    user?: {
      id: string;
      email: string;
      role: string;
      name?: string;
    };
  };
}

export class AuthClientService implements IAuthClientService {
  constructor(private readonly http: IHttpClient = httpClient) {}

  async login(credentials: LoginDto): Promise<Result<{ token: string; user?: any }, DashboardError>> {
    const res = await this.http.post<BackendAuthResponse>('/auth/login', credentials);
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('LOGIN_FAILED', res.error.message, 'auth.service.ts', res.error.details)
      );
    }

    const payload = res.value;
    if (!payload?.data?.token) {
      return Result.fail(
        DashboardError.service('INVALID_AUTH_PAYLOAD', 'Server returned success without a valid auth token.', 'auth.service.ts')
      );
    }

    const token = payload.data.token;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('spatial_auth_token', token);
        document.cookie = `spatial_auth_token=${token}; path=/; max-age=28800; samesite=strict`;
      } catch {
        // Fallback for non-standard browser storage
      }
    }

    return Result.ok({
      token,
      user: payload.data.user,
    });
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('spatial_auth_token');
        document.cookie = 'spatial_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      } catch {
        // Fallback
      }
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('spatial_auth_token');
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }
}

export const authService = new AuthClientService();
