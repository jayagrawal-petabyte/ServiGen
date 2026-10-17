import React, { useState } from 'react';
import { GlobalNavbarActions } from '../../../components/shared/GlobalNavbarActions';

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
    <header className="shrink-0 bg-white border-b border-gray-200 relative">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {/* Breadcrumb or title context handled below */}
        </div>

        <GlobalNavbarActions
          onGetStarted={onGetStarted ?? handleNew}
          onNewTicket={handleNew}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-1.5">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0 overflow-hidden">
          <span className="text-gray-400 hover:text-gray-600 cursor-pointer whitespace-nowrap">Major Incidents</span>
          <span className="text-gray-300">›</span>
          <span className="flex items-center gap-1 font-medium text-gray-700 whitespace-nowrap">
            {!breadcrumb.includes('🌐') && !breadcrumb.includes('📊') && !breadcrumb.includes('📅') && (
              <span className="w-3 h-3 bg-red-500 rounded-sm inline-block shrink-0" />
            )}
            {breadcrumb}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onPrev}
            disabled={prevDisabled}
            className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 text-xs transition-colors"
          >
            ‹
          </button>
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 text-xs transition-colors"
          >
            ›
          </button>

          <span className="text-xs text-gray-500 whitespace-nowrap">
            {totalCount === 0
              ? '0 of 0'
              : `${pageStart ?? 1}–${pageEnd ?? totalCount} of ${totalCount}`}
          </span>

          {onSearchChange && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="text-xs border border-gray-200 rounded-full pl-3 pr-6 py-1 w-32 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 bg-gray-50"
              />
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          )}

          <button
            onClick={handleRefresh}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Refresh"
          >
            <svg
              className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>

          <button
            onClick={handleNew}
            className="flex items-center gap-1 bg-cyan-400 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-1 rounded-full transition-colors shadow-sm whitespace-nowrap"
          >
            <span className="text-sm leading-none font-light">+</span> New
          </button>

          <button
            onClick={onToggleFeed}
            className="relative w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Toggle feed"
          >
            <span className="text-base leading-none tracking-widest">···</span>
            {feedNewCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold">
                {feedNewCount > 9 ? '9+' : feedNewCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {showToast && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-[calc(100%+6px)] z-50 pointer-events-none">
          <div className="flex items-center gap-2 bg-gray-800 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-xl">
            <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            New Major Incident form opening…
          </div>
        </div>
      )}
    </header>
  );
};

export default PageHeader;
