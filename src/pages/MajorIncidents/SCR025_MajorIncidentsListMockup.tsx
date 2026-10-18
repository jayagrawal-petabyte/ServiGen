import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MajorIncidentsSidebar from './components/MajorIncidentsSidebar';
import PageHeader from './components/PageHeader';
import NewIncidentModal from './components/NewIncidentModal';
import TicketDetailModal from '../../components/TicketDetailModal/TicketDetailModal';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { majorIncidentsService } from '../../services/majorIncidentsService';
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
              ? 'bg-[#eb6a47]'
              : stage.isActive
              ? 'bg-[#f8c5b1]'
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

const ListRow: React.FC<{
  incident: MajorIncident;
  index: number;
  onSelect: (inc: MajorIncident) => void;
  onOpenLive: (id: string) => void;
}> = ({ incident, index, onSelect, onOpenLive }) => (
  <tr 
    onClick={() => onSelect(incident)}
    className={`border-b border-gray-100 hover:bg-[#fdede7]/40 transition-colors group cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
  >
    <td className="px-4 py-3 whitespace-nowrap">
      <span className="text-[11px] font-mono font-bold text-[#db5936] bg-[#fdede7] border border-[#f8c5b1] rounded-full px-2 py-0.5 hover:bg-[#fbdcd0] transition-colors">
        #{incident.id}
      </span>
    </td>
    <td className="px-4 py-3">
      <span className="text-sm font-medium text-gray-800 group-hover:text-[#db5936] transition-colors line-clamp-1">
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
          <span className="w-5 h-5 rounded-full bg-[#eb6a47] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
            {incident.assignee.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </span>
          <span className="text-[11px] text-gray-700 truncate max-w-[90px]">{incident.assignee}</span>
        </div>
      )}
    </td>
    <td className="px-4 py-3 text-right">
      <div className="flex items-center justify-end gap-2">
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(incident); }}
          className="text-[11px] text-[#eb6a47] hover:text-[#db5936] font-semibold px-2 py-0.5 rounded hover:bg-[#fdede7] transition-colors"
        >
          Details
        </button>
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenLive(incident.id); }}
          className="text-[11px] text-gray-500 hover:text-gray-800 font-medium px-2 py-0.5 rounded hover:bg-gray-100 transition-colors"
          title="Open in Live Board"
        >
          Board →
        </button>
      </div>
    </td>
  </tr>
);

const SCR025_MajorIncidentsListMockup: React.FC = () => {
  const navigate = useNavigate();
  const [showNewModal, setShowNewModal]     = useState<boolean>(false);
  const [localIncidents, setLocalIncidents] = useState<MajorIncident[]>([]);
  const [serverIncidents, setServerIncidents] = useState<MajorIncident[]>([]);
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<MajorIncident | null>(null);
  const [selectedListId, setSelectedListId] = useState<string>('update-required');
  const [searchQuery, setSearchQuery]       = useState<string>('');
  const [sortDir, setSortDir]               = useState<'asc' | 'desc'>('desc');
  const [page, setPage]                     = useState<number>(1);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const PAGE_SIZE = 5;

  const loadLiveIncidents = useCallback(async () => {
    try {
      const live = await majorIncidentsService.getMajorIncidents();
      if (Array.isArray(live) && live.length > 0) {
        setServerIncidents(live);
        setIsLiveConnected(true);
      } else {
        setIsLiveConnected(false);
      }
    } catch {
      setIsLiveConnected(false);
    }
  }, []);

  useEffect(() => {
    loadLiveIncidents();
  }, [loadLiveIncidents]);

  useEffect(() => { setPage(1); }, [selectedListId, searchQuery, sortDir]);

  const allIncidents = useMemo(() => {
    const map = new Map<string, MajorIncident>();
    serverIncidents.forEach((inc) => map.set(inc.id, inc));
    localIncidents.forEach((inc) => map.set(inc.id, inc));
    return Array.from(map.values());
  }, [serverIncidents, localIncidents]);

  const sidebarCounts = useMemo(() => {
    return {
      'update-required': allIncidents.filter((i) => !i.lifecycleStages[5]?.isCompleted).length,
      'my-team': allIncidents.filter((i) => i.assignee !== 'Unassigned').length,
      'critical': allIncidents.filter((i) => i.priority === 'Critical').length,
      'closed': allIncidents.filter((i) => i.lifecycleStages[5]?.isCompleted).length,
      'board': allIncidents.length,
      'dashboard': allIncidents.length,
    };
  }, [allIncidents]);

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

    majorIncidentsService.createMajorIncident({
      title: incident.title,
      priority: incident.priority,
      product: incident.product,
      assignee: incident.assignee,
    }).then((created) => {
      if (created) {
        setLocalIncidents((prev) => prev.map((i) => i.id === incident.id ? created : i));
        setServerIncidents((prev) => [created, ...prev.filter((i) => i.id !== created.id)]);
      }
    }).catch(() => {});
  };

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
      {/* Full-width top navbar */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-10 min-h-[50px]">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">Major Incidents</span>
        </div>

        <GlobalNavbarActions
          onNewTicket={() => setShowNewModal(true)}
        />
      </header>

      {/* Two-Column Body below top navbar */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        <MajorIncidentsSidebar onSelectList={setSelectedListId} counts={sidebarCounts} />

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
          onRefresh={() => { setSearchQuery(''); setSortDir('desc'); setPage(1); loadLiveIncidents(); }}
          onNew={() => setShowNewModal(true)}
          breadcrumb="List View"
        />

        <div className="flex-1 overflow-auto px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="font-semibold text-gray-800 text-sm">Major Incidents Register</span>
              <span className="text-gray-300">·</span>
              <span>{incidents.length} records</span>
            </div>
            <div className="flex items-center gap-3">
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
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedIncidents.map((incident, i) => (
                  <ListRow 
                    key={incident.id} 
                    incident={incident} 
                    index={i} 
                    onSelect={(inc) => navigate(`/major-incidents/live?incident=${inc.id}`)}
                    onOpenLive={() => navigate(`/major-incidents/live?incident=${incident.id}`)}
                  />
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
                <button key={p} onClick={() => setPage(p)} className={`px-2 py-1 rounded font-medium ${p === page ? 'bg-[#fdede7] text-[#eb6a47]' : 'hover:bg-gray-100'}`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">Next ›</button>
            </div>
          </div>
        </div>
      </main>
      </div>

      {showNewModal && (
        <NewIncidentModal
          onClose={() => setShowNewModal(false)}
          onSubmit={handleAddIncident}
        />
      )}

      {selectedTicketForModal && (
        <TicketDetailModal
          ticket={{
            id: selectedTicketForModal.id,
            type: 'Major Incident',
            summary: selectedTicketForModal.title,
            agent: selectedTicketForModal.assignee,
            priority: selectedTicketForModal.priority === 'Critical' ? 'Critical' : 'High',
            status: activeStageLabel(selectedTicketForModal),
            department: selectedTicketForModal.product,
            category: 'Major Incident Investigation',
            targetSla: selectedTicketForModal.resolutionTarget,
            notes: (selectedTicketForModal.updates || []).map((u) => ({
              id: u.id,
              author: u.author || 'Commander',
              time: u.timestamp || 'Just now',
              text: u.content,
            })),
          }}
          onClose={() => setSelectedTicketForModal(null)}
        />
      )}
    </div>
  );
};

export default SCR025_MajorIncidentsListMockup;
