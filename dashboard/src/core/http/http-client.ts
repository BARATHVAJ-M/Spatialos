import { IHttpClient } from './http-client.interface';
import { Result } from '../results/result';
import { DashboardError } from '../errors/dashboard-error';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export class HttpClient implements IHttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private resolveUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (
      cleanEndpoint.startsWith('/auth') ||
      cleanEndpoint.startsWith('/v1/admin') ||
      cleanEndpoint.startsWith('/v1/user') ||
      cleanEndpoint.startsWith('/health') ||
      cleanEndpoint.startsWith('/media')
    ) {
      return `${this.baseUrl}${cleanEndpoint}`;
    }
    return `${this.baseUrl}/v1/admin${cleanEndpoint}`;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('spatial_auth_token');
    } catch {
      return null;
    }
  }

  private getFetchFn() {
    return typeof fetch !== 'undefined' ? fetch : (globalThis as any).fetch;
  }

  private createHeaders(init?: HeadersInit): Headers {
    const HeadersClass = typeof Headers !== 'undefined' ? Headers : (globalThis as any).Headers;
    return new HeadersClass(init);
  }

  private isFormData(body: unknown): boolean {
    const FormDataClass = typeof FormData !== 'undefined' ? FormData : (globalThis as any).FormData;
    return FormDataClass ? body instanceof FormDataClass : false;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<Result<T, DashboardError>> {
    const url = this.resolveUrl(endpoint);
    const headers = this.createHeaders(options.headers);

    if (!this.isFormData(options.body) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.getAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const fetchFn = this.getFetchFn();
      const response = await fetchFn(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
          try {
            localStorage.removeItem('spatial_auth_token');
            document.cookie = 'spatial_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            window.location.href = '/login';
          } catch {
            // Browser environment fallback
          }
        }

        const errorPayload = await response.json().catch(() => null);
        const errorMessage = errorPayload?.message || errorPayload?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        const errorCode = errorPayload?.code || `HTTP_${response.status}`;

        return Result.fail(
          DashboardError.http(
            errorCode,
            errorMessage,
            response.status,
            { endpoint, payload: errorPayload }
          )
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return Result.ok<T>(data as T);
      }

      return Result.ok<T>(null as unknown as T);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network failure';
      return Result.fail(
        DashboardError.http(
          'NETWORK_FAILURE',
          `Network request to ${endpoint} failed: ${message}`,
          undefined,
          { endpoint, rawError: String(err) }
        )
      );
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<Result<T, DashboardError>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<Result<T, DashboardError>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<Result<T, DashboardError>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<Result<T, DashboardError>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<Result<T, DashboardError>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<Result<T, DashboardError>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
  }
}

export const httpClient = new HttpClient();
