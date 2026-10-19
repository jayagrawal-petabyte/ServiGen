import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface ComboboxOption {
  value: string;
  /** Secondary line, e.g. a role or category path. */
  hint?: string;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  /** Allow values that are not in the list. */
  allowCustom?: boolean;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Styled combobox.
 *
 * Replaces `<input list=…>` + `<datalist>`. A native datalist is rendered and
 * positioned entirely by the browser: no CSS reaches it, so it arrives in the
 * OS's own styling (dark on Windows), and when there is no room below the field
 * the browser flips it upward over the form. This renders its own menu instead,
 * anchored under the input, in the app's visual language.
 */
export const Combobox: React.FC<ComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder,
  allowCustom = true,
  id,
  disabled,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.value.toLowerCase().includes(q) || (o.hint || '').toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const commit = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { setOpen(true); setActiveIndex(0); return; }
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered[activeIndex]) {
        e.preventDefault();
        commit(filtered[activeIndex].value);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={open ? query : value}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            if (!open) setOpen(true);
            if (allowCustom) onChange(e.target.value);
          }}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onKeyDown={onKeyDown}
          className="w-full text-sm border border-gray-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:border-[#eb6a47] focus:ring-1 focus:ring-[#f8c5b1] bg-gray-50 placeholder-gray-400 disabled:opacity-60"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Close options' : 'Show options'}
          onClick={() => setOpen((o) => !o)}
          className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600"
        >
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-[12px] text-gray-400">No matches</li>
          )}
          {filtered.map((opt, i) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                data-active={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => commit(opt.value)}
                className={`flex w-full flex-col items-start px-3 py-1.5 text-left transition-colors ${
                  i === activeIndex ? 'bg-[#fdeee9]' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-[13px] font-medium text-gray-800">{opt.value}</span>
                {opt.hint && <span className="text-[11px] text-gray-500">{opt.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Combobox;
