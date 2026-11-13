import React, { useState } from 'react';

interface PageHeaderProps {
  onToggleFeed?: () => void;
  feedOpen?: boolean;
  feedNewCount?: number;
  totalCount?: number;
  pageStart?: number;
  pageEnd?: number;
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onRefresh?: () => void;
  onResetDemo?: () => void;
  onNew?: () => void;
  onGetStarted?: () => void;
  breadcrumb?: string;
  onSearchFocus?: () => void;
  notifCount?: number;
  onNotifications?: () => void;
  onTasks?: () => void;
  onPerformance?: () => void;
  onStatus?: () => void;
  onHistory?: () => void;
  onHelp?: () => void;
  onProfile?: () => void;
}

const IconBtn: React.FC<{ children: React.ReactNode; label: string; badge?: number; onClick?: () => void }> = ({ children, label, badge, onClick }) => (
  <button
    aria-label={label}
    onClick={onClick}
    className="relative w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
  >
    {children}
    {badge != null && badge > 0 && (
      <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

const PageHeader: React.FC<PageHeaderProps> = ({
  onToggleFeed,
  feedNewCount = 0,
  totalCount = 0,
  pageStart,
  pageEnd,
  onPrev,
  onNext,
  prevDisabled = true,
  nextDisabled = true,
  searchQuery = '',
  onSearchChange,
  onRefresh,
  onResetDemo,
  onNew,
  onGetStarted,
  breadcrumb = 'Update Required',
  onSearchFocus,
  notifCount = 0,
  onNotifications,
  onTasks,
  onPerformance,
  onStatus,
  onHistory,
  onHelp,
  onProfile,
}) => {
  const [spinning, setSpinning] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    onRefresh?.();
    setTimeout(() => setSpinning(false), 600);
  };

  const handleNew = () => {
    onNew?.();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2800);
  };

  return (
    <div className="shrink-0 bg-white border-b border-gray-200 relative select-none">
      <div className="flex items-center justify-between gap-2 px-3 py-2 min-w-0">
        {/* Left: New Incident CTA + Pagination */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleNew}
            className="flex items-center gap-1 bg-[#eb6a47] hover:bg-[#db5936] text-white text-xs font-semibold px-2.5 py-1 rounded-full transition-colors shadow-2xs whitespace-nowrap cursor-pointer active:scale-95"
            title="Create New Major Incident"
          >
            <span className="text-sm leading-none font-light">+</span>
            <span>New</span>
          </button>

          <span className="text-xs text-gray-500 whitespace-nowrap">
            {totalCount === 0
              ? '0-0 of 0'
              : `${pageStart ?? 1}–${pageEnd ?? totalCount} of ${totalCount}`}
          </span>

          <div className="flex items-center gap-0.5">
            <button
              onClick={onPrev}
              disabled={prevDisabled}
              className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 text-xs transition-colors cursor-pointer"
              title="Previous Page"
            >
              ‹
            </button>
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 text-xs transition-colors cursor-pointer"
              title="Next Page"
            >
              ›
            </button>
          </div>
        </div>

        {/* Right: Search + Refresh + Feed */}
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          {onSearchChange && (
            <div className="relative min-w-[70px] max-w-[130px] flex-1">
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="text-xs border border-gray-200 rounded-full pl-2.5 pr-6 py-1 w-full outline-none focus:border-[#eb6a47] focus:ring-1 focus:ring-[#f8c5b1] bg-gray-50 transition-all"
              />
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          )}

          <button
            onClick={handleRefresh}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors shrink-0"
            aria-label="Refresh"
            title="Refresh major incidents from database"
          >
            <svg
              className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>

          {onResetDemo && (
            <button
              onClick={onResetDemo}
              className="hidden lg:inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 hover:text-amber-700 bg-gray-100 hover:bg-amber-50 border border-gray-200 hover:border-amber-200 px-2 py-0.5 rounded-full transition-colors whitespace-nowrap shrink-0"
              title="Reset the 3 demo incidents to their initial stages"
            >
              <span>↺ Reset</span>
            </button>
          )}

          {onToggleFeed && (
            <button
              onClick={onToggleFeed}
              className="relative w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors shrink-0"
              aria-label="Toggle feed"
            >
              <span className="text-sm leading-none tracking-wider">···</span>
              {feedNewCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold">
                  {feedNewCount > 9 ? '9+' : feedNewCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {showToast && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-[calc(100%+6px)] z-50 pointer-events-none">
          <div className="flex items-center gap-2 bg-gray-800 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-xl">
            <svg className="w-3.5 h-3.5 text-[#eb6a47] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            New Major Incident form opening…
          </div>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
