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

  const rawStr = String(slaFormatted || (typeof slaTimeLeft === 'string' ? slaTimeLeft : '')).trim();

  // Negative / overdue string patterns (e.g. "-00:15", "Overdue SLA", "Breached")
  if (
    rawStr.startsWith('-') ||
    rawStr.toLowerCase().includes('overdue') ||
    rawStr.toLowerCase().includes('breach')
  ) {
    const colonMatch = rawStr.match(/-(\d+):(\d+)/);
    if (colonMatch) {
      const mins = parseInt(colonMatch[1], 10);
      const secs = parseInt(colonMatch[2], 10);
      return -(mins * 60 + secs);
    }
    return -900; // default -15m breach
  }

  // Numeric time left (minutes)
  if (typeof slaTimeLeft === 'number') {
    return Math.round(slaTimeLeft * 60);
  }

  // String parsing for days/hours/minutes (e.g. "3h 45m", "1h left", "0h left", "45m left")
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

    // Pattern like "05:05" (mm:ss or hh:mm)
    const colonMatch = rawStr.match(/^(\d+):(\d+)$/);
    if (colonMatch) {
      const part1 = parseInt(colonMatch[1], 10);
      const part2 = parseInt(colonMatch[2], 10);
      return part1 * 60 + part2;
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
  // Breached / Overdue: Pulse Red with negative ticker
  if (seconds <= 0) {
    const abs = Math.abs(seconds);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
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

export interface SlaBadgeProps {
  slaTimeLeft?: number | string | null;
  slaFormatted?: string | null;
  status?: string;
  className?: string;
}

export const SlaBadge: React.FC<SlaBadgeProps> = React.memo(({
  slaTimeLeft,
  slaFormatted,
  status,
  className = '',
}) => {
  const isOnHold = Boolean(
    status && (status.toLowerCase().includes('hold') || status.toLowerCase().includes('paused'))
  );

  const initialSec = parseInitialSeconds(slaTimeLeft, slaFormatted);
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSec);

  // Sync state if props change
  useEffect(() => {
    setSecondsLeft(parseInitialSeconds(slaTimeLeft, slaFormatted));
  }, [slaTimeLeft, slaFormatted]);

  // 1-second live ticking countdown timer
  useEffect(() => {
    if (isOnHold || secondsLeft <= -86400) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOnHold, secondsLeft]);

  if (slaTimeLeft == null && !slaFormatted) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  // Paused when On Hold
  if (isOnHold) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-100 text-slate-700 border-slate-300 shadow-sm ${className}`}
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

  if (urgency === 'overdue') {
    // Breached: Pulse red with high-visibility alert border and glow
    badgeClasses = 'bg-rose-100 text-rose-800 border-rose-300 shadow-[0_0_8px_rgba(225,29,72,0.35)] animate-pulse font-bold';
    dotClasses = 'bg-rose-600 animate-ping';
    customStyle = {
      backgroundColor: '#ffe4e6',
      color: '#be123c',
      borderColor: '#fca5a5',
    };
    dotStyle = {
      backgroundColor: '#e11d48',
    };
  } else if (urgency === 'warning') {
    // Approaching breach (< 1h): Yellow / Amber theme
    badgeClasses = 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm font-semibold';
    dotClasses = 'bg-amber-500 animate-pulse';
    customStyle = {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      borderColor: '#fcd34d',
    };
    dotStyle = {
      backgroundColor: '#d97706',
    };
  } else {
    // Safe (> 1h): Green theme
    badgeClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium';
    dotClasses = 'bg-emerald-600';
    customStyle = {
      backgroundColor: '#ecfdf5',
      color: '#065f46',
      borderColor: '#a7f3d0',
    };
    dotStyle = {
      backgroundColor: '#059669',
    };
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
