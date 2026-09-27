import React, { useState } from 'react';
import type { SidebarListItem } from '../types/majorIncident.types';
import { SIDEBAR_GROUPS } from '../data/mockData';
import {
  Search,
  ChevronDown,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  BarChart2,
  Calendar,
  Globe
} from 'lucide-react'; // Assuming lucide-react is installed, if not we will use SVG strings inline. I will use inline SVGs to be safe since we don't know the exact dependencies. Wait, I will write inline SVGs.

interface MajorIncidentsSidebarProps {
  onSelectList?: (id: string) => void;
}

const getIcon = (iconKey?: string) => {
  switch (iconKey) {
    case 'red-square':
      return <div className="w-3.5 h-3.5 rounded-sm bg-red-500 flex items-center justify-center shadow-[0_0_0_1px_rgba(0,0,0,0.1)] shrink-0"><div className="w-1.5 h-1.5 bg-white rounded-sm" /></div>;
    case 'clipboard':
      return <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
    case 'alert':
      return <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    case 'check':
      return <svg className="w-4 h-4 text-gray-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
    case 'chart':
      return <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case 'calendar':
      return <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case 'globe':
      return <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    default:
      return <div className="w-4 h-4 shrink-0" />; // placeholder
  }
};

const MajorIncidentsSidebar: React.FC<MajorIncidentsSidebarProps> = ({ onSelectList }) => {
  const [selectedId, setSelectedId] = useState<string>('update-required');

  const handleSelect = (item: SidebarListItem) => {
    setSelectedId(item.id);
    onSelectList?.(item.id);
  };

  return (
    <aside className="w-64 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Search Input */}
      <div className="p-4 shrink-0 pb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Major Incidents..."
            className="w-full pl-3 pr-8 py-1.5 text-sm bg-white border border-gray-300 rounded-full focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-gray-400"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* "My Lists" header section */}
      <div className="flex items-center justify-between px-4 py-2 mt-2">
        <div className="flex items-center gap-2 text-gray-700">
          <div className="w-6 h-6 rounded bg-cyan-400 flex items-center justify-center text-white shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <span className="font-semibold text-sm">My Lists</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Grouped navigation list */}
      <nav className="flex-1 overflow-y-auto px-2 mt-2 pb-20">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.groupLabel} className="mb-4">
            {/* Group label */}
            <p className="px-3 mb-1.5 text-sm font-medium text-gray-800">
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
                    pl-8 pr-3 py-1.5 rounded-lg text-left text-sm
                    transition-colors mb-0.5
                    ${isActive
                      ? 'bg-cyan-400 text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}
                  `}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Render Icon */}
                    {getIcon(item.iconKey)}
                    <span className="truncate leading-tight">{item.label}</span>
                  </div>

                  {/* Count badge */}
                  {item.count !== undefined && (
                    <span
                      className={`
                        ml-2 shrink-0 text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full
                        ${isActive
                          ? 'bg-white text-cyan-500'
                          : 'bg-cyan-400 text-white'}
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

      {/* Bottom Button */}
      <div className="absolute bottom-4 left-0 right-0 px-8 flex justify-center z-10 bg-gradient-to-t from-gray-50 to-transparent pt-8 pb-2">
        <button className="flex items-center justify-center gap-1.5 w-full max-w-[180px] bg-cyan-400 hover:bg-cyan-500 text-white text-sm font-medium py-1.5 rounded-full shadow-sm transition-colors">
          <span className="text-lg leading-none">+</span>
          Create a new List
        </button>
      </div>
    </aside>
  );
};

export default MajorIncidentsSidebar;
