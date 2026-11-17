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

export function describeBackendProblem(status: BackendDbStatus | null): string | null {
  if (!status) return null;

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

export async function fetchBackendDbStatus(): Promise<BackendDbStatus> {
  const checkedAt = new Date().toISOString();
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/health/db`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (res.status === 404 || res.status === 405) {
      return { unsupported: true, reachable: true, connected: true, checkedAt };
    }

    const body = await res.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return { reachable: res.ok, connected: false, checkedAt };
    }

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
