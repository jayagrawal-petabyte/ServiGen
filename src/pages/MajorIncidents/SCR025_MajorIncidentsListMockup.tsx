import React, { useState, useMemo, useEffect } from 'react';
import MajorIncidentsSidebar from './components/MajorIncidentsSidebar';
import { MOCK_MAJOR_INCIDENTS } from './data/mockData';
import PageHeader from './components/PageHeader';
import NewIncidentModal from './components/NewIncidentModal';
import type { MajorIncident, Priority } from './types/majorIncident.types';

const filterByList = (incidents: MajorIncident[], listId: string): MajorIncident[] => {
  switch (listId) {
    case 'update-required': return incidents.filter((i) => !i.lifecycleStages[5]?.isCompleted);
    case 'my-team':         return incidents.filter((i) => i.assignee !== 'Unassigned');
    case 'critical':        return incidents.filter((i) => i.priority === 'Critical');
    case 'closed':          return incidents.filter((i) => i.lifecycleStages[5]?.isCompleted);
    default:                return incidents;
  }
};

const PRIORITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const priorityColor: Record<Priority, { bg: string; text: string; dot: string }> = {
  Critical: { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'    },
  High:     { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  Medium:   { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  Low:      { bg: 'bg-gray-50',   text: 'text-gray-500',   dot: 'bg-gray-400'   },
};

const PriorityPill: React.FC<{ priority: Priority }> = ({ priority }) => {
  const c = priorityColor[priority];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${c.bg} ${c.text} border-transparent`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {priority}
    </span>
  );
};

const LifecycleBar: React.FC<{ stages: MajorIncident['lifecycleStages'] }> = ({ stages }) => (
  <div className="flex items-center gap-0.5">
    {stages.map((stage, i) => (
      <React.Fragment key={stage.label}>
        <div
          title={stage.label}
          className={`h-1.5 w-8 rounded-sm transition-colors ${
            stage.isCompleted
              ? 'bg-cyan-500'
              : stage.isActive
              ? 'bg-cyan-300'
              : 'bg-gray-200'
          }`}
        />
        {i < stages.length - 1 && <span className="w-0.5 h-1.5 bg-white" />}
      </React.Fragment>
    ))}
  </div>
);

const activeStageLabel = (incident: MajorIncident): string => {
  const active = incident.lifecycleStages.find((s) => s.isActive);
  return active?.label ?? 'Unknown';
};

const ListRow: React.FC<{ incident: MajorIncident; index: number }> = ({ incident, index }) => (
  <tr className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors group ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
    <td className="px-4 py-3 whitespace-nowrap">
      <span className="text-[11px] font-mono text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-full px-2 py-0.5">
        #{incident.id}
      </span>
    </td>
    <td className="px-4 py-3">
      <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700 transition-colors cursor-pointer line-clamp-1">
        {incident.title}
      </span>
    </td>
    <td className="px-4 py-3">
      <PriorityPill priority={incident.priority} />
    </td>
    <td className="px-4 py-3">
      <span className="text-[11px] font-medium text-gray-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
        {incident.product}
      </span>
    </td>
    <td className="px-4 py-3">
      <div className="flex flex-col gap-1">
        <LifecycleBar stages={incident.lifecycleStages} />
        <span className="text-[10px] text-gray-400">{activeStageLabel(incident)}</span>
      </div>
    </td>
    <td className="px-4 py-3 text-[11px] text-gray-500 whitespace-nowrap">
      {incident.resolutionTarget}
    </td>
    <td className="px-4 py-3">
      {incident.assignee === 'Unassigned' ? (
        <span className="text-[11px] text-gray-400 italic">Unassigned</span>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
            {incident.assignee.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </span>
          <span className="text-[11px] text-gray-700 truncate max-w-[90px]">{incident.assignee}</span>
        </div>
      )}
    </td>
    <td className="px-4 py-3 text-right">
      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-blue-600 hover:text-blue-800 font-medium">
        View →
      </button>
    </td>
  </tr>
);

const SCR025_MajorIncidentsListMockup: React.FC = () => {
  const [showNewModal, setShowNewModal]     = useState<boolean>(false);
  const [localIncidents, setLocalIncidents] = useState<MajorIncident[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('update-required');
  const [searchQuery, setSearchQuery]       = useState<string>('');
  const [sortDir, setSortDir]               = useState<'asc' | 'desc'>('desc');
  const [page, setPage]                     = useState<number>(1);
  const PAGE_SIZE = 5;

  useEffect(() => { setPage(1); }, [selectedListId, searchQuery, sortDir]);

  const allIncidents = useMemo(
    () => [...localIncidents, ...MOCK_MAJOR_INCIDENTS],
    [localIncidents]
  );

  const incidents = useMemo(() => {
    let list = filterByList(allIncidents, selectedListId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q) || i.id.includes(q));
    }
    return [...list].sort((a, b) => {
      const diff = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
      return sortDir === 'asc' ? -diff : diff;
    });
  }, [allIncidents, selectedListId, searchQuery, sortDir]);

  const totalCount     = incidents.length;
  const totalPages     = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageStart      = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd        = Math.min(page * PAGE_SIZE, totalCount);
  const pagedIncidents = incidents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          onRefresh={() => { setSearchQuery(''); setSortDir('desc'); setPage(1); }}
          onNew={() => setShowNewModal(true)}
          breadcrumb="List View"
        />

        <div className="flex-1 overflow-auto px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Major Incidents</span>
              <span className="text-gray-300">·</span>
              <span>{incidents.length} results</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <span>Sort:</span>
              <button
                onClick={() => setSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
                className="text-gray-600 font-medium hover:text-gray-800 transition-colors"
              >
                Priority {sortDir === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">ID</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide min-w-[160px]">Lifecycle</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Resolution Target</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Assignee</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {pagedIncidents.map((incident, i) => (
                  <ListRow key={incident.id} incident={incident} index={i} />
                ))}
              </tbody>
            </table>

            {incidents.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                No major incidents
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 text-[11px] text-gray-400 px-1">
            <span>Showing {pageStart}–{pageEnd} of {totalCount}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">‹ Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`px-2 py-1 rounded font-medium ${p === page ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">Next ›</button>
            </div>
          </div>
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

export default SCR025_MajorIncidentsListMockup;
