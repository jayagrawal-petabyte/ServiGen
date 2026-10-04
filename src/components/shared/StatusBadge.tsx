import React from 'react';

export interface StatusBadgeProps {
  label: string;
  variant?: 'green' | 'blue' | 'orange' | 'yellow' | 'red' | 'purple' | 'gray';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'blue',
  size = 'md',
}) => {
  const variantStyles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {label}
    </span>
  );
};
