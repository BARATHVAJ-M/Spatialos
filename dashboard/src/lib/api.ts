// Generic API Client

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ORG_ID = '00000000-0000-0000-0000-000000000000'; // Default org from seed

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const fullEndpoint = endpoint.startsWith('/auth') ? endpoint : `/v1/admin${endpoint}`;
  const url = `${BASE_URL}${fullEndpoint}`;
  
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Attach JWT token if available in the browser
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('spatial_auth_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      localStorage.removeItem('spatial_auth_token');
      document.cookie = 'spatial_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.href = '/login';
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `API request failed: ${response.statusText}`);
  }

  // Some endpoints might return empty (e.g. DELETE)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return null as unknown as T;
}
