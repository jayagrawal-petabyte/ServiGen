import React, { useState, useMemo, useEffect } from 'react';
import MajorIncidentsSidebar from './components/MajorIncidentsSidebar';
import IncidentCard from './components/IncidentCard';
import ActivityFeed from './components/ActivityFeed';
import PageHeader from './components/PageHeader';
import NewIncidentModal from './components/NewIncidentModal';
import { MOCK_MAJOR_INCIDENTS, MOCK_FEED_ENTRIES } from './data/mockData';
import type { MajorIncident } from './types/majorIncident.types';

const filterByList = (incidents: MajorIncident[], listId: string): MajorIncident[] => {
  switch (listId) {
    case 'update-required':
      return incidents.filter((i) => !i.lifecycleStages[5]?.isCompleted);
    case 'my-team':
      return incidents.filter((i) => i.assignee !== 'Unassigned');
    case 'critical':
      return incidents.filter((i) => i.priority === 'Critical');
    case 'closed':
      return incidents.filter((i) => i.lifecycleStages[5]?.isCompleted);
    default:
      return incidents;
  }
};

const SCR022_MajorIncidentsLive: React.FC = () => {
  const [isFeedOpen, setIsFeedOpen]         = useState<boolean>(false);
  const [showNewModal, setShowNewModal]     = useState<boolean>(false);
  const [localIncidents, setLocalIncidents] = useState<MajorIncident[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('update-required');
  const [searchQuery, setSearchQuery]       = useState<string>('');
  const [page, setPage]                     = useState<number>(1);
  const PAGE_SIZE = 2;

  useEffect(() => { setPage(1); }, [selectedListId, searchQuery]);

  const allIncidents = useMemo(
    () => [...localIncidents, ...MOCK_MAJOR_INCIDENTS],
    [localIncidents]
  );

  const displayedIncidents = useMemo(() => {
    const byList = filterByList(allIncidents, selectedListId);
    if (!searchQuery.trim()) return byList;
    const q = searchQuery.toLowerCase();
    return byList.filter((i) => i.title.toLowerCase().includes(q) || i.id.includes(q));
  }, [allIncidents, selectedListId, searchQuery]);

  const totalCount     = displayedIncidents.length;
  const totalPages     = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageStart      = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd        = Math.min(page * PAGE_SIZE, totalCount);
  const pagedIncidents = displayedIncidents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAddIncident = (incident: MajorIncident) => {
    setLocalIncidents((prev) => [incident, ...prev]);
    setPage(1);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <MajorIncidentsSidebar onSelectList={setSelectedListId} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PageHeader
          totalCount={totalCount}
          pageStart={pageStart}
          pageEnd={pageEnd}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          prevDisabled={page <= 1}
          nextDisabled={page >= totalPages}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={() => { setSearchQuery(''); setPage(1); }}
          onToggleFeed={() => setIsFeedOpen((v) => !v)}
          onNew={() => setShowNewModal(true)}
          breadcrumb="Update Required"
        />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {displayedIncidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <p className="text-sm">No major incidents found</p>
              </div>
            ) : (
              pagedIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))
            )}
          </div>

          {isFeedOpen && (
            <ActivityFeed entries={MOCK_FEED_ENTRIES} onClose={() => setIsFeedOpen(false)} />
          )}
        </div>
      </main>

      {showNewModal && (
        <NewIncidentModal
          onClose={() => setShowNewModal(false)}
          onSubmit={handleAddIncident}
        />
      )}
    </div>
  );
};

export default SCR022_MajorIncidentsLive;
