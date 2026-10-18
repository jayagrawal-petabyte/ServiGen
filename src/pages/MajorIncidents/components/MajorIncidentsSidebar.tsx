import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { SidebarListItem, SidebarGroup } from '../types/majorIncident.types';

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    groupLabel: 'Active',
    items: [
      { id: 'update-required', label: 'Update Required', count: 3, isSelected: true, iconKey: 'red-square' },
      { id: 'my-team', label: 'My Team', count: 3, iconKey: 'clipboard' },
      { id: 'critical', label: 'Critical Major Incidents', count: 2, iconKey: 'alert' },
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
}

const getIcon = (iconKey?: string) => {
  switch (iconKey) {
    case 'red-square':
      return (
        <div className="w-3.5 h-3.5 rounded-sm bg-red-500 flex items-center justify-center shrink-0">
          <div className="w-1.5 h-1.5 bg-white rounded-sm" />
        </div>
      );
    case 'clipboard':
      return (
        <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case 'alert':
      return (
        <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'check':
      return (
        <svg className="w-4 h-4 text-gray-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'chart':
      return (
        <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'globe':
      return (
        <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return <div className="w-4 h-4 shrink-0" />;
  }
};

const MajorIncidentsSidebar: React.FC<MajorIncidentsSidebarProps> = ({ onSelectList, counts }) => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId]   = useState<string>('update-required');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [listsOpen, setListsOpen]     = useState<boolean>(true);
  const [isCreating, setIsCreating]   = useState<boolean>(false);
  const [newListName, setNewListName] = useState<string>('');
  const [customLists, setCustomLists] = useState<Array<{ id: string; label: string }>>([]);
  const newListInputRef               = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) {
      newListInputRef.current?.focus();
    }
  }, [isCreating]);

  const handleCreateList = () => {
    const name = newListName.trim();
    if (!name) { setIsCreating(false); return; }
    const id = `custom-${Date.now()}`;
    setCustomLists((prev) => [...prev, { id, label: name }]);
    setSelectedId(id);
    onSelectList?.(id);
    setNewListName('');
    setIsCreating(false);
  };

  const handleSelect = (item: SidebarListItem) => {
    setSelectedId(item.id);
    onSelectList?.(item.id);
    if (item.id === 'calendar') {
      navigate('/calendar');
    } else if (item.id === 'dashboard') {
      navigate('/dashboard');
    } else if (item.id === 'board') {
      navigate('/major-incidents/live');
    }
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
    <aside className="w-64 shrink-0 bg-[#e49b8e] border-r border-[#d4887b] flex flex-col h-full overflow-hidden relative select-none">
      <div className="p-4 shrink-0 pb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Major Incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-8 py-1.5 text-xs bg-white text-gray-800 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[#13273e]/20 placeholder-gray-400 shadow-2xs"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <button
        onClick={() => setListsOpen((v) => !v)}
        className="flex items-center justify-between px-4 py-2 mt-1 w-full hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-[#3a201a]">
          <div className="w-5 h-5 rounded bg-[#13273e] flex items-center justify-center text-white shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <span className="font-bold text-sm">My Lists</span>
        </div>
        <svg
          className={`w-4 h-4 text-[#3a201a] transition-transform duration-200 ${listsOpen ? 'rotate-180' : 'rotate-0'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {listsOpen && (
        <nav className="flex-1 overflow-y-auto px-2 mt-2 pb-20">
          {filteredGroups.length === 0 ? (
            <p className="px-3 py-4 text-xs text-[#542d25] text-center">No results for "{searchQuery}"</p>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.groupLabel} className="mb-3.5">
                <p className="px-3 mb-1 text-[11px] font-bold text-[#542d25] tracking-wider uppercase">{group.groupLabel}</p>
                {group.items.map((item) => {
                  const isActive = item.id === selectedId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left text-xs transition-colors mb-0.5 ${
                        isActive
                          ? 'bg-[#d28072] text-[#1c0f0c] font-bold shadow-2xs'
                          : 'text-[#3a201a] hover:bg-black/5 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {getIcon(item.iconKey)}
                        <span className="truncate leading-tight">{item.label}</span>
                      </div>
                      {(() => {
                        const countVal = counts && counts[item.id] !== undefined ? counts[item.id] : item.count;
                        if (countVal === undefined) return null;
                        return (
                          <span className={`ml-2 shrink-0 text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                            isActive ? 'bg-white/80 text-[#3a201a]' : 'bg-white/40 text-[#3a201a]'
                          }`}>
                            {countVal}
                          </span>
                        );
                      })()}
                    </button>
                  );
                })}
              </div>
            ))
          )}

          {/* Custom lists */}
          {customLists.length > 0 && (
            <div className="mb-3.5">
              <p className="px-3 mb-1 text-[11px] font-bold text-[#542d25] tracking-wider uppercase">Custom</p>
              {customLists.map((item) => {
                const isActive = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setSelectedId(item.id); onSelectList?.(item.id); }}
                    className={`w-full flex items-center px-3 py-1.5 rounded-lg text-left text-xs transition-colors mb-0.5 ${
                      isActive ? 'bg-[#d28072] text-[#1c0f0c] font-bold shadow-2xs' : 'text-[#3a201a] hover:bg-black/5 font-medium'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Inline create form & 'Create a new List' Button */}
          <div className="pt-2 px-1">
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
                        if (e.key === 'Escape') { setIsCreating(false); setNewListName(''); }
                      }}
                      placeholder="List name…"
                      className="flex-1 text-xs text-gray-700 outline-none bg-transparent placeholder-gray-400"
                    />
                    <button
                      onClick={handleCreateList}
                      className="shrink-0 text-[11px] font-semibold text-white bg-[#13273e] hover:bg-[#0c1a2b] px-2 py-0.5 rounded transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setIsCreating(false); setNewListName(''); }}
                      className="shrink-0 text-gray-400 hover:text-gray-600"
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
              onClick={() => { setIsCreating((v) => !v); if (!listsOpen) setListsOpen(true); }}
              className="flex items-center justify-center gap-2 w-full bg-[#13273e] hover:bg-[#0c1a2b] text-white text-xs font-semibold py-2 px-3 rounded-full shadow-md transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8" />
              </svg>
              <span>Create a new List</span>
            </button>
          </div>
        </nav>
      )}
    </aside>
  );
};

export default MajorIncidentsSidebar;
