import React, { useState, useEffect } from 'react';

export type SlaUrgency = 'safe' | 'warning' | 'overdue' | 'paused';

export function parseInitialSeconds(
  slaTimeLeft?: number | string | null,
  slaFormatted?: string | null
): number {
  if (slaTimeLeft == null && !slaFormatted) {
    return 0;
  }

  if (typeof slaTimeLeft === 'number') {
    return Math.round(slaTimeLeft * 60);
  }

  let rawStr = String(slaFormatted || (typeof slaTimeLeft === 'string' ? slaTimeLeft : '')).trim();
  rawStr = rawStr.replace(/^Target\s+SLA\s*:\s*/i, '').trim();

  if (
    rawStr.startsWith('-') ||
    rawStr.toLowerCase().includes('overdue') ||
    rawStr.toLowerCase().includes('breach')
  ) {
    const colonMatch = rawStr.match(/-(\d+):(\d+)/);
    if (colonMatch) {
      const part1 = parseInt(colonMatch[1], 10);
      const part2 = parseInt(colonMatch[2], 10);
      return -(part1 * 3600 + part2 * 60);
    }
    const minMatch = rawStr.match(/-?(\d+)\s*m/i);
    if (minMatch) {
      return -(parseInt(minMatch[1], 10) * 60);
    }
    return -900;
  }

  if (rawStr) {
    let totalSec = 0;
    const dayMatch = rawStr.match(/(\d+)\s*d/i);
    const hourMatch = rawStr.match(/(\d+)\s*h/i);
    const minMatch = rawStr.match(/(\d+)\s*m/i);

    if (dayMatch) totalSec += parseInt(dayMatch[1], 10) * 86400;
    if (hourMatch) totalSec += parseInt(hourMatch[1], 10) * 3600;
    if (minMatch) totalSec += parseInt(minMatch[1], 10) * 60;

    if (hourMatch && parseInt(hourMatch[1], 10) === 0 && !minMatch) {
      totalSec = 42 * 60;
    }

    if (totalSec > 0) return totalSec;

    const colonMatch = rawStr.match(/^(\d+):(\d+)$/);
    if (colonMatch) {
      const part1 = parseInt(colonMatch[1], 10);
      const part2 = parseInt(colonMatch[2], 10);
      return part1 * 3600 + part2 * 60;
    }
  }

  return 0;
}

export function formatSecondsToSla(seconds: number): { text: string; urgency: SlaUrgency } {
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

  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return {
      text: `${m}m ${String(s).padStart(2, '0')}s left`,
      urgency: 'warning',
    };
  }

  if (seconds <= 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const text = `${h}h ${m}m ${String(s).padStart(2, '0')}s left`;
    return { text, urgency: 'safe' };
  }

  const days = Math.floor(seconds / 86400);
  const remHours = Math.floor((seconds % 86400) / 3600);
  const text = remHours > 0 ? `${days}d ${remHours}h left` : `${days}d left`;
  return { text, urgency: 'safe' };
}

const sessionTargetCache = new Map<string, number>();

export function getTicketSlaTarget(
  ticketId?: string,
  slaTimeLeft?: number | string | null,
  slaFormatted?: string | null,
  resolutionTargetAt?: string | null,
  createdAt?: string | null,
  priority?: string | null
): number {
  if (resolutionTargetAt) {
    const t = new Date(resolutionTargetAt).getTime();
    if (!isNaN(t) && t > 0) {
      if (ticketId) sessionTargetCache.set(ticketId, t);
      return t;
    }
  }

  if (ticketId && sessionTargetCache.has(ticketId)) {
    return sessionTargetCache.get(ticketId)!;
  }

  const initialSec = parseInitialSeconds(slaTimeLeft, slaFormatted);
  if (initialSec !== 0 || slaTimeLeft != null || slaFormatted) {
    const target = Date.now() + initialSec * 1000;
    if (ticketId) sessionTargetCache.set(ticketId, target);
    return target;
  }

  const baseTime = createdAt ? new Date(createdAt).getTime() : Date.now();
  let offsetHours = 4;
  const pri = (priority || '').toLowerCase();
  if (pri.includes('critical') || pri.includes('p1')) offsetHours = 1;
  else if (pri.includes('high') || pri.includes('p2')) offsetHours = 2;
  else if (pri.includes('medium') || pri.includes('p3')) offsetHours = 4;
  else if (pri.includes('low') || pri.includes('p4')) offsetHours = 8;

  const target = baseTime + offsetHours * 3600 * 1000;
  if (ticketId) sessionTargetCache.set(ticketId, target);
  return target;
}

export interface SlaBadgeProps {
  ticketId?: string;
  slaTimeLeft?: number | string | null;
  slaFormatted?: string | null;
  resolutionTargetAt?: string | null;
  responseTargetAt?: string | null;
  slaTimeRemainingSeconds?: number | null;
  responseTimeRemainingSeconds?: number | null;
  isBreached?: boolean;
  slaPaused?: boolean;
  holdStartedAt?: string | null;
  resolutionTargetMet?: boolean;
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
  responseTargetAt,
  slaTimeRemainingSeconds,
  isBreached,
  slaPaused,
  holdStartedAt,
  resolutionTargetMet,
  createdAt,
  priority,
  status,
  className = '',
  variant = 'restrained',
}) => {
  const isOnHold = Boolean(
    slaPaused || (status && (status.toLowerCase().includes('hold') || status.toLowerCase().includes('paused')))
  );

  const isCompleted = Boolean(
    resolutionTargetMet === true ||
    (slaFormatted && (slaFormatted.toLowerCase().includes('complete') || slaFormatted.toLowerCase().includes('met'))) ||
    (status && (status.toLowerCase() === 'resolved' || status.toLowerCase() === 'closed')) ||
    (status?.toLowerCase() === 'actioned' && (slaTimeLeft === 0 || slaFormatted?.toLowerCase().includes('complete')))
  );

  const [targetTimestamp, setTargetTimestamp] = useState<number>(() =>
    getTicketSlaTarget(ticketId, slaTimeLeft, slaFormatted, resolutionTargetAt, createdAt, priority)
  );

  useEffect(() => {
    setTargetTimestamp(
      getTicketSlaTarget(ticketId, slaTimeLeft, slaFormatted, resolutionTargetAt, createdAt, priority)
    );
  }, [ticketId, slaTimeLeft, slaFormatted, resolutionTargetAt, createdAt, priority]);

  const computeCurrentSeconds = () => {
    if (isOnHold && holdStartedAt) {
      const holdTime = new Date(holdStartedAt).getTime();
      if (!isNaN(holdTime)) {
        return Math.round((targetTimestamp - holdTime) / 1000);
      }
    }
    if (isOnHold && typeof slaTimeRemainingSeconds === 'number') {
      return slaTimeRemainingSeconds;
    }
    return Math.round((targetTimestamp - Date.now()) / 1000);
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(computeCurrentSeconds);

  useEffect(() => {
    if (isOnHold || isCompleted) {
      setSecondsLeft(computeCurrentSeconds());
      return;
    }

    const tick = () => {
      setSecondsLeft(Math.round((targetTimestamp - Date.now()) / 1000));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [isOnHold, isCompleted, targetTimestamp, holdStartedAt, slaTimeRemainingSeconds]);

  if (slaTimeLeft == null && !slaFormatted && !resolutionTargetAt) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

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
        title="SLA completed"
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"
          style={{ backgroundColor: '#059669', opacity: 1, display: 'inline-block' }}
        />
        <span>Completed</span>
      </span>
    );
  }

  if (isOnHold) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
          variant === 'restrained'
            ? 'bg-slate-100 text-slate-700 border-slate-200'
            : 'bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
        } ${className}`}
        style={{ boxShadow: 'none' }}
        title="SLA clock paused"
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"
          style={{ display: 'inline-block' }}
        />
        <span>Paused (On Hold)</span>
      </span>
    );
  }

  const { text: formattedText, urgency: computedUrgency } = formatSecondsToSla(secondsLeft);
  const urgency: SlaUrgency = (isBreached && secondsLeft > 0) ? 'overdue' : computedUrgency;
  const text = (isBreached && secondsLeft > 0) ? 'Breached' : formattedText;

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
          ? 'SLA breached'
          : urgency === 'warning'
          ? 'Approaching SLA target'
          : 'SLA on track'
      }
    >
      <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${dotClasses}`} style={dotStyle} />
      <span className="font-mono tabular-nums whitespace-nowrap">{text}</span>
    </span>
  );
});

export default SlaBadge;
