import React, { useState, useEffect } from 'react';

export type SlaUrgency = 'safe' | 'warning' | 'overdue' | 'paused';

/**
 * Parses numeric minutes or formatted string to calculate initial seconds remaining.
 */
export function parseInitialSeconds(
  slaTimeLeft?: number | string | null,
  slaFormatted?: string | null
): number {
  if (slaTimeLeft == null && !slaFormatted) {
    return 0;
  }

  // 1. Numeric time left (minutes) - check FIRST!
  if (typeof slaTimeLeft === 'number') {
    return Math.round(slaTimeLeft * 60);
  }

  let rawStr = String(slaFormatted || (typeof slaTimeLeft === 'string' ? slaTimeLeft : '')).trim();
  rawStr = rawStr.replace(/^Target\s+SLA\s*:\s*/i, '').trim();

  // Negative / overdue string patterns (e.g. "-00:15", "-01:38", "Overdue SLA", "Breached")
  if (
    rawStr.startsWith('-') ||
    rawStr.toLowerCase().includes('overdue') ||
    rawStr.toLowerCase().includes('breach')
  ) {
    const colonMatch = rawStr.match(/-(\d+):(\d+)/);
    if (colonMatch) {
      const part1 = parseInt(colonMatch[1], 10);
      const part2 = parseInt(colonMatch[2], 10);
      // formatSla outputs HH:MM (hours:mins)
      return -(part1 * 3600 + part2 * 60);
    }
    const minMatch = rawStr.match(/-?(\d+)\s*m/i);
    if (minMatch) {
      return -(parseInt(minMatch[1], 10) * 60);
    }
    return -900; // default -15m breach
  }

  // String parsing for days/hours/minutes (e.g. "3h 45m", "1h left", "0h left", "45m left", "5h SLA")
  if (rawStr) {
    let totalSec = 0;
    const dayMatch = rawStr.match(/(\d+)\s*d/i);
    const hourMatch = rawStr.match(/(\d+)\s*h/i);
    const minMatch = rawStr.match(/(\d+)\s*m/i);

    if (dayMatch) totalSec += parseInt(dayMatch[1], 10) * 86400;
    if (hourMatch) totalSec += parseInt(hourMatch[1], 10) * 3600;
    if (minMatch) totalSec += parseInt(minMatch[1], 10) * 60;

    // Special case: "0h left" means under an hour left, default to ~42m if no minutes specified
    if (hourMatch && parseInt(hourMatch[1], 10) === 0 && !minMatch) {
      totalSec = 42 * 60; // 42 minutes left (<1h, yellow approaching breach!)
    }

    if (totalSec > 0) return totalSec;

    // Pattern like "05:00" (HH:MM from formatSla)
    const colonMatch = rawStr.match(/^(\d+):(\d+)$/);
    if (colonMatch) {
      const part1 = parseInt(colonMatch[1], 10);
      const part2 = parseInt(colonMatch[2], 10);
      // In formatSla, format is hours:mins
      return part1 * 3600 + part2 * 60;
    }
  }

  return 0;
}

/**
 * Converts remaining seconds into human-readable countdown text and SLA urgency state:
 * - Safe (> 1h remaining): Green (#16a34a / emerald)
 * - Approaching breach (< 1h remaining): Yellow / Amber (#d97706 / amber)
 * - Breached (<= 0s remaining): Pulsing Red (#e11d48 / rose)
 */
export function formatSecondsToSla(seconds: number): { text: string; urgency: SlaUrgency } {
  // Breached / Overdue: Negative ticker
  if (seconds <= 0) {
    const abs = Math.abs(seconds);
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    if (h > 0) {
      return {
        text: `Breached (-${h}h ${m}m ${String(s).padStart(2, '0')}s)`,
        urgency: 'overdue',
      };
    }
    return {
      text: abs > 0 ? `Breached (-${m}m ${String(s).padStart(2, '0')}s)` : 'Overdue SLA',
      urgency: 'overdue',
    };
  }

  // Approaching Breach (< 1 hour): Turn Yellow with live mm:ss ticking countdown
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return {
      text: `${m}m ${String(s).padStart(2, '0')}s left`,
      urgency: 'warning',
    };
  }

  // Safe (> 1 hour up to 24h): Green theme with live ticking countdown
  if (seconds <= 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const text = `${h}h ${m}m ${String(s).padStart(2, '0')}s left`;
    return { text, urgency: 'safe' };
  }

  // Safe (> 24 hours)
  const days = Math.floor(seconds / 86400);
  const remHours = Math.floor((seconds % 86400) / 3600);
  const text = remHours > 0 ? `${days}d ${remHours}h left` : `${days}d left`;
  return { text, urgency: 'safe' };
}

/**
 * Resolves or anchors an absolute target epoch timestamp for a ticket's SLA.
 * This guarantees:
 * 1. Time continuously progresses as wall-clock time passes and NEVER resets on tab switch, filter change, or re-render.
 * 2. The SLA countdown inside the ticket detail modal and outside in tables/badges match down to the exact second.
 */
export function getTicketSlaTarget(
  ticketId?: string,
  slaTimeLeft?: number | string | null,
  slaFormatted?: string | null,
  resolutionTargetAt?: string | null,
  createdAt?: string | null,
  priority?: string | null
): number {
  const storageKey = ticketId ? `servigen_sla_target_${ticketId}` : null;

  // 1. If explicit resolutionTargetAt is provided from backend DB
  if (resolutionTargetAt) {
    const t = new Date(resolutionTargetAt).getTime();
    if (!isNaN(t) && t > 0) {
      if (storageKey) {
        try { localStorage.setItem(storageKey, String(t)); } catch {}
      }
      return t;
    }
  }

  // 2. Check localStorage for an existing anchored target timestamp
  if (storageKey) {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) {
          // Invalidate legacy buggy default 3-hour entries if the ticket is actually breached
          const isBreached =
            (typeof slaTimeLeft === 'number' && slaTimeLeft <= 0) ||
            (typeof slaFormatted === 'string' &&
              (slaFormatted.includes('-') ||
                slaFormatted.toLowerCase().includes('breach') ||
                slaFormatted.toLowerCase().includes('overdue')));
          const isFarFuture = parsed > Date.now() + 1800 * 1000;

          if (!(isBreached && isFarFuture)) {
            return parsed;
          }
        }
      }
    } catch {}
  }

  // 3. Compute target timestamp from initial seconds remaining relative to Date.now()
  const initialSec = parseInitialSeconds(slaTimeLeft, slaFormatted);
  if (initialSec !== 0 || slaTimeLeft != null || slaFormatted) {
    const target = Date.now() + initialSec * 1000;
    if (storageKey) {
      try { localStorage.setItem(storageKey, String(target)); } catch {}
    }
    return target;
  }

  // 4. Fallback based on priority & createdAt
  const baseTime = createdAt ? new Date(createdAt).getTime() : Date.now();
  let offsetHours = 4;
  const pri = (priority || '').toLowerCase();
  if (pri.includes('critical') || pri.includes('p1')) offsetHours = 1;
  else if (pri.includes('high') || pri.includes('p2')) offsetHours = 2;
  else if (pri.includes('medium') || pri.includes('p3')) offsetHours = 4;
  else if (pri.includes('low') || pri.includes('p4')) offsetHours = 8;

  const target = baseTime + offsetHours * 3600 * 1000;
  if (storageKey) {
    try { localStorage.setItem(storageKey, String(target)); } catch {}
  }
  return target;
}

export interface SlaBadgeProps {
  ticketId?: string;
  slaTimeLeft?: number | string | null;
  slaFormatted?: string | null;
  resolutionTargetAt?: string | null;
  createdAt?: string | null;
  priority?: string | null;
  status?: string;
  className?: string;
  variant?: 'standard' | 'restrained';
}

export const SlaBadge: React.FC<SlaBadgeProps> = React.memo(({
  ticketId,
  slaTimeLeft,
  slaFormatted,
  resolutionTargetAt,
  createdAt,
  priority,
  status,
  className = '',
  variant = 'restrained',
}) => {
  const isOnHold = Boolean(
    status && (status.toLowerCase().includes('hold') || status.toLowerCase().includes('paused'))
  );

  const isCompleted = Boolean(
    (slaFormatted && (slaFormatted.toLowerCase().includes('complete') || slaFormatted.toLowerCase().includes('met'))) ||
    (status && (status.toLowerCase() === 'resolved' || status.toLowerCase() === 'closed')) ||
    (status?.toLowerCase() === 'actioned' && (slaTimeLeft === 0 || slaFormatted?.toLowerCase().includes('complete')))
  );

  const [targetTimestamp, setTargetTimestamp] = useState<number>(() =>
    getTicketSlaTarget(ticketId, slaTimeLeft, slaFormatted, resolutionTargetAt, createdAt, priority)
  );

  // Sync state if props change
  useEffect(() => {
    setTargetTimestamp(
      getTicketSlaTarget(ticketId, slaTimeLeft, slaFormatted, resolutionTargetAt, createdAt, priority)
    );
  }, [ticketId, slaTimeLeft, slaFormatted, resolutionTargetAt, createdAt, priority]);

  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    Math.round((targetTimestamp - Date.now()) / 1000)
  );

  // 1-second live ticking countdown timer anchored to absolute target timestamp
  useEffect(() => {
    if (isOnHold || isCompleted) return;

    const tick = () => {
      setSecondsLeft(Math.round((targetTimestamp - Date.now()) / 1000));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [isOnHold, isCompleted, targetTimestamp]);

  if (slaTimeLeft == null && !slaFormatted) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  // Completed when resolved, closed, or SLA marked complete
  if (isCompleted) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0 ${
          variant === 'restrained'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
        } ${className}`}
        style={{
          backgroundColor: '#ecfdf5',
          color: '#065f46',
          borderColor: '#a7f3d0',
          boxShadow: 'none',
        }}
        title="SLA completed on time"
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"
          style={{ backgroundColor: '#059669', opacity: 1, display: 'inline-block' }}
        />
        <span>Completed</span>
      </span>
    );
  }

  // Paused when On Hold
  if (isOnHold) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
          variant === 'restrained'
            ? 'bg-slate-100 text-slate-700 border-slate-200'
            : 'bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
        } ${className}`}
        style={{ boxShadow: 'none' }}
        title="SLA clock paused while ticket is on hold"
      >
        <span className="text-[10px]">⏸</span>
        <span>Paused (On Hold)</span>
      </span>
    );
  }

  const { text, urgency } = formatSecondsToSla(secondsLeft);

  let badgeClasses = '';
  let dotClasses = '';
  let customStyle: React.CSSProperties | undefined;
  let dotStyle: React.CSSProperties | undefined;

  if (variant === 'restrained') {
    if (urgency === 'overdue') {
      badgeClasses = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      dotClasses = 'bg-rose-600';
      customStyle = {
        backgroundColor: '#fff1f2',
        color: '#be123c',
        borderColor: '#fecdd3',
        boxShadow: 'none',
      };
      dotStyle = {
        backgroundColor: '#e11d48',
        opacity: 1,
        display: 'inline-block',
      };
    } else if (urgency === 'warning') {
      badgeClasses = 'bg-amber-50 text-amber-800 border-amber-200 font-medium';
      dotClasses = 'bg-amber-500';
      customStyle = {
        backgroundColor: '#fffbeb',
        color: '#92400e',
        borderColor: '#fde68a',
        boxShadow: 'none',
      };
      dotStyle = {
        backgroundColor: '#d97706',
        opacity: 1,
        display: 'inline-block',
      };
    } else {
      badgeClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium';
      dotClasses = 'bg-emerald-600';
      customStyle = {
        backgroundColor: '#ecfdf5',
        color: '#065f46',
        borderColor: '#a7f3d0',
        boxShadow: 'none',
      };
      dotStyle = {
        backgroundColor: '#059669',
        opacity: 1,
        display: 'inline-block',
      };
    }
  } else {
    if (urgency === 'overdue') {
      badgeClasses = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      dotClasses = 'bg-rose-600';
      customStyle = {
        backgroundColor: '#fff1f2',
        color: '#be123c',
        borderColor: '#fecdd3',
        boxShadow: 'none',
      };
      dotStyle = {
        backgroundColor: '#e11d48',
        opacity: 1,
        display: 'inline-block',
      };
    } else if (urgency === 'warning') {
      badgeClasses = 'bg-amber-50 text-amber-800 border-amber-200 font-medium';
      dotClasses = 'bg-amber-500';
      customStyle = {
        backgroundColor: '#fffbeb',
        color: '#92400e',
        borderColor: '#fde68a',
        boxShadow: 'none',
      };
      dotStyle = {
        backgroundColor: '#d97706',
        opacity: 1,
        display: 'inline-block',
      };
    } else {
      badgeClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium';
      dotClasses = 'bg-emerald-600';
      customStyle = {
        backgroundColor: '#ecfdf5',
        color: '#065f46',
        borderColor: '#a7f3d0',
        boxShadow: 'none',
      };
      dotStyle = {
        backgroundColor: '#059669',
        opacity: 1,
        display: 'inline-block',
      };
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border whitespace-nowrap shrink-0 ${badgeClasses} ${className}`}
      style={customStyle}
      title={
        urgency === 'overdue'
          ? 'Contractual SLA breached!'
          : urgency === 'warning'
          ? 'Approaching SLA target (< 1h remaining)'
          : 'SLA on track (> 1h remaining)'
      }
    >
      <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${dotClasses}`} style={dotStyle} />
      <span className="font-mono tabular-nums whitespace-nowrap">{text}</span>
    </span>
  );
});

export default SlaBadge;
