import { IContentClientService } from './contracts/content-client.interface';
import { IHttpClient } from '../core/http/http-client.interface';
import { httpClient } from '../core/http/http-client';
import { Result } from '../core/results/result';
import { DashboardError } from '../core/errors/dashboard-error';

export class ContentClientService implements IContentClientService {
  constructor(private readonly http: IHttpClient = httpClient) {}

  async getAll(): Promise<Result<any[], DashboardError>> {
    const res = await this.http.get<any[]>('/content');
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('CONTENT_FETCH_FAILED', res.error.message, 'content.service.ts', res.error.details)
      );
    }
    return Result.ok(res.value || []);
  }

  async upload(file: File): Promise<Result<any, DashboardError>> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await this.http.upload<any>('/content/upload', formData);
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('CONTENT_UPLOAD_FAILED', res.error.message, 'content.service.ts', res.error.details)
      );
    }
    return Result.ok(res.value);
  }

  async delete(id: string): Promise<Result<void, DashboardError>> {
    const res = await this.http.delete<void>(`/content/${id}`);
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('CONTENT_DELETE_FAILED', res.error.message, 'content.service.ts', res.error.details)
      );
    }
    return Result.ok(undefined);
  }
}

export const contentService = new ContentClientService();
