import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchBackendDbStatus,
  describeBackendProblem,
  type BackendDbStatus,
} from '../../services/backendStatusService';

/**
 * Shows a dismissible banner when the API cannot serve real data, so an empty
 * or stale screen is never mistaken for "there is nothing to show".
 */
export const BackendStatusBanner: React.FC<{ pollMs?: number }> = ({ pollMs = 60000 }) => {
  const [status, setStatus] = useState<BackendDbStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [checking, setChecking] = useState(false);
  const [demoDataNotice, setDemoDataNotice] = useState<string | null>(null);

  const check = useCallback(async () => {
    setChecking(true);
    const next = await fetchBackendDbStatus();
    setStatus(next);
    if (next.connected) setDemoDataNotice(null);
    setChecking(false);
    return next;
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const next = await fetchBackendDbStatus();
      if (active) setStatus(next);
    };
    run();
    const timer = window.setInterval(run, pollMs);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [pollMs]);

  // Any request that came back as demo data flags it straight away, so the
  // badge does not wait for the next health poll.
  useEffect(() => {
    const onDemoData = (event: Event) => {
      const detail = (event as CustomEvent<{ endpoint?: string; reason?: string }>).detail;
      setDemoDataNotice(detail?.reason || 'Some screens are showing demo data.');
    };
    window.addEventListener('servigen-demo-data', onDemoData);
    return () => window.removeEventListener('servigen-demo-data', onDemoData);
  }, []);

  const problem = describeBackendProblem(status) ?? demoDataNotice;
  if (!problem || dismissed) return null;

  const counts = status?.counts || {};
  const countEntries = Object.entries(counts).filter(
    ([, value]) => typeof value === 'number'
  ) as Array<[string, number]>;

  return (
    <div className="w-full border-b border-amber-300 bg-amber-50 px-4 py-2 text-[12px] text-amber-900">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
          Demo data
        </span>
        <span className="flex-1 min-w-[200px]">{problem}</span>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded border border-amber-400 px-2 py-0.5 font-semibold hover:bg-amber-100"
        >
          {expanded ? 'Hide details' : 'Details'}
        </button>
        <button
          type="button"
          onClick={check}
          disabled={checking}
          className="rounded border border-amber-400 px-2 py-0.5 font-semibold hover:bg-amber-100 disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Retry'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="rounded px-2 py-0.5 font-semibold hover:bg-amber-100"
        >
          ×
        </button>
      </div>

      {expanded && status && (
        <div className="mt-2 space-y-1 border-t border-amber-200 pt-2 font-mono text-[11px] leading-relaxed">
          <div>
            api: {status.reachable ? 'reachable' : 'unreachable'} · db:{' '}
            {status.connected ? `connected (${status.latencyMs}ms)` : 'disconnected'} · env:{' '}
            {status.env || 'unknown'} · read-fallback:{' '}
            {status.readFallbackEnabled ? 'on' : 'off'} · write-fallback:{' '}
            {status.writeFallbackEnabled ? 'ON (unsafe)' : 'off'}
          </div>
          {status.datasource && (
            <div>
              datasource: {status.datasource.host || '?'}:{status.datasource.port || '?'}/
              {status.datasource.database || '?'}
              {status.datasource.pooled ? ' (pooled)' : ''}
            </div>
          )}
          {status.error && (
            <div className="text-red-700">
              error: {status.error.code ? `[${status.error.code}] ` : ''}
              {status.error.message}
            </div>
          )}
          {countEntries.length > 0 && (
            <div>rows: {countEntries.map(([k, v]) => `${k}=${v}`).join(' · ')}</div>
          )}
          {status.recentFailures &&
            Object.entries(status.recentFailures).map(([context, failure]) => (
              <div key={context} className="text-red-700">
                {context} ×{failure.count}: {failure.code ? `[${failure.code}] ` : ''}
                {failure.message}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default BackendStatusBanner;
