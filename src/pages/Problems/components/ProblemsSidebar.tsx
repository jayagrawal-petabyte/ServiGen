import React, { useState } from 'react';
import { SearchInput } from '../../../components/shared/SearchInput';

interface ProblemsSidebarProps {
  selectedListId: string;
  onSelectList: (id: string) => void;
  counts: Record<string, number>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ProblemsSidebar: React.FC<ProblemsSidebarProps> = ({
  selectedListId,
  onSelectList,
  counts,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('Open Problems');

  const navItems = [
    { id: 'all-problems', label: 'All Problems', countKey: 'all' },
    { id: 'open-problems', label: 'Open Problems', countKey: 'open' },
    { id: 'investigation', label: 'Under Investigation', countKey: 'investigation' },
    { id: 'workaround', label: 'Workaround Identified', countKey: 'workaround' },
    { id: 'known-error', label: 'Known Error Database', countKey: 'known-error' },
    { id: 'my-team', label: 'My Team Problems', countKey: 'my-team' },
    { id: 'resolved', label: 'Resolved Problems', countKey: 'resolved' },
  ];

  const filteredItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <aside
      className={`${
        isCollapsed ? 'w-[44px] min-w-[44px]' : 'w-[250px] min-w-[250px]'
      } shrink-0 bg-[#FDE9E1] border border-[#ebdcd3] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col self-stretch overflow-hidden relative select-none box-border transition-all duration-200 ease-in-out`}
    >
      {isCollapsed ? (
        <div className="flex flex-col h-full items-center py-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#332B28] hover:text-[#1c0f0c] hover:bg-white/50 font-bold transition-all cursor-pointer text-base select-none"
            title="Expand sidebar (»)"
            aria-label="Expand sidebar"
          >
            »
          </button>
        </div>
      ) : (
        <>
          {/* Top Search Bar */}
          <div className="p-3 pb-2 shrink-0">
            <SearchInput
              size="sm"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search Problems..."
              className="bg-white"
            />
          </div>

          {/* Heading Row: Title & Subtitle Filter */}
          <div className="flex items-center justify-between border-b border-[#ebdcd3]/70 px-3.5 py-2.5 shrink-0">
            <div className="min-w-0">
              <div
                className="flex items-center gap-1.5 text-xs font-bold text-[#332B28] hover:text-[#C96F55] cursor-pointer transition-colors"
                onClick={() => onSelectList('open-problems')}
                title="Reset to Open Problems"
              >
                <span className="w-5 h-5 rounded-full bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center text-[10px] shrink-0 font-black">
                  !
                </span>
                <span className="truncate">Problems by Type</span>
              </div>
              {/* Filter dropdown subtitle */}
              <div className="relative mt-0.5">
                <button
                  type="button"
                  onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#332B28]/70 hover:text-[#332B28] cursor-pointer"
                >
                  <span>{isTypeMenuOpen ? '▲' : '▼'}</span>
                  <span>{typeFilter}</span>
                </button>
                {isTypeMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-[#ebdcd3] rounded-xl shadow-lg py-1 z-30 text-xs">
                    {['Open Problems', 'All Problems', 'Known Errors', 'Resolved'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setTypeFilter(opt);
                          setIsTypeMenuOpen(false);
                          if (opt === 'Open Problems') onSelectList('open-problems');
                          else if (opt === 'All Problems') onSelectList('all-problems');
                          else if (opt === 'Known Errors') onSelectList('known-error');
                          else if (opt === 'Resolved') onSelectList('resolved');
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-[#FDE9E1]/40 font-medium ${
                          typeFilter === opt ? 'text-[#C96F55] font-bold bg-[#C96F55]/10' : 'text-[#332B28]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Collapse Arrow Button */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#332B28]/70 hover:text-[#332B28] hover:bg-white/50 font-bold transition-all cursor-pointer text-sm select-none shrink-0"
                title="Collapse sidebar («)"
                aria-label="Collapse sidebar"
              >
                «
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-2 mt-2 pb-6 flex flex-col gap-1">
            {filteredItems.map((item) => {
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
                      : 'text-[#332B28] hover:bg-white/60 font-medium'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  <span
                    className={`ml-2 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white text-[#C96F55]'
                        : 'bg-white/80 text-[#332B28]/80 border border-[#ebdcd3]/60'
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
