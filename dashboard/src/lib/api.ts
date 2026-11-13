// Backwards-compatible API adapter delegating to the unified Layer 4 HttpClient
import { httpClient, BASE_URL } from '../core/http/http-client';

export { BASE_URL };

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  
  let result;
  if (method === 'GET') {
    result = await httpClient.get<T>(endpoint, options);
  } else if (method === 'POST') {
    if (options.body instanceof FormData) {
      result = await httpClient.upload<T>(endpoint, options.body, options);
    } else {
      const parsedBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      result = await httpClient.post<T>(endpoint, parsedBody, options);
    }
  } else if (method === 'PUT') {
    const parsedBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    result = await httpClient.put<T>(endpoint, parsedBody, options);
  } else if (method === 'PATCH') {
    const parsedBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    result = await httpClient.patch<T>(endpoint, parsedBody, options);
  } else if (method === 'DELETE') {
    result = await httpClient.delete<T>(endpoint, options);
  } else {
    result = await httpClient.get<T>(endpoint, options);
  }

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value as T;
}
