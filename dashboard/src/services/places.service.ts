import { IPlacesClientService } from './contracts/places-client.interface';
import { IHttpClient } from '../core/http/http-client.interface';
import { httpClient } from '../core/http/http-client';
import { Result } from '../core/results/result';
import { DashboardError } from '../core/errors/dashboard-error';
import { Place, CreatePlaceDto, UpdatePlaceDto } from '../types/api';

export class PlacesClientService implements IPlacesClientService {
  constructor(private readonly http: IHttpClient = httpClient) {}

  async getAll(): Promise<Result<Place[], DashboardError>> {
    const res = await this.http.get<Place[]>('/places');
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('PLACES_FETCH_FAILED', res.error.message, 'places.service.ts', res.error.details)
      );
    }
    return Result.ok(res.value || []);
  }

  async getById(id: string): Promise<Result<Place, DashboardError>> {
    const res = await this.http.get<Place>(`/places/${id}`);
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('PLACE_GET_FAILED', res.error.message, 'places.service.ts', res.error.details)
      );
    }
    return Result.ok(res.value);
  }

  async create(dto: CreatePlaceDto): Promise<Result<Place, DashboardError>> {
    const res = await this.http.post<Place>('/places', dto);
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('PLACE_CREATE_FAILED', res.error.message, 'places.service.ts', res.error.details)
      );
    }
    return Result.ok(res.value);
  }

  async update(id: string, dto: UpdatePlaceDto): Promise<Result<Place, DashboardError>> {
    const res = await this.http.patch<Place>(`/places/${id}`, dto);
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('PLACE_UPDATE_FAILED', res.error.message, 'places.service.ts', res.error.details)
      );
    }
    return Result.ok(res.value);
  }

  async delete(id: string): Promise<Result<void, DashboardError>> {
    const res = await this.http.delete<void>(`/places/${id}`);
    if (!res.ok) {
      return Result.fail(
        DashboardError.service('PLACE_DELETE_FAILED', res.error.message, 'places.service.ts', res.error.details)
      );
    }
    return Result.ok(undefined);
  }
}

export const placesService = new PlacesClientService();
