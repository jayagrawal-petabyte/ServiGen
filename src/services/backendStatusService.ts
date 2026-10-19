/**
 * Backend status / diagnostics.
 *
 * The API used to answer every request with hardcoded mock data whenever its
 * database call failed, so "deployed and working" and "database unreachable"
 * looked identical in the UI. GET /api/health/db now reports the truth; this
 * service exposes it to the app so the state is visible instead of guessed.
 */

import { getApiBaseUrl } from './apiClient';

export interface BackendDatasource {
  host?: string;
  port?: string;
  database?: string | null;
  user?: string | null;
  pooled?: boolean;
  isLocalhost?: boolean;
  error?: string;
}

export interface BackendDbStatus {
  reachable: boolean;
  connected: boolean;
  latencyMs?: number;
  env?: string;
  datasource?: BackendDatasource;
  mockFallbackEnabled?: boolean;
  counts?: Record<string, number | { error: string }>;
  error?: { name?: string; code?: string; message: string };
  recentFailures?: Record<string, { code?: string; message: string; at: string; count: number }>;
  checkedAt: string;
}

/**
 * Human-readable explanation of why screens are empty or stale.
 */
export function describeBackendProblem(status: BackendDbStatus | null): string | null {
  if (!status) return null;

  if (!status.reachable) {
    return 'Cannot reach the ServiGen API. The backend may be asleep or still starting up.';
  }

  if (!status.connected) {
    const where = status.datasource?.host
      ? ` (${status.datasource.host}:${status.datasource.port || '5432'})`
      : '';
    if (status.datasource?.isLocalhost) {
      return `The API is running but DATABASE_URL still points at localhost${where}. Set it to the Supabase connection string on the server.`;
    }
    return `The API is running but cannot reach its database${where}. ${status.error?.message || ''}`.trim();
  }

  if (status.mockFallbackEnabled) {
    return 'The API is connected but mock fallback is enabled, so failed queries silently return sample data.';
  }

  const failures = Object.entries(status.recentFailures || {});
  if (failures.length > 0) {
    const [context, failure] = failures[0];
    return `Database connected, but ${failures.length} endpoint(s) recently failed — e.g. ${context}: ${failure.message}`;
  }

  return null;
}

/**
 * Fetches live database status. Never throws.
 */
export async function fetchBackendDbStatus(): Promise<BackendDbStatus> {
  const checkedAt = new Date().toISOString();
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/health/db`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const body = await res.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return { reachable: res.ok, connected: false, checkedAt };
    }

    return {
      reachable: true,
      connected: body.connected === true,
      latencyMs: body.latencyMs,
      env: body.env,
      datasource: body.datasource,
      mockFallbackEnabled: body.mockFallbackEnabled,
      counts: body.counts,
      error: body.error,
      recentFailures: body.recentFailures,
      checkedAt,
    };
  } catch (err) {
    return {
      reachable: false,
      connected: false,
      error: { message: err instanceof Error ? err.message : 'Network request failed' },
      checkedAt,
    };
  }
}

export default { fetchBackendDbStatus, describeBackendProblem };
