/**
 * Shared API Client & Configuration
 * Provides unified base URL handling across Web and Mobile environments.
 */

// Base API URL configuration
export function getApiBaseUrl(): string {
  // 1. Vite environment variable (Web)
  if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }

  // 2. Node / Server / Process environment (Mobile / Test / SSR)
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/+$/, '');
  }
  if (typeof process !== 'undefined' && process.env?.API_BASE_URL) {
    return process.env.API_BASE_URL.replace(/\/+$/, '');
  }

  // 3. Fallback to empty string for relative paths in browser
  return '';
}

/**
 * Builds a fully qualified or relative API endpoint URL
 */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

/**
 * Robust fetch wrapper with standard error handling
 */
export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(path);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      errorMessage = data.message || data.error || errorMessage;
    } catch {
      // Non-JSON response
    }
    const err: any = new Error(errorMessage);
    err.status = response.status;
    throw err;
  }

  return response.json();
}
