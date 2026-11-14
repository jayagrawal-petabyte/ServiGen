import React from 'react';
import { RotateCcw } from 'lucide-react';

export interface ResetButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string;
  title?: string;
  disabled?: boolean;
  className?: string;
}

export const ResetButton: React.FC<ResetButtonProps> = ({
  onClick,
  label = 'Reset',
  title = 'Reset filters',
  disabled = false,
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap select-none shrink-0 ${className}`}
  >
    <RotateCcw className="h-3.5 w-3.5 shrink-0 text-slate-500" />
    <span>{label}</span>
  </button>
);

export default ResetButton;
