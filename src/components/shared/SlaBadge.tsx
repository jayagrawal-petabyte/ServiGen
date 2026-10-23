import React from 'react';

export type SlaUrgency = 'safe' | 'warning' | 'overdue';

/**
 * Parses numeric minutes or formatted string to determine SLA urgency & display text:
 * - Positive and > 24h remaining: "success" / "green" theme color
 * - Between 0 and 24h remaining: "warning" / "amber" theme color
 * - Negative (overdue): "danger" / "error" theme color, display "Overdue SLA"
 */
export function getSlaInfo(
  slaTimeLeft?: number | string | null,
  slaFormatted?: string | null
): { text: string; urgency: SlaUrgency } {
  if (slaTimeLeft == null && !slaFormatted) {
    return { text: '—', urgency: 'safe' };
  }

  const rawStr = String(slaFormatted || (typeof slaTimeLeft === 'string' ? slaTimeLeft : '')).trim();

  // Negative / overdue string patterns
  if (
    rawStr.startsWith('-') ||
    rawStr.toLowerCase().includes('overdue') ||
    rawStr.toLowerCase().includes('breach')
  ) {
    return { text: 'Overdue SLA', urgency: 'overdue' };
  }

  // Numeric time left (minutes)
  if (typeof slaTimeLeft === 'number') {
    if (slaTimeLeft < 0) {
      return { text: 'Overdue SLA', urgency: 'overdue' };
    }
    const hours = slaTimeLeft / 60;
    if (hours <= 24) {
      const h = Math.floor(hours);
      const m = Math.round(slaTimeLeft % 60);
      const text = h > 0 ? (m > 0 ? `${h}h ${m}m left` : `${h}h left`) : `${m}m left`;
      return { text, urgency: 'warning' };
    } else {
      const days = Math.floor(hours / 24);
      const remHours = Math.round(hours % 24);
      const text = remHours > 0 ? `${days}d ${remHours}h left` : `${days}d left`;
      return { text, urgency: 'safe' };
    }
  }

  // String parsing for days/hours
  if (rawStr) {
    const dayMatch = rawStr.match(/(\d+)\s*d/i);
    if (dayMatch) {
      const days = parseInt(dayMatch[1], 10);
      const hourMatch = rawStr.match(/(\d+)\s*h/i);
      const hours = days * 24 + (hourMatch ? parseInt(hourMatch[1], 10) : 0);
      if (hours > 24) {
        return { text: rawStr, urgency: 'safe' };
      }
      return { text: rawStr, urgency: 'warning' };
    }

    const hourMatch = rawStr.match(/(\d+)\s*h/i);
    if (hourMatch) {
      const hours = parseInt(hourMatch[1], 10);
      if (hours > 24) {
        return { text: rawStr, urgency: 'safe' };
      }
      return { text: rawStr, urgency: 'warning' };
    }

    // Pattern like "40:01" (hh:mm or mm:ss)
    const colonMatch = rawStr.match(/^(\d+):(\d+)$/);
    if (colonMatch) {
      const hours = parseInt(colonMatch[1], 10);
      if (hours > 24) {
        return { text: `${hours}h left`, urgency: 'safe' };
      }
      return { text: `${hours}h left`, urgency: 'warning' };
    }

    return { text: rawStr, urgency: 'safe' };
  }

  return { text: '—', urgency: 'safe' };
}

export interface SlaBadgeProps {
  slaTimeLeft?: number | string | null;
  slaFormatted?: string | null;
  className?: string;
}

export const SlaBadge: React.FC<SlaBadgeProps> = React.memo(({
  slaTimeLeft,
  slaFormatted,
  className = '',
}) => {
  const { text, urgency } = getSlaInfo(slaTimeLeft, slaFormatted);

  if (text === '—') {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  // Uses existing project utility classes & theme CSS variables (no hardcoded hex)
  let badgeClasses = '';
  let dotClasses = '';
  let customStyle: React.CSSProperties | undefined;
  let dotStyle: React.CSSProperties | undefined;

  if (urgency === 'overdue') {
    // Negative / Overdue: danger/error theme color
    badgeClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    dotClasses = 'bg-rose-600';
    customStyle = {
      backgroundColor: 'var(--badge-overdue-bg, #ffe4e6)',
      color: 'var(--badge-overdue-text, #e11d48)',
    };
    dotStyle = {
      backgroundColor: 'var(--badge-overdue-text, #e11d48)',
    };
  } else if (urgency === 'warning') {
    // 0 to 24h: warning/amber theme color
    badgeClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    dotClasses = 'bg-amber-500';
  } else {
    // > 24h: success/green theme color
    badgeClasses = 'bg-green-50 text-green-700 border-green-200';
    dotClasses = 'bg-green-600';
    customStyle = {
      backgroundColor: 'var(--badge-approved-bg, #dcfce7)',
      color: 'var(--badge-approved-text, #16a34a)',
    };
    dotStyle = {
      backgroundColor: 'var(--badge-approved-text, #16a34a)',
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClasses} ${className}`}
      style={customStyle}
    >
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${dotClasses}`} style={dotStyle} />
      <span>{text}</span>
    </span>
  );
});

export default SlaBadge;
