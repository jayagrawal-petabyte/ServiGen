import React from 'react';

export interface StatusBadgeProps {
  label?: string;
  status?: string;
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' | 'orange' | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function getStatusStyle(statusValue: string): {
  classes: string;
  style?: React.CSSProperties;
} {
  const norm = (statusValue || '').trim().toLowerCase();

  if (
    norm.includes('resolve') ||
    norm.includes('closed') ||
    norm.includes('complete') ||
    norm.includes('publish')
  ) {
    return {
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      style: {
        backgroundColor: 'var(--badge-approved-bg, #dcfce7)',
        color: 'var(--badge-approved-text, #16a34a)',
      },
    };
  }

  if (norm.includes('await') || norm.includes('approval')) {
    return {
      classes: 'bg-slate-900 text-white border-slate-900',
      style: {
        backgroundColor: 'var(--badge-awaiting-bg, #1e293b)',
        color: 'var(--badge-awaiting-text, #ffffff)',
      },
    };
  }

  if (norm.includes('reject')) {
    return {
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
      style: {
        backgroundColor: 'var(--badge-rejected-bg, #fee2e2)',
        color: 'var(--badge-rejected-text, #dc2626)',
      },
    };
  }

  if (norm.includes('hold') || norm.includes('pend')) {
    return {
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }

  if (norm.includes('progress') || norm.includes('action')) {
    return {
      classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  }

  if (norm.includes('draft')) {
    return {
      classes: 'bg-slate-100 text-slate-600 border-slate-200',
      style: {
        backgroundColor: 'var(--badge-draft-bg, #fdeee8)',
        color: 'var(--badge-draft-text, #b84c2a)',
      },
    };
  }

  if (norm.includes('open') || norm.includes('new') || norm.includes('active')) {
    return {
      classes: 'bg-sky-50 text-sky-700 border-sky-200',
    };
  }

  return {
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}

const variantStyles: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray: 'bg-slate-100 text-slate-700 border-slate-200',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({
  label,
  status,
  variant,
  size = 'md',
  className = '',
}) => {
  const displayLabel = status || label || 'Open';
  const sizeClass = sizeStyles[size] || sizeStyles.md;

  if (variant && variantStyles[variant.toLowerCase()]) {
    const chosenStyle = variantStyles[variant.toLowerCase()];
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full border whitespace-nowrap ${chosenStyle} ${sizeClass} ${className}`}
      >
        {displayLabel}
      </span>
    );
  }

  const { classes, style } = getStatusStyle(displayLabel);

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border whitespace-nowrap ${classes} ${sizeClass} ${className}`}
      style={style}
    >
      {displayLabel}
    </span>
  );
});

export const StatusPill = StatusBadge;

export default StatusBadge;
