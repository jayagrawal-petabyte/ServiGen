import React, { useState, useMemo } from 'react';
import MajorIncidentsSidebar from './components/MajorIncidentsSidebar';
import IncidentCard from './components/IncidentCard';
import ActivityFeed from './components/ActivityFeed';
import { MOCK_MAJOR_INCIDENTS, MOCK_FEED_ENTRIES } from './data/mockData';
import type { MajorIncident } from './types/majorIncident.types';

const filterByList = (incidents: MajorIncident[], listId: string): MajorIncident[] => {
  switch (listId) {
    case 'update-required':
      return incidents.filter((i) => i.lifecycleStages[1]?.isCompleted && !i.lifecycleStages[2]?.isCompleted);
    case 'my-team':
      return incidents.filter((i) => i.assignee !== 'Unassigned');
    case 'critical':
      return incidents.filter((i) => i.priority === 'Critical');
    case 'closed':
      return incidents.filter((i) => i.lifecycleStages[5]?.isCompleted);
    case 'board':
    case 'calendar':
    case 'dashboard':
      return incidents;
    default:
      return incidents;
  }
};

const SCR022_MajorIncidentsLive: React.FC = () => {
  const [isFeedOpen, setIsFeedOpen]         = useState<boolean>(true);
  const [selectedListId, setSelectedListId] = useState<string>('update-required');
  const [searchQuery, setSearchQuery]       = useState<string>('');

  const displayedIncidents = useMemo(() => {
    const byList = filterByList(MOCK_MAJOR_INCIDENTS, selectedListId);
    if (!searchQuery.trim()) return byList;
    const q = searchQuery.toLowerCase();
    return byList.filter((i) => i.title.toLowerCase().includes(q) || i.id.includes(q));
  }, [selectedListId, searchQuery]);

  const totalCount = displayedIncidents.length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <MajorIncidentsSidebar onSelectList={setSelectedListId} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <button className="bg-orange-400 hover:bg-orange-500 text-white text-xs font-medium px-4 py-1.5 rounded-full transition-colors">
              Get started
            </button>
            <button className="flex items-center gap-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full transition-colors">
              <span className="text-base leading-none">+</span>
              New Ticket
            </button>
          </div>

          <div className="flex-1 max-w-xs mx-4">
            <input
              type="text"
              placeholder="Search by title or ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-full px-3 py-1.5 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-gray-50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <button
              onClick={() => setIsFeedOpen((prev) => !prev)}
              className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              <span className="text-base leading-none">+</span>
              New
            </button>
            <button className="text-gray-400 hover:text-gray-600 px-1" aria-label="More options">•••</button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <button className="hover:text-gray-700">‹</button>
              <span>{totalCount === 0 ? '0' : `1–${totalCount}`} of {totalCount}</span>
              <button className="hover:text-gray-700">›</button>
            </div>

            {displayedIncidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <p className="text-sm">No major incidents found</p>
              </div>
            ) : (
              displayedIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))
            )}
          </div>

          {isFeedOpen && (
            <ActivityFeed entries={MOCK_FEED_ENTRIES} onClose={() => setIsFeedOpen(false)} />
          )}
        </div>
      </main>
    </div>
  );
};

export default SCR022_MajorIncidentsLive;
