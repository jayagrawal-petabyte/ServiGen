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

/**
 * Legacy token keys. The app previously wrote the same JWT under four names
 * across both localStorage and sessionStorage; any one of them going stale
 * produced auth behaviour that was very hard to trace. One key is canonical
 * now, and these are read once then cleared.
 */
const LEGACY_TOKEN_KEYS = ['token', 'jwt_token', 'access_token'] as const;

function readStore(store: Storage, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Retrieve the active JWT, migrating any legacy key to the canonical one.
 */
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

/**
 * Store a JWT token for authenticated requests
 */
export function setAuthToken(token: string | null, persist = true): void {
  if (!token) {
    clearAuthToken();
    return;
  }
  try {
    (persist ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    // Quota exceeded or restricted environment
  }
  // A new token supersedes anything left under the legacy names.
  for (const key of LEGACY_TOKEN_KEYS) {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

export const setStoredToken = (token: string | null) => setAuthToken(token, true);

/**
 * Check if the active JWT is a resilient offline fallback token
 */
export function isOfflineFallbackToken(token: string | null): boolean {
  if (!token) return false;
  return token.includes('offline_fallback') || token.includes('isOfflineFallback');
}

/**
 * Clear stored authentication tokens
 */
export function clearAuthToken(): void {
  for (const key of [TOKEN_KEY, ...LEGACY_TOKEN_KEYS]) {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
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
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (clean.includes('servigen-1.onrender.com')) {
      return 'https://servigen-backend.onrender.com';
    }
    return clean;
  }
  // In production builds (e.g. Vercel), default to the live Render backend
  if (import.meta.env.PROD) {
    return 'https://servigen-backend.onrender.com';
  }
  // In local development, empty string leverages Vite's dev proxy to Render
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

/**
 * Attempt to renew the current session.
 *
 * This used to log in with hardcoded demo credentials
 * (agent001@servigen.local, falling back to admin@servigen.local) whenever no
 * token was present or a request returned 401. Three consequences:
 *   - the login screen was decorative: the client authenticated regardless of
 *     who, if anyone, had signed in;
 *   - a token expiry silently replaced the signed-in user with agent001, or
 *     escalated them to admin;
 *   - both passwords shipped in the public production bundle.
 *
 * It now only renews an existing session. With no valid token the request
 * fails with 401 and the app routes to the login screen, which is correct.
 */
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
        if (!isOfflineFallbackToken(currentToken)) {
          clearAuthToken();
        }
        return null;
      }

      const json = await res.json();
      const token = json?.data?.token || json?.token;
      if (!token) {
        if (!isOfflineFallbackToken(currentToken)) {
          clearAuthToken();
        }
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

/**
 * Notify the app that the session is over so it can route to /auth.
 */
function announceSessionExpiry(): void {
  try {
    window.dispatchEvent(new CustomEvent('servigen-session-expired'));
  } catch {
    // Non-browser environment
  }
}

/**
 * Checks if an endpoint is public (accessible without Bearer token)
 */
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
/** @deprecated Retained for callers of the old name; no longer logs in with demo credentials. */
export const obtainDevAuthToken = refreshSession;

const GET_CACHE_TTL_MS = 3000; // 3 seconds for rapid navigation and duplicate mounts
interface CacheRecord {
  data: any;
  timestamp: number;
}
const apiGetCache = new Map<string, CacheRecord>();
const apiInFlightGetRequests = new Map<string, Promise<any>>();

/**
 * Clear cached GET responses. Called automatically on any mutation (POST/PUT/PATCH/DELETE)
 * or manually when fresh data is required.
 */
export function clearApiCache(): void {
  apiGetCache.clear();
}

/**
 * Core HTTP fetch wrapper with authorization header, request payload handling,
 * standard error parsing, and transparent JWT auto-acquisition.
 */
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

  // Attach Content-Type for mutations if not already set
  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach the signed-in user's JWT. Never acquire a session on their behalf.
  const token = getAuthToken();

  // Early guard: If endpoint requires authentication and no token is present,
  // do not dispatch the HTTP request. This prevents 401 storms and protects against
  // tripping the backend rate limiter (429 Too Many Requests).
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
    // If backend is unreachable (Render asleep or network down), seamlessly fall back
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

  // If backend returned a 5xx server error (e.g. database unreachable), unmounted route (404),
  // or rejected a mock session token (401), fall back to mock demo fixtures
  const isMockToken = Boolean(token?.startsWith('mock_'));
  const isAuthFailureWithMock = response.status === 401 && isMockToken;
  const isServerError = response.status >= 500;
  const isUnmountedRoute = response.status === 404 && !normalizedEndpoint.includes('/auth/login');

  if (isServerError || isUnmountedRoute || isAuthFailureWithMock) {
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

  // If rate limited by backend, immediately throw rate limit error without retrying
  if (response.status === 429) {
    throw new ApiError(
      'Rate Limit Exceeded (429): Maximum 100 requests per 15 minutes reached. Please wait.',
      429
    );
  }

  // If unauthorized and haven't retried yet, transparently refresh token and retry
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
    // Refresh failed: the session is genuinely over unless running an offline fallback token
    if (!isOfflineFallbackToken(token)) {
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

  // The API tags any payload it had to build from demo fixtures. Surface it so
  // the UI can label the data instead of presenting fixtures as live records.
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
      // Non-browser environment
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

/**
 * Public apiRequest entrypoint with transparent in-flight deduplication and short TTL cache.
 */
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

  // Check short TTL cache
  const cached = apiGetCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < GET_CACHE_TTL_MS) {
    return cached.data as T;
  }

  // Check in-flight request to deduplicate
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

/**
 * Report a swallowed service-layer failure.
 *
 * Service methods intentionally degrade to empty results so a single broken
 * endpoint cannot blank the whole app, but the cause must still be visible:
 * silent catches are what made "backend integrated, no data" undiagnosable.
 */
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
    // Non-browser environment
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
