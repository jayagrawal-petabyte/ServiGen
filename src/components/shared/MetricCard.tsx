import React from 'react';

export interface MetricCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  trend?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  iconContainerClassName?: string;
  onClick?: () => void;
  isLoading?: boolean;
  layout?: 'vertical' | 'horizontal';
  title?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  trend,
  icon,
  badge,
  className = '',
  valueClassName = '',
  labelClassName = '',
  iconContainerClassName = '',
  onClick,
  isLoading = false,
  layout = 'vertical',
  title,
}) => {
  const isClickable = Boolean(onClick);

  if (layout === 'horizontal') {
    return (
      <div
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        title={title}
        className={`bg-white rounded-xl sm:rounded-2xl border border-[#ebdcd3] p-4 sm:p-5 shadow-xs flex items-center gap-4 transition-all ${
          isClickable
            ? 'cursor-pointer hover:shadow-md hover:border-[#C96F55]/40 select-none active:scale-[0.99]'
            : ''
        } ${className}`}
      >
        {icon && (
          <div
            className={`w-11 h-11 rounded-xl sm:rounded-full flex items-center justify-center shrink-0 bg-[#FFF9F5] text-[#C96F55] ${iconContainerClassName}`}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div
            className={`text-2xl font-bold text-slate-900 leading-none truncate ${valueClassName}`}
          >
            {isLoading ? (
              <span className="inline-block w-12 h-6 bg-slate-200 animate-pulse rounded" />
            ) : (
              value
            )}
          </div>
          <div
            className={`text-xs text-slate-500 font-medium mt-1.5 truncate ${labelClassName}`}
          >
            {label}
          </div>
          {subtitle && (
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {subtitle}
            </div>
          )}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
    );
  }

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      title={title}
      className={`bg-white rounded-2xl p-4 sm:p-5 border border-[#ebdcd3] shadow-xs flex flex-col justify-between transition-all ${
        isClickable
          ? 'cursor-pointer hover:shadow-md hover:border-[#C96F55]/40 select-none active:scale-[0.99]'
          : ''
      } ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span
            className={`text-xs font-bold text-[#332B28]/70 uppercase tracking-wider truncate ${labelClassName}`}
          >
            {label}
          </span>
          {icon && (
            <div
              className={`p-1.5 rounded-lg bg-[#FFF9F5] text-[#C96F55] shrink-0 ${iconContainerClassName}`}
            >
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 mt-2 flex-wrap">
          <span
            className={`text-2xl sm:text-3xl font-black text-[#332B28] leading-tight ${valueClassName}`}
          >
            {isLoading ? (
              <span className="inline-block w-16 h-7 bg-slate-200 animate-pulse rounded" />
            ) : (
              value
            )}
          </span>
          {trend && <span className="shrink-0">{trend}</span>}
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
      </div>

      {subtitle && (
        <div className="text-[11px] text-[#332B28]/60 mt-1.5 leading-snug">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
