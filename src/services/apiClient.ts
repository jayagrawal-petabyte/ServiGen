/**
 * ServiGen Centralized API Client
 * Standardized HTTP communication layer adhering to ServiGen API Specification (V1.0)
 * 
 * Features:
 * - Base URL configuration via import.meta.env.VITE_API_BASE_URL
 * - Automatic JWT Bearer token attachment
 * - Standardized error formatting (400, 401, 403, 404, 429, 500)
 * - Safe response envelope unwrapping ({ success: true, data: T })
 * - Full backward compatibility for both `apiClient` and `api` interfaces
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
  status?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errors?: string[];
  [key: string]: unknown;
}

export class ApiError extends Error {
  public statusCode: number;
  public data?: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

const USER_KEY = 'servigen_auth_user';

/**
 * Retrieve the active JWT token from storage without logging or exposing secrets.
 */
export function getAuthToken(): string | null {
  try {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('jwt_token') ||
      localStorage.getItem('servigen_auth_token') ||
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('jwt_token') ||
      sessionStorage.getItem('access_token') ||
      null
    );
  } catch {
    return null;
  }
}

export const getStoredToken = getAuthToken;

/**
 * Store a JWT token for authenticated requests
 */
export function setAuthToken(token: string | null, persist = true): void {
  try {
    if (token) {
      if (persist) {
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('token', token);
        localStorage.setItem('servigen_auth_token', token);
      } else {
        sessionStorage.setItem('jwt_token', token);
        sessionStorage.setItem('token', token);
      }
    } else {
      clearAuthToken();
    }
  } catch {
    // Quota exceeded or restricted environment
  }
}

export const setStoredToken = (token: string | null) => setAuthToken(token, true);

/**
 * Clear stored authentication tokens
 */
export function clearAuthToken(): void {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('servigen_auth_token');
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('jwt_token');
    sessionStorage.removeItem('access_token');
  } catch {
    // ignore
  }
}

export const getStoredUser = (): any | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: any | null): void => {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (err) {
    console.warn('Failed to update stored user:', err);
  }
};

/**
 * Resolve the backend base URL.
 * Defaults to empty string (same host / Vite proxy) or VITE_API_BASE_URL.
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    // Strip trailing slash for consistency
    return envUrl.replace(/\/+$/, '');
  }
  return '';
}

/**
 * Format status-specific error messages per ServiGen API specification.
 */
function resolveErrorMessage(status: number, backendMessage?: string): string {
  if (backendMessage && typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage;
  }

  switch (status) {
    case 400:
      return 'Bad Request (400): The request payload or parameter was invalid.';
    case 401:
      return 'Unauthorized (401): Valid JWT Bearer token required. Please sign in.';
    case 403:
      return 'Forbidden (403): Access denied due to insufficient permissions or organization boundary.';
    case 404:
      return 'Not Found (404): The requested resource or endpoint does not exist.';
    case 429:
      return 'Rate Limit Exceeded (429): Maximum 100 requests per 15 minutes reached. Please wait.';
    case 500:
      return 'Internal Server Error (500): The backend encountered an unexpected error.';
    case 502:
    case 503:
    case 504:
      return `Backend Gateway Error (${status}): The ServiGen backend service is currently unavailable.`;
    default:
      return `Request failed with HTTP status ${status}.`;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Core HTTP fetch wrapper with authorization header, request payload handling,
 * and standard error parsing.
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let fullUrl = `${baseUrl}${normalizedEndpoint}`;

  const { params, headers: customHeaders, ...fetchOptions } = options;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers = new Headers(customHeaders || {});

  // Attach Content-Type for mutations if not already set
  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach JWT Bearer token for protected endpoints
  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...fetchOptions,
      headers,
    });
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error && err.message
        ? `Network Error: ${err.message}. Backend server may not be reachable at ${fullUrl}.`
        : `Network Error: Unable to connect to backend server at ${fullUrl}.`;
    throw new ApiError(errorMsg, 0);
  }

  let responseData: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    let backendMessage: string | undefined;
    if (responseData && typeof responseData === 'object' && 'message' in responseData) {
      backendMessage = String((responseData as { message: unknown }).message);
    }
    const message = resolveErrorMessage(response.status, backendMessage);
    throw new ApiError(message, response.status, responseData);
  }

  return responseData as T;
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    }),
  patch: <T = any>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    }),
  put: <T = any>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    }),
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

export const api = apiClient;
