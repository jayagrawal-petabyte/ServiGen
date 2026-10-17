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
    <div className={`flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1 text-xs font-bold text-slate-600 shadow-2xs select-none ${className}`}>
      <button
        disabled={!hasPrevious}
        onClick={onPrevious}
        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span>{currentRange}</span>
      <button
        disabled={!hasNext}
        onClick={onNext}
        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;
