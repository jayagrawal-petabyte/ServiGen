import React, { useState } from 'react';
import { RefreshButton } from '../../../components/shared/RefreshButton';
import { ResetButton } from '../../../components/shared/ResetButton';
import { Button } from '../../../components/shared/Button';
import { Plus } from 'lucide-react';

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
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 min-w-0">
        {/* Left: Record count + Pagination */}
        <div className="flex items-center gap-2 shrink-0">
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

        {/* Right: Refresh + New + Feed */}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5 min-w-0">
          <RefreshButton
            size="sm"
            onClick={handleRefresh}
            isLoading={spinning}
            title="Refresh major incidents from database"
          />

          <Button
            type="button"
            onClick={handleNew}
            size="sm"
            variant="primary"
            icon={<Plus className="w-3.5 h-3.5" />}
            title="Create New Major Incident"
          >
            New
          </Button>

          {onResetDemo && (
            <ResetButton
              onClick={onResetDemo}
              className="hidden lg:inline-flex"
              label="Reset Demo"
              title="Reset the 3 demo incidents to their initial stages"
            />
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
            <svg className="w-3.5 h-3.5 text-[#C96F55] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
