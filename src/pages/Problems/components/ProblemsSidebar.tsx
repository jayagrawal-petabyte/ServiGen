import React, { useState } from 'react';

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
          {/* Top Search Bar */}
          <div className="p-3 pb-2 shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search Problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder-slate-400 pl-3 pr-8 py-1.5 rounded-full outline-none transition-all border border-slate-200 focus:border-[#eb6a47] focus:ring-1 focus:ring-[#eb6a47]/30 shadow-inner font-medium"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer p-0.5"
                  title="Clear search"
                >
                  ✕
                </button>
              ) : (
                <svg
                  className="absolute right-3 w-3.5 h-3.5 text-slate-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16" y2="16" />
                </svg>
              )}
            </div>
          </div>

          {/* Heading Row: Title & Subtitle Filter */}
          <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 shrink-0">
            <div className="min-w-0">
              <div
                className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-[#eb6a47] cursor-pointer transition-colors"
                onClick={() => onSelectList('open-problems')}
                title="Reset to Open Problems"
              >
                <span className="w-5 h-5 rounded-full bg-[#eb6a47]/10 text-[#eb6a47] flex items-center justify-center text-[10px] shrink-0 font-black">
                  !
                </span>
                <span className="truncate">Problems by Type</span>
              </div>
              {/* Filter dropdown subtitle */}
              <div className="relative mt-0.5">
                <button
                  type="button"
                  onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <span>{isTypeMenuOpen ? '▲' : '▼'}</span>
                  <span>{typeFilter}</span>
                </button>
                {isTypeMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 text-xs">
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
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium ${
                          typeFilter === opt ? 'text-[#eb6a47] font-bold bg-[#eb6a47]/5' : 'text-slate-700'
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
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 font-bold transition-all cursor-pointer text-sm select-none shrink-0"
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#eb6a47] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100/80 font-medium'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  <span
                    className={`ml-2 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-[#eb6a47]' : 'bg-slate-100 text-slate-600'
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
