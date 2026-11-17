import React, { useState } from 'react';
import { SearchInput } from '../../../components/shared/SearchInput';

interface ProblemsSidebarProps {
  selectedListId: string;
  onSelectList: (id: string) => void;
  counts: Record<string, number>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export const ProblemsSidebar: React.FC<ProblemsSidebarProps> = ({
  selectedListId,
  onSelectList,
  counts,
  isCollapsed = false,
  onToggleCollapse,
  searchValue = '',
  onSearchChange,
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const currentSearch = onSearchChange !== undefined ? searchValue : internalSearch;
  const handleSearchChange = onSearchChange || setInternalSearch;

  const navItems = [
    { id: 'all-problems', label: 'All Problems', countKey: 'all' },
    { id: 'open-problems', label: 'Open Problems', countKey: 'open' },
    { id: 'investigation', label: 'Under Investigation', countKey: 'investigation' },
    { id: 'workaround', label: 'Workaround Identified', countKey: 'workaround' },
    { id: 'known-error', label: 'Known Error Database', countKey: 'known-error' },
    { id: 'my-team', label: 'My Team Problems', countKey: 'my-team' },
    { id: 'resolved', label: 'Resolved Problems', countKey: 'resolved' },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-[44px] min-w-[44px]' : 'w-[250px] min-w-[250px]'
      } shrink-0 bg-white border border-gray-200 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col self-stretch overflow-hidden relative select-none box-border transition-all duration-200 ease-in-out`}
    >
      {isCollapsed ? (
        <div className="flex flex-col h-full items-center py-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold transition-all cursor-pointer text-base select-none"
            title="Expand sidebar (»)"
            aria-label="Expand sidebar"
          >
            »
          </button>
        </div>
      ) : (
        <>
          <div className="p-3 pb-2 shrink-0">
            <SearchInput
              size="sm"
              value={currentSearch}
              onChange={handleSearchChange}
              placeholder="Search problem records..."
              className="bg-white"
            />
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 shrink-0">
            <div className="min-w-0">
              <div
                className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-[#C96F55] cursor-pointer transition-colors"
                onClick={() => onSelectList('open-problems')}
                title="Reset to Open Problems"
              >
                <span className="w-5 h-5 rounded-full bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center text-[10px] shrink-0 font-black">
                  !
                </span>
                <span className="truncate">Problems by Type</span>
              </div>
            </div>

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 font-bold transition-all cursor-pointer text-sm select-none shrink-0"
                title="Collapse sidebar («)"
                aria-label="Collapse sidebar"
              >
                «
              </button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto px-2 mt-2 pb-6 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = selectedListId === item.id;
              const count = counts[item.countKey] ?? 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectList(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full text-left text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#C96F55] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100/80 font-medium'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  <span
                    className={`ml-2 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white text-[#C96F55]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </>
      )}
    </aside>
  );
};
