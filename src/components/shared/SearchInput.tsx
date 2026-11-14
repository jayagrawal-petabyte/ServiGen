import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onClear?: () => void;
  size?: 'sm' | 'md';
  iconPosition?: 'left' | 'right';
  ariaLabel?: string;
  id?: string;
  autoFocus?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  inputClassName = '',
  onClear,
  size = 'md',
  iconPosition = 'left',
  ariaLabel,
  id,
  autoFocus = false,
}) => {
  const isSm = size === 'sm';
  const heightPadding = isSm ? 'py-1.5 text-xs' : 'py-2 text-xs font-medium';
  const paddingLeft = iconPosition === 'left' ? 'pl-8' : 'pl-3.5';
  const paddingRight = (value ? 'pr-7' : iconPosition === 'right' ? 'pr-8' : 'pr-3.5');

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      {iconPosition === 'left' && (
        <Search
          className={`w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0`}
          aria-hidden="true"
        />
      )}

      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        autoFocus={autoFocus}
        className={`w-full rounded-full border border-slate-200 bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-[#C96F55] focus:ring-2 focus:ring-[#C96F55]/20 shadow-2xs ${heightPadding} ${paddingLeft} ${paddingRight} ${inputClassName}`}
      />

      {value ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 p-0.5 rounded-full transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : iconPosition === 'right' ? (
        <Search
          className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
};

export default SearchInput;
