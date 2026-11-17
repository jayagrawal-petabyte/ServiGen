import React from 'react';
import { Search, X } from 'lucide-react';

export interface FilterToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  resultCount?: number;
  totalCount?: number;
  countLabel?: string;
  onClear?: () => void;
  className?: string;
  searchClassName?: string;
  children?: React.ReactNode;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  actions,
  resultCount,
  totalCount,
  countLabel,
  onClear,
  className = '',
  searchClassName = '',
  children,
}) => {
  const showSearch = onSearchChange !== undefined && search !== undefined;
  const hasCounts = resultCount !== undefined;

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onSearchChange) {
      onSearchChange('');
    }
  };

  return (
    <div
      className={`bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
        {showSearch && (
          <div className={`relative flex-1 max-w-full sm:max-w-xs md:max-w-sm ${searchClassName}`}>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C96F55]/40 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400 font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {filters && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters}
          </div>
        )}

        {children}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
        {hasCounts && (
          <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
            {countLabel ? (
              countLabel
            ) : totalCount !== undefined ? (
              <span>
                Showing <strong>{resultCount}</strong> of {totalCount}
              </span>
            ) : (
              <span>
                <strong>{resultCount}</strong> {resultCount === 1 ? 'result' : 'results'}
              </span>
            )}
          </div>
        )}

        {actions && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterToolbar;
