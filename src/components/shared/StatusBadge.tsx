import React from 'react';

export interface StatusBadgeProps {
  label: string;
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' | 'orange' | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
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
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'gray',
  size = 'md',
  className = '',
}) => {
  const chosenStyle = variantStyles[variant.toLowerCase()] || variantStyles.gray;
  const chosenSize = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${chosenStyle} ${chosenSize} ${className}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
