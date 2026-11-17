
import { handleOfflineRequest } from './fallback/mockApiHandler';

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
const TOKEN_KEY = 'servigen_auth_token';

const LEGACY_TOKEN_KEYS = ['token', 'jwt_token', 'access_token'] as const;

function readStore(store: Storage, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  const current = readStore(localStorage, TOKEN_KEY) || readStore(sessionStorage, TOKEN_KEY);
  if (current) return current;

  for (const key of LEGACY_TOKEN_KEYS) {
    const legacy = readStore(localStorage, key) || readStore(sessionStorage, key);
    if (legacy) {
      setAuthToken(legacy, true);
      return legacy;
    }
  }
  return null;
}

export const getStoredToken = getAuthToken;

export function setAuthToken(token: string | null, persist = true): void {
  if (!token) {
    clearAuthToken();
    return;
  }
  try {
    (persist ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
  }
  for (const key of LEGACY_TOKEN_KEYS) {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
    }
  }
}

export const setStoredToken = (token: string | null) => setAuthToken(token, true);

export function isOfflineFallbackToken(token: string | null): boolean {
  if (!token) return false;
  return token.includes('offline_fallback') || token.includes('isOfflineFallback');
}

export function clearAuthToken(): void {
  for (const key of [TOKEN_KEY, ...LEGACY_TOKEN_KEYS]) {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
    }
  }
}

export const getStoredUser = (): any | null => {
  try {
    const session = sessionStorage.getItem(USER_KEY);
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed?.role === 'End User') return parsed;
    }
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: any | null): void => {
  try {
    if (user) {
      if (user.role === 'End User') {
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.removeItem(USER_KEY);
      } else {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        sessionStorage.removeItem(USER_KEY);
      }
    } else {
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(USER_KEY);
    }
  } catch (err) {
    console.warn('Failed to update stored user:', err);
  }
};

export function getApiBaseUrl(): string {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : undefined;
  const envUrl = env?.VITE_API_BASE_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (clean.includes('servigen-1.onrender.com')) {
      return 'https://servigen-backend.onrender.com';
    }
    return clean;
  }
  if (env?.PROD) {
    return 'https://servigen-backend.onrender.com';
  }
  return '';
}

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
    case 409:
      return 'Conflict (409): A resource with this name or identifier already exists.';
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

let refreshPromise: Promise<string | null> | null = null;

export async function refreshSession(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const currentToken = getAuthToken();
      if (!currentToken) return null;
      if (currentToken.startsWith('mock_')) return currentToken;

      const res = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!res.ok) {
        return null;
      }

      const json = await res.json();
      const token = json?.data?.token || json?.token;
      if (!token) {
        return null;
      }

      setStoredToken(token);
      if (json?.data?.user) setStoredUser(json.data.user);
      return token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function announceSessionExpiry(): void {
  try {
    window.dispatchEvent(new CustomEvent('servigen-session-expired'));
  } catch {
  }
}

export function isPublicEndpoint(endpoint: string): boolean {
  const clean = endpoint.toLowerCase();
  return (
    clean.includes('/auth/login') ||
    clean.includes('/auth/register') ||
    clean.includes('/auth/forgot-password') ||
    clean.includes('/auth/reset-password') ||
    clean.includes('/health')
  );
}

export const refreshAuthToken = refreshSession;
export const obtainDevAuthToken = refreshSession;

const GET_CACHE_TTL_MS = 3000;
interface CacheRecord {
  data: any;
  timestamp: number;
}
const apiGetCache = new Map<string, CacheRecord>();
const apiInFlightGetRequests = new Map<string, Promise<any>>();

export function clearApiCache(): void {
  apiGetCache.clear();
}

async function executeRequest<T = any>(
  endpoint: string,
  options: RequestOptions & { _isRetry?: boolean } = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let fullUrl = `${baseUrl}${normalizedEndpoint}`;

  const { params, headers: customHeaders, _isRetry, ...fetchOptions } = options;

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

  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();

  if (!token && !isPublicEndpoint(normalizedEndpoint)) {
    throw new ApiError('Authentication required. Missing Bearer token.', 401);
  }

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
    const mockRes = handleOfflineRequest(
      normalizedEndpoint,
      fetchOptions.method || 'GET',
      fetchOptions.body,
      params
    );
    if (mockRes !== undefined) {
      try {
        window.dispatchEvent(
          new CustomEvent('servigen-demo-data', {
            detail: {
              endpoint: normalizedEndpoint,
              reason: 'Running in offline demo mode — Render backend is unreachable',
            },
          })
        );
      } catch {}
      return mockRes as T;
    }

    const errorMsg =
      err instanceof Error && err.message
        ? `Network Error: ${err.message}. Backend server may not be reachable at ${fullUrl}.`
        : `Network Error: Unable to connect to backend server at ${fullUrl}.`;
    throw new ApiError(errorMsg, 0);
  }

  const isMockToken = Boolean(token?.startsWith('mock_')) || isOfflineFallbackToken(token);
  const isAuthFailureWithMock = (response.status === 401 || response.status === 403) && isMockToken;
  const isServerError = response.status >= 500;
  const isOriginForbidden = response.status === 403 && !isPublicEndpoint(normalizedEndpoint);
  const isUnmountedRoute = response.status === 404 && !normalizedEndpoint.includes('/auth/login');

  if (isServerError || isUnmountedRoute || isAuthFailureWithMock || isOriginForbidden) {
    const mockRes = handleOfflineRequest(
      normalizedEndpoint,
      fetchOptions.method || 'GET',
      fetchOptions.body,
      params
    );
    if (mockRes !== undefined) {
      try {
        window.dispatchEvent(
          new CustomEvent('servigen-demo-data', {
            detail: {
              endpoint: normalizedEndpoint,
              reason: isAuthFailureWithMock
                ? 'Running in offline demo mode — showing local demo data'
                : 'Backend or database unavailable — serving demo data',
            },
          })
        );
      } catch {}
      return mockRes as T;
    }
  }

  if (response.status === 429) {
    throw new ApiError(
      'Rate Limit Exceeded (429): Maximum 100 requests per 15 minutes reached. Please wait.',
      429
    );
  }

  if (response.status === 401 && !_isRetry && !isPublicEndpoint(normalizedEndpoint) && !endpoint.includes('/auth/refresh')) {
    const freshToken = await refreshSession();
    if (freshToken) {
      const retryHeaders = new Headers(customHeaders || {});
      if (fetchOptions.body && !retryHeaders.has('Content-Type')) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${freshToken}`);
      return apiRequest<T>(endpoint, {
        ...options,
        _isRetry: true,
        headers: retryHeaders,
      });
    }
    if (normalizedEndpoint.includes('/auth/session') && !isOfflineFallbackToken(token)) {
      clearAuthToken();
      announceSessionExpiry();
    }
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

  const dataSource =
    response.headers.get('X-Data-Source') ||
    (responseData && typeof responseData === 'object' ? (responseData as any)?.meta?.source : null);
  if (dataSource === 'mock') {
    try {
      window.dispatchEvent(
        new CustomEvent('servigen-demo-data', {
          detail: {
            endpoint: normalizedEndpoint,
            reason: (responseData as any)?.meta?.reason ?? null,
          },
        })
      );
    } catch {
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

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions & { _isRetry?: boolean } = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    clearApiCache();
    return executeRequest<T>(endpoint, options);
  }

  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let fullUrl = `${baseUrl}${normalizedEndpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = getAuthToken();
  const cacheKey = `${token || 'anon'}::${fullUrl}`;

  const cached = apiGetCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < GET_CACHE_TTL_MS) {
    return cached.data as T;
  }

  const inFlight = apiInFlightGetRequests.get(cacheKey);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  const promise = executeRequest<T>(endpoint, options)
    .then((result) => {
      apiGetCache.set(cacheKey, { data: result, timestamp: Date.now() });
      apiInFlightGetRequests.delete(cacheKey);
      return result;
    })
    .catch((err) => {
      apiInFlightGetRequests.delete(cacheKey);
      throw err;
    });

  apiInFlightGetRequests.set(cacheKey, promise);
  return promise;
}


export function logServiceError(context: string, error: unknown): void {
  const detail =
    error instanceof ApiError
      ? `[${error.statusCode}] ${error.message}`
      : error instanceof Error
      ? error.message
      : String(error);
  console.error(`[servigen:api] ${context} failed — ${detail}`);
  try {
    window.dispatchEvent(
      new CustomEvent('servigen-api-error', { detail: { context, message: detail } })
    );
  } catch {
  }
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
