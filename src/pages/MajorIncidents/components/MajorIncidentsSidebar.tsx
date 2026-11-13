import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SidebarListItem, SidebarGroup } from '../types/majorIncident.types';

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    groupLabel: 'Active',
    items: [
      { id: 'update-required', label: 'Updates Required', count: 3, isSelected: true, iconKey: 'updates-required' },
      { id: 'my-team', label: 'My Team', count: 3, iconKey: 'my-team' },
      { id: 'critical', label: 'Critical Major Incident', count: 2, iconKey: 'critical' },
    ],
  },
  {
    groupLabel: 'Actioned',
    items: [
      { id: 'closed', label: 'Closed Major Incidents', iconKey: 'check' },
    ],
  },
  {
    groupLabel: 'Views',
    items: [
      { id: 'board', label: 'Major Incident Board', count: 3, iconKey: 'chart' },
      { id: 'calendar', label: 'Major Incident Calendar', iconKey: 'calendar' },
      { id: 'dashboard', label: 'Major Incident Dashboard', count: 3, iconKey: 'globe' },
    ],
  },
];

interface MajorIncidentsSidebarProps {
  onSelectList?: (id: string) => void;
  counts?: Record<string, number>;
  selectedListId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

const getIcon = (iconKey?: string) => {
  switch (iconKey) {
    case 'updates-required':
    case 'red-square':
      return (
        <svg className="w-4 h-4 shrink-0 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          {/* Arrowhead at top left */}
          <path d="M3 4v5h5" />
          {/* Top arc sweeping across top and right */}
          <path d="M4.9 9A9 9 0 0 1 20.4 12" />
          {/* Bottom arc sweeping from lower left around bottom to right */}
          <path d="M3.5 16.5A9 9 0 0 0 11.5 21a9 9 0 0 0 6.5-2.8" />
          {/* Slashed circle badge at bottom right */}
          <circle cx="15.5" cy="15.5" r="3.8" strokeWidth={1.5} />
          <line x1="12.8" y1="12.8" x2="18.2" y2="18.2" strokeWidth={1.5} />
        </svg>
      );
    case 'my-team':
    case 'clipboard':
      return (
        <svg className="w-4 h-4 shrink-0 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          {/* Two persons outline */}
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'critical':
    case 'alert':
      return (
        <svg className="w-4 h-4 shrink-0 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          {/* Standalone clean exclamation point */}
          <line x1="12" y1="5" x2="12" y2="13" />
          <circle cx="12" cy="18" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'check':
      return (
        <svg className="w-4 h-4 shrink-0 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'chart':
      return (
        <svg className="w-4 h-4 shrink-0 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M8 7v10M13 7v6M18 7v8" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className="w-4 h-4 shrink-0 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case 'globe':
      return (
        <svg className="w-4 h-4 shrink-0 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
        </svg>
      );
    default:
      return <div className="w-4 h-4 shrink-0" />;
  }
};

export const MajorIncidentsSidebar: React.FC<MajorIncidentsSidebarProps> = ({
  onSelectList,
  counts,
  selectedListId: controlledSelectedId,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse,
}) => {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState<boolean>(false);
  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    if (onToggleCollapse) {
      onToggleCollapse(nextVal);
    } else {
      setInternalIsCollapsed(nextVal);
    }
  };

  const [selectedId, setSelectedId]   = useState<string>(controlledSelectedId || 'update-required');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Active: true,
    Actioned: true,
    Views: true,
    Custom: true,
  });

  const [isCreating, setIsCreating]   = useState<boolean>(false);
  const [newListName, setNewListName] = useState<string>('');
  const [customLists, setCustomLists] = useState<Array<{ id: string; label: string }>>([]);
  const newListInputRef               = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (controlledSelectedId) {
      setSelectedId(controlledSelectedId);
    }
  }, [controlledSelectedId]);

  useEffect(() => {
    if (isCreating) {
      newListInputRef.current?.focus();
    }
  }, [isCreating]);

  const handleToggleSection = (groupLabel: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

  const handleCreateList = () => {
    const name = newListName.trim();
    if (!name) {
      setIsCreating(false);
      return;
    }
    const id = `custom-${Date.now()}`;
    setCustomLists((prev) => [...prev, { id, label: name }]);
    setSelectedId(id);
    onSelectList?.(id);
    setNewListName('');
    setIsCreating(false);
  };

  const handleDeleteCustomList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomLists((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) {
      setSelectedId('update-required');
      onSelectList?.('update-required');
    }
  };

  const handleSelect = (item: { id: string; label: string }) => {
    setSelectedId(item.id);
    onSelectList?.(item.id);
  };

  const handleResetToDefault = () => {
    setSelectedId('update-required');
    onSelectList?.('update-required');
  };

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return SIDEBAR_GROUPS;
    return SIDEBAR_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(q)),
    })).filter((group) => group.items.length > 0);
  }, [searchQuery]);

  return (
    <aside
      className={`${
        isCollapsed ? 'w-[44px] min-w-[44px]' : 'w-[250px] min-w-[250px]'
      } shrink-0 bg-[#e49b8e] border border-[#d4887b] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col self-stretch overflow-hidden relative select-none box-border transition-all duration-200 ease-in-out`}
    >
      {/* ── Collapsed (Minimized) Mode ── */}
      {isCollapsed ? (
        <div className="flex flex-col h-full items-center py-3">
          {/* Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3a201a] hover:text-[#1c0f0c] hover:bg-black/10 font-bold transition-all cursor-pointer text-base select-none"
            title="Expand sidebar (»)"
            aria-label="Expand sidebar"
          >
            »
          </button>
        </div>
      ) : (
        /* ── Expanded Normal Mode ── */
        <>
          {/* 1. Top Search Bar */}
          <div className="p-3 pb-2 shrink-0">
            <div className="relative flex items-center">
              <input
                id="major-incidents-sidebar-search-input"
                type="text"
                placeholder="Search Major Incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1c0f0c]/20 hover:bg-[#1c0f0c]/25 focus:bg-white text-xs text-[#1c0f0c] focus:text-gray-900 placeholder-[#542d25]/80 focus:placeholder-gray-400 pl-3 pr-8 py-1.5 rounded-full outline-none transition-all border border-black/10 focus:border-[#eb6a47] shadow-inner font-medium"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-xs text-[#542d25] hover:text-[#1c0f0c] font-bold cursor-pointer p-0.5"
                  title="Clear search"
                >
                  ✕
                </button>
              ) : (
                <svg className="absolute right-3 w-3.5 h-3.5 text-[#542d25] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16" y2="16" />
                </svg>
              )}
            </div>
          </div>

          {/* 2. Header Row: Title & Collapse Arrow */}
          <div className="flex items-center justify-between border-b border-[#d4887b] px-3.5 py-2.5 shrink-0">
            {/* Title with click to reset */}
            <div
              className="flex items-center gap-2 text-[13px] font-bold text-[#3a201a] hover:text-[#1c0f0c] cursor-pointer transition-colors select-none"
              onClick={handleResetToDefault}
              title="Reset to Updates Required"
            >
              <svg
                className="w-4 h-4 shrink-0 text-[#3a201a]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="truncate">Major Incidents</span>
            </div>

            {/* Collapse / Reduce Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#3a201a] hover:text-[#1c0f0c] hover:bg-black/10 font-bold transition-all cursor-pointer text-sm select-none shrink-0"
              title="Collapse sidebar («)"
              aria-label="Collapse sidebar"
            >
              «
            </button>
          </div>

          {/* 3. Navigation Tree with Collapsible Sections */}
          <nav className="flex-1 overflow-y-auto px-2 mt-2 pb-6 flex flex-col gap-2">
            {filteredGroups.length === 0 ? (
              <p className="px-3 py-4 text-xs text-[#542d25] text-center">No results for "{searchQuery}"</p>
            ) : (
              filteredGroups.map((group) => {
                const isGroupExpanded = expandedSections[group.groupLabel] !== false;
                const totalGroupCount = group.items.reduce((sum, item) => {
                  const val = counts && counts[item.id] !== undefined ? counts[item.id] : (item.count || 0);
                  return sum + val;
                }, 0);

                return (
                  <div key={group.groupLabel} className="flex flex-col">
                    {/* Collapsible Group Header Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleSection(group.groupLabel)}
                      className="w-full flex items-center justify-between px-2.5 py-1 text-left rounded-md hover:bg-black/5 transition-colors cursor-pointer mb-0.5 group"
                      title={`Toggle ${group.groupLabel} section`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#542d25] font-bold group-hover:text-[#1c0f0c] transition-colors">
                          {isGroupExpanded ? '▼' : '►'}
                        </span>
                        <span className="text-[11px] font-bold text-[#542d25] tracking-wider uppercase group-hover:text-[#1c0f0c] transition-colors">
                          {group.groupLabel}
                        </span>
                      </div>
                      {totalGroupCount > 0 && (
                        <span className="text-[10px] font-bold text-[#542d25]/80 bg-white/40 px-1.5 py-0.2 rounded-full">
                          {totalGroupCount}
                        </span>
                      )}
                    </button>

                    {/* Group Items */}
                    {isGroupExpanded && (
                      <div className="flex flex-col gap-0.5 pl-1.5">
                        {group.items.map((item) => {
                          const isActive = item.id === selectedId;
                          const countVal = counts && counts[item.id] !== undefined ? counts[item.id] : item.count;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelect(item)}
                              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-[#d28072] text-[#1c0f0c] font-bold shadow-2xs'
                                  : 'text-[#3a201a] hover:bg-black/5 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {getIcon(item.iconKey)}
                                <span className="truncate leading-tight">{item.label}</span>
                              </div>
                              {countVal !== undefined && (
                                <span
                                  className={`ml-2 shrink-0 text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                                    isActive ? 'bg-white/80 text-[#3a201a]' : 'bg-white/40 text-[#3a201a]'
                                  }`}
                                >
                                  {countVal}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Custom Lists Section */}
            {customLists.length > 0 && (
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleToggleSection('Custom')}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-left rounded-md hover:bg-black/5 transition-colors cursor-pointer mb-0.5 group"
                  title="Toggle Custom section"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#542d25] font-bold">
                      {expandedSections.Custom !== false ? '▼' : '►'}
                    </span>
                    <span className="text-[11px] font-bold text-[#542d25] tracking-wider uppercase">
                      Custom Lists
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#542d25]/80 bg-white/40 px-1.5 py-0.2 rounded-full">
                    {customLists.length}
                  </span>
                </button>

                {expandedSections.Custom !== false && (
                  <div className="flex flex-col gap-0.5 pl-1.5">
                    {customLists.map((item) => {
                      const isActive = item.id === selectedId;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer group ${
                            isActive
                              ? 'bg-[#d28072] text-[#1c0f0c] font-bold shadow-2xs'
                              : 'text-[#3a201a] hover:bg-black/5 font-medium'
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomList(item.id, e)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-700 p-0.5 text-[11px] transition-opacity cursor-pointer"
                            title="Delete custom list"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Inline Create Form & 'Create a new List' Button */}
            <div className="pt-2 px-1 shrink-0">
              <AnimatePresence>
                {isCreating && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="mb-2"
                  >
                    <div className="flex items-center gap-1.5 bg-white border border-[#13273e]/20 rounded-lg px-2.5 py-1.5 shadow-sm">
                      <input
                        ref={newListInputRef}
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateList();
                          if (e.key === 'Escape') {
                            setIsCreating(false);
                            setNewListName('');
                          }
                        }}
                        placeholder="List name…"
                        className="flex-1 text-xs text-gray-700 outline-none bg-transparent placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={handleCreateList}
                        className="shrink-0 text-[11px] font-semibold text-white bg-[#13273e] hover:bg-[#0c1a2b] px-2 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreating(false);
                          setNewListName('');
                        }}
                        className="shrink-0 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                        title="Cancel"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={() => setIsCreating((v) => !v)}
                className="flex items-center justify-center gap-2 w-full bg-[#13273e] hover:bg-[#0c1a2b] text-white text-xs font-semibold py-2 px-3 rounded-full shadow-md transition-all active:scale-[0.98] cursor-pointer"
                title="Click to create a new list"
              >
                <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8" />
                </svg>
                <span>Create a new List</span>
              </button>
            </div>
          </nav>
        </>
      )}
    </aside>
  );
};

export default MajorIncidentsSidebar;