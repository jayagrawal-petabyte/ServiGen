import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface RefreshButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  isLoading?: boolean;
  iconOnly?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  title?: string;
  disabled?: boolean;
  className?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onClick,
  isLoading = false,
  iconOnly = false,
  size = 'md',
  label = 'Refresh',
  title = 'Refresh data from server',
  disabled = false,
  className = '',
}) => {
  const iconSizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  if (iconOnly) {
    const circleSizeClass = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        title={title}
        aria-label={label || title}
        className={`rounded-full border border-slate-200 bg-white hover:bg-[#FFF9F5] text-slate-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C96F55]/40 hover:text-[#C96F55] active:scale-95 shrink-0 ${circleSizeClass} ${className}`}
      >
        <RefreshCw
          className={`${iconSizeClass} ${isLoading ? 'animate-spin text-[#C96F55]' : ''}`}
        />
      </button>
    );
  }

  const pillPaddingClass =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs'
      : 'px-3.5 py-1.5 sm:py-2 text-xs font-semibold';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-[#FFF9F5] text-slate-700 font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C96F55]/40 hover:text-[#C96F55] active:scale-95 whitespace-nowrap select-none shrink-0 ${pillPaddingClass} ${className}`}
    >
      <RefreshCw
        className={`${iconSizeClass} shrink-0 ${isLoading ? 'animate-spin text-[#C96F55]' : 'text-slate-500'}`}
      />
      <span>{isLoading ? 'Refreshing...' : label}</span>
    </button>
  );
};

export default RefreshButton;
