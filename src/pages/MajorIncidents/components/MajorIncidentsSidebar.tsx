/**
 * MajorIncidentsSidebar — left navigation panel (SCR-021)
 *
 * Renders grouped list items (ACTIVE / ACTIONED / VIEWS) with count badges.
 * Selection state is owned by the parent (SCR021_MajorIncidentsDesign) and
 * passed back up via onSelectList.
 */

import React, { useState } from 'react';
import type { SidebarListItem } from '../types/majorIncident.types';
import { SIDEBAR_GROUPS } from '../data/mockData';

interface MajorIncidentsSidebarProps {
  onSelectList?: (id: string) => void;
}

const MajorIncidentsSidebar: React.FC<MajorIncidentsSidebarProps> = ({ onSelectList }) => {
  // Track which item is selected locally; default = 'new'
  const [selectedId, setSelectedId] = useState<string>('new');

  const handleSelect = (item: SidebarListItem) => {
    setSelectedId(item.id);
    onSelectList?.(item.id);
  };

  return (
    <aside className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">

      {/* ── Brand / logo strip ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
        {/* Coloured dot logo */}
        <span className="flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
          <span className="w-2 h-2 rounded-full bg-blue-600  inline-block" />
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        </span>
        <span className="font-bold text-sm text-gray-800 tracking-tight">ServiGen</span>
      </div>

      {/* ── "Major Incidents" module label ── */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Module</p>
        <p className="text-sm font-semibold text-gray-800">Major Incidents</p>
      </div>

      {/* ── Grouped navigation list ── */}
      <nav className="flex-1 px-2 pb-4">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.groupLabel} className="mt-4">

            {/* Group label */}
            <p className="px-2 mb-1 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              {group.groupLabel}
            </p>

            {/* Items */}
            {group.items.map((item) => {
              const isActive = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`
                    w-full flex items-center justify-between
                    px-2 py-1.5 rounded-md text-left text-sm
                    transition-colors mb-0.5
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}
                  `}
                >
                  <span className="truncate leading-tight">{item.label}</span>

                  {/* Count badge — show even if 0 */}
                  {item.count !== undefined && (
                    <span
                      className={`
                        ml-2 shrink-0 text-[11px] font-medium min-w-[18px] text-center
                        rounded-full px-1.5 py-0.5
                        ${isActive
                          ? 'bg-blue-100 text-blue-700'
                          : item.count > 0
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-transparent text-gray-300'}
                      `}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom: avatar / user row ── */}
      <div className="px-3 py-3 border-t border-gray-100 shrink-0 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          DU
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-800 truncate">Demo User</p>
          <p className="text-[10px] text-gray-400 truncate">Admin</p>
        </div>
      </div>

    </aside>
  );
};

export default MajorIncidentsSidebar;
