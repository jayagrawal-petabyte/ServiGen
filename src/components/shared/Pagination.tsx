import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentRange: string;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentRange,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 text-xs text-slate-500 ${className}`}>
      <span className="font-medium">{currentRange}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
