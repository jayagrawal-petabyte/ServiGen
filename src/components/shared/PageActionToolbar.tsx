import React from 'react';

export interface PageActionToolbarProps {
  search?: React.ReactNode;
  filters?: React.ReactNode;
  pagination?: React.ReactNode;
  refresh?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  overflowMenu?: React.ReactNode;
  resultCount?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const PageActionToolbar: React.FC<PageActionToolbarProps> = ({
  search,
  filters,
  pagination,
  refresh,
  primaryAction,
  secondaryActions,
  overflowMenu,
  resultCount,
  className = '',
  children,
}) => {
  return (
    <div
      className={`bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
        {search && <div className="w-full sm:w-auto sm:min-w-[220px] max-w-sm">{search}</div>}
        {filters && <div className="flex items-center gap-2 flex-wrap">{filters}</div>}
        {children}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap shrink-0">
        {resultCount && (
          <div className="text-xs text-slate-500 font-medium whitespace-nowrap px-1">
            {resultCount}
          </div>
        )}
        {pagination && <div className="shrink-0">{pagination}</div>}
        {refresh && <div className="shrink-0">{refresh}</div>}
        {secondaryActions && <div className="flex items-center gap-1.5">{secondaryActions}</div>}
        {primaryAction && <div className="shrink-0">{primaryAction}</div>}
        {overflowMenu && <div className="shrink-0">{overflowMenu}</div>}
      </div>
    </div>
  );
};

export default PageActionToolbar;
