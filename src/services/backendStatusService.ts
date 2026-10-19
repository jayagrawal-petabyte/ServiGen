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
  /** The diagnostics endpoint is not deployed on this backend. */
  unsupported?: boolean;
  reachable: boolean;
  connected: boolean;
  latencyMs?: number;
  env?: string;
  datasource?: BackendDatasource;
  readFallbackEnabled?: boolean;
  writeFallbackEnabled?: boolean;
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

  // GET /api/health/db is optional. When the deployed backend does not expose
  // it, say nothing rather than reporting a database problem we cannot see —
  // the demo-data badge still appears via the `servigen-demo-data` event.
  if (status.unsupported) return null;

  if (!status.reachable) {
    return 'Cannot reach the ServiGen API — showing demo data. The backend may be asleep or still starting up.';
  }

  if (!status.connected) {
    const where = status.datasource?.host
      ? ` (${status.datasource.host}:${status.datasource.port || '5432'})`
      : '';
    const prefix = status.readFallbackEnabled
      ? 'Showing demo data: the API is running but cannot reach its database'
      : 'The API is running but cannot reach its database';

    if (status.datasource?.isLocalhost) {
      return `${prefix}${where} — DATABASE_URL still points at localhost. Set it to the Supabase connection string on the server.`;
    }
    return `${prefix}${where}. ${status.error?.message || ''}`.trim();
  }

  if (status.writeFallbackEnabled) {
    return 'ALLOW_WRITE_FALLBACK is on: failed saves will report success without being persisted. Turn it off.';
  }

  const failures = Object.entries(status.recentFailures || {});
  if (failures.length > 0) {
    const [context, failure] = failures[0];
    return `Database connected, but ${failures.length} endpoint(s) recently fell back to demo data — e.g. ${context}: ${failure.message}`;
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

    // 404/405 => this backend has no diagnostics endpoint. Not a fault.
    if (res.status === 404 || res.status === 405) {
      return { unsupported: true, reachable: true, connected: true, checkedAt };
    }

    const body = await res.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return { reachable: res.ok, connected: false, checkedAt };
    }

    // Some error envelopes have no diagnostics fields at all.
    if (!('connected' in body)) {
      return { unsupported: true, reachable: true, connected: true, checkedAt };
    }

    return {
      reachable: true,
      connected: body.connected === true,
      latencyMs: body.latencyMs,
      env: body.env,
      datasource: body.datasource,
      readFallbackEnabled: body.readFallbackEnabled ?? body.mockFallbackEnabled,
      writeFallbackEnabled: body.writeFallbackEnabled,
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
