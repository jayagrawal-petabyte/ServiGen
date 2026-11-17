import React from 'react';

export interface SegmentedTab<T extends string = string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number | string;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedTabsProps<T extends string = string> {
  tabs: SegmentedTab<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  variant?: 'pill' | 'underline' | 'boxed';
  theme?: 'navy' | 'terracotta' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tabClassName?: string;
  ariaLabel?: string;
}

export function SegmentedTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  theme = 'navy',
  size = 'md',
  className = '',
  tabClassName = '',
  ariaLabel = 'Navigation tabs',
}: SegmentedTabsProps<T>) {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-xs sm:text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2.5',
  };

  const getActiveThemeClasses = () => {
    if (variant === 'underline') {
      if (theme === 'terracotta') {
        return 'border-b-2 border-[#C96F55] text-[#C96F55] font-bold';
      }
      return 'border-b-2 border-[#263B5E] text-[#263B5E] font-bold';
    }

    if (variant === 'boxed') {
      if (theme === 'terracotta') {
        return 'bg-[#C96F55] text-white shadow-2xs font-bold';
      }
      return 'bg-white text-slate-900 shadow-2xs font-bold';
    }

    if (theme === 'terracotta') {
      return 'bg-[#C96F55] text-white shadow-xs font-bold';
    }
    return 'bg-[#263B5E] text-white shadow-xs font-bold';
  };

  const getInactiveThemeClasses = () => {
    if (variant === 'underline') {
      return 'border-b-2 border-transparent text-slate-500 hover:text-slate-800';
    }
    if (variant === 'boxed') {
      return 'text-slate-600 hover:text-slate-900';
    }
    return 'text-[#332B28] hover:bg-[#FFF9F5] border border-transparent';
  };

  const containerClasses = {
    pill: 'flex items-center gap-1.5 overflow-x-auto select-none py-1',
    underline: 'flex items-center gap-6 overflow-x-auto select-none border-b border-slate-200',
    boxed: 'inline-flex items-center bg-slate-100 p-1 rounded-xl select-none',
  };

  const tabBaseClasses = {
    pill: 'rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center',
    underline: 'pb-3 font-medium transition-colors cursor-pointer whitespace-nowrap inline-flex items-center',
    boxed: 'rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center',
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % tabs.length;
      if (!tabs[nextIndex].disabled) {
        onChange(tabs[nextIndex].id);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      if (!tabs[prevIndex].disabled) {
        onChange(tabs[prevIndex].id);
      }
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`${containerClasses[variant]} ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        const disabled = Boolean(tab.disabled);

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            disabled={disabled}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => !disabled && onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`
              ${tabBaseClasses[variant]}
              ${sizeClasses[size]}
              ${isActive ? getActiveThemeClasses() : getInactiveThemeClasses()}
              ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
              ${tabClassName}
            `}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold transition-colors ${
                  isActive
                    ? variant === 'underline'
                      ? 'bg-[#263B5E]/10 text-[#263B5E]'
                      : 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
            {tab.badge && <span className="shrink-0">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedTabs;
