import React, { useState, useMemo, useEffect, useCallback } from 'react';
import MajorIncidentsSidebar from './components/MajorIncidentsSidebar';
import IncidentCard from './components/IncidentCard';
import ActivityFeed from './components/ActivityFeed';
import PageHeader from './components/PageHeader';
import NewIncidentModal from './components/NewIncidentModal';
import IncidentDetailPanel from './components/IncidentDetailPanel';
import { MOCK_MAJOR_INCIDENTS, MOCK_FEED_ENTRIES } from './data/mockData';
import type { MajorIncident, UserRole, IncidentUpdate } from './types/majorIncident.types';

const STAGE_ORDER = ['Started', 'Escalated', 'Diagnosed', 'Mitigated', 'Resolved', 'Closed'];

const filterByList = (incidents: MajorIncident[], listId: string): MajorIncident[] => {
  switch (listId) {
    case 'update-required': return incidents.filter((i) => !i.lifecycleStages[5]?.isCompleted);
    case 'my-team':         return incidents.filter((i) => i.assignee !== 'Unassigned');
    case 'critical':        return incidents.filter((i) => i.priority === 'Critical');
    case 'closed':          return incidents.filter((i) => i.lifecycleStages[5]?.isCompleted);
    default:                return incidents;
  }
};

const ROLES: UserRole[] = ['Agent', 'Manager', 'Admin'];

const BREADCRUMB_LABELS: Record<string, string> = {
  'update-required': 'Update Required',
  'my-team':         'My Team',
  'critical':        'Critical Major Incidents',
  'closed':          'Closed',
  'board':           'Major Incident Board',
  'calendar':        'Major Incident Calendar',
  'dashboard':       'Major Incident Dashboard',
};

/* ─── panel registry ─── */
type PanelType = 'notifications' | 'tasks' | 'performance' | 'status' | 'history' | 'help' | 'profile' | null;

interface PanelDef { title: string; body: string }

const PANELS: Record<NonNullable<PanelType>, PanelDef> = {
  notifications: {
    title: '🔔 Notifications',
    body: '1 unread alert:\n\n• Major Incident #0002671 is OVERDUE — no update posted in 4 h. SLA breach imminent.',
  },
  tasks: {
    title: '📋 My Tasks',
    body: 'Open tasks assigned to you:\n\n• Escalate #0002671 to L3 support\n• Post stakeholder update for #0002673 (due in 12 min)\n• Close war-room bridge for #0002672\n• Review RCA draft for #0002670',
  },
  performance: {
    title: '📊 SLA Performance',
    body: 'Last 30 days:\n\nResponse SLA    94% on-time\nResolution SLA  78% on-time\nMTTR            3 h 42 m\nOpen P1s        2\nOpen P2s        1\nMean updates/inc  6.4',
  },
  status: {
    title: '📡 System / Service Health',
    body: '● API Gateway      Operational\n● Auth Service      Operational\n● Payments          Degraded ⚠\n● Database Cluster  Operational\n● CDN               Operational\n● Email Relay       Operational\n\nLast checked: just now',
  },
  history: {
    title: '🕐 Audit Log',
    body: 'Recent changes (this session):\n\n09:42  Stage advanced → Escalated  (#0002673)\n09:38  Comment added by Priya K.    (#0002671)\n09:31  Incident created              (#0002673)\n09:15  Assignment changed → Ravi M. (#0002672)\n09:03  Stage advanced → Diagnosed   (#0002671)',
  },
  help: {
    title: '❓ Major Incident Process',
    body: 'Standard ITSM response flow:\n\n1. Triage & severity classification\n2. Escalate to on-call engineer\n3. Open war-room bridge\n4. Post stakeholder updates every 30 min\n5. Record each lifecycle stage change\n6. Mitigate → confirm fix → resolve\n7. RCA due within 5 business days',
  },
  profile: {
    title: '👤 Your Profile',
    body: 'Inesh Agarwal\nEmail: inesh@servigen.io\nOrg:   ServiGen ITSM\nStatus: ● Online\n\nSwitch simulated role using the bar at the top of the screen.',
  },
};

const SCR022_MajorIncidentsLive: React.FC = () => {
  const [isFeedOpen, setIsFeedOpen]         = useState<boolean>(false);
  const [showNewModal, setShowNewModal]     = useState<boolean>(false);
  const [localIncidents, setLocalIncidents] = useState<MajorIncident[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('update-required');
  const [searchQuery, setSearchQuery]       = useState<string>('');
  const [page, setPage]                     = useState<number>(1);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [role, setRole]                     = useState<UserRole>('Agent');
  const [openPanel, setOpenPanel]           = useState<PanelType>(null);
  const [roleToast, setRoleToast]           = useState<string | null>(null);
  const PAGE_SIZE = 2;

  useEffect(() => { setPage(1); }, [selectedListId, searchQuery]);

  const allIncidents = useMemo(() => [...localIncidents, ...MOCK_MAJOR_INCIDENTS], [localIncidents]);

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

  const selectedIncident = allIncidents.find((i) => i.id === selectedIncidentId) ?? null;

  const handleAddIncident = (incident: MajorIncident) => {
    setLocalIncidents((prev) => [incident, ...prev]);
    setPage(1);
  };

  const handleAdvanceStage = (incidentId: string) => {
    const advance = (list: MajorIncident[]): MajorIncident[] =>
      list.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const activeIdx = inc.lifecycleStages.findIndex((s) => s.isActive);
        if (activeIdx === -1 || activeIdx >= STAGE_ORDER.length - 1) return inc;
        const now = new Date().toLocaleString('en-GB', { hour12: true, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const newStages = inc.lifecycleStages.map((s, i) => ({
          ...s,
          isCompleted: i <= activeIdx ? true : s.isCompleted,
          isActive:    i === activeIdx + 1,
          timestamp:   i === activeIdx + 1 ? now : s.timestamp,
        }));
        const stageChangeUpdate: IncidentUpdate = {
          id: `u-${Date.now()}`,
          timestamp: now,
          author: role === 'Admin' ? 'Admin User' : 'Manager User',
          authorRole: role,
          type: 'stage_change',
          content: 'Stage advanced.',
          fromStage: STAGE_ORDER[activeIdx],
          toStage: STAGE_ORDER[activeIdx + 1],
        };
        return { ...inc, lifecycleStages: newStages, updates: [...inc.updates, stageChangeUpdate] };
      });

    setLocalIncidents((prev) => advance(prev));
    const isMock = MOCK_MAJOR_INCIDENTS.some((i) => i.id === incidentId);
    if (isMock) {
      const original = MOCK_MAJOR_INCIDENTS.find((i) => i.id === incidentId)!;
      setLocalIncidents((prev) => {
        const alreadyLocal = prev.some((i) => i.id === incidentId);
        if (alreadyLocal) return advance(prev);
        return advance([{ ...original }, ...prev]);
      });
    }
  };

  const handleAddUpdate = (incidentId: string, update: IncidentUpdate) => {
    const inject = (list: MajorIncident[]): MajorIncident[] =>
      list.map((inc) => inc.id === incidentId ? { ...inc, updates: [...inc.updates, update] } : inc);

    const isMock = MOCK_MAJOR_INCIDENTS.some((i) => i.id === incidentId);
    if (isMock) {
      setLocalIncidents((prev) => {
        const alreadyLocal = prev.some((i) => i.id === incidentId);
        if (alreadyLocal) return inject(prev);
        const original = MOCK_MAJOR_INCIDENTS.find((i) => i.id === incidentId)!;
        return inject([{ ...original }, ...prev]);
      });
    } else {
      setLocalIncidents((prev) => inject(prev));
    }
  };

  /* Search icon → focus the sub-bar search input */
  const handleSearchFocus = useCallback(() => {
    const el = document.getElementById('header-search-input') as HTMLInputElement | null;
    el?.focus();
    el?.select();
  }, []);

  /* Toggle a named info panel; clicking same icon again closes it */
  const handlePanel = useCallback((panel: NonNullable<PanelType>) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
    setIsFeedOpen(false);
  }, []);

  /* Close any open panel on Escape */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenPanel(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <MajorIncidentsSidebar onSelectList={setSelectedListId} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Role selector strip */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-800 text-xs shrink-0">
          <span className="text-gray-400 font-medium">Role:</span>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => {
                if (role === r) return;
                setRole(r);
                const desc: Record<string, string> = {
                  Agent:   'view & comment only',
                  Manager: 'can advance lifecycle stages',
                  Admin:   'full access & assignments',
                };
                setRoleToast(desc[r] ?? '');
                setTimeout(() => setRoleToast(null), 2800);
              }}
              className={`px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
                role === r
                  ? r === 'Admin'   ? 'bg-red-500 text-white'
                  : r === 'Manager' ? 'bg-purple-500 text-white'
                  :                   'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
          <span className="ml-auto text-gray-500 text-[10px]">Active: <span className={`font-semibold ${role === 'Admin' ? 'text-red-400' : role === 'Manager' ? 'text-purple-400' : 'text-blue-400'}`}>{role}</span> — affects stage advancement &amp; actions</span>
        </div>

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
          onSearchFocus={handleSearchFocus}
          onRefresh={() => {
            setSearchQuery('');
            setPage(1);
            setSelectedIncidentId(null);
            setOpenPanel(null);
            setIsFeedOpen(false);
          }}
          onToggleFeed={() => { setIsFeedOpen((v) => !v); setOpenPanel(null); }}
          feedNewCount={MOCK_FEED_ENTRIES.length}
          notifCount={1}
          onNew={() => setShowNewModal(true)}
          onNotifications={() => handlePanel('notifications')}
          onTasks={() => handlePanel('tasks')}
          onPerformance={() => handlePanel('performance')}
          onStatus={() => handlePanel('status')}
          onHistory={() => handlePanel('history')}
          onHelp={() => handlePanel('help')}
          onProfile={() => handlePanel('profile')}
          breadcrumb={BREADCRUMB_LABELS[selectedListId] ?? selectedListId}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50">
            {selectedListId === 'board' ? (
              <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {['Started', 'Diagnosed', 'Mitigated', 'Resolved'].map(column => (
                  <div key={column} className="w-80 shrink-0 bg-gray-100 rounded-lg p-3 flex flex-col border border-gray-200">
                    <div className="text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                      {column} <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">2</span>
                    </div>
                    <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                      Drop incidents here
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedListId === 'calendar' ? (
              <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 text-center py-2">
                  <div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div>
                </div>
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="border-r border-b border-gray-100 p-2 relative hover:bg-gray-50 transition-colors">
                      <span className="text-gray-400 text-xs">{i + 1}</span>
                      {i === 12 && (
                        <div className="mt-1 bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold p-1 rounded cursor-pointer truncate">
                          #MI-20230912
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedListId === 'dashboard' ? (
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Incidents by Priority</h3>
                  <div className="flex-1 flex items-end justify-around gap-2 mt-4 pb-2 border-b border-gray-200">
                    <div className="w-12 bg-red-500 rounded-t-sm" style={{ height: '80%' }}></div>
                    <div className="w-12 bg-orange-400 rounded-t-sm" style={{ height: '40%' }}></div>
                    <div className="w-12 bg-yellow-400 rounded-t-sm" style={{ height: '20%' }}></div>
                  </div>
                  <div className="flex justify-around text-xs text-gray-500 mt-2 font-medium">
                    <span>Critical</span><span>High</span><span>Med</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-8 border-cyan-400 border-t-gray-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-700">75%</span>
                  </div>
                  <span className="text-sm text-gray-500 font-medium mt-4">Resolution SLA</span>
                </div>
              </div>
            ) : (
              displayedIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <p className="text-sm">No major incidents found</p>
                </div>
              ) : (
                pagedIncidents.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    isSelected={selectedIncidentId === incident.id}
                    onClick={() => setSelectedIncidentId(
                      selectedIncidentId === incident.id ? null : incident.id
                    )}
                  />
                ))
              )
            )}
          </div>

          {/* ── Icon-button info panels ── */}
          {openPanel && (
            <div className="w-72 shrink-0 border-l border-gray-200 bg-white flex flex-col shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-semibold text-gray-700">
                  {PANELS[openPanel].title}
                </span>
                <button
                  onClick={() => setOpenPanel(null)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition-colors text-xs"
                  aria-label="Close panel"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                  {PANELS[openPanel].body}
                </p>
              </div>
            </div>
          )}

          {/* ── Incident detail panel ── */}
          {selectedIncident && (
            <IncidentDetailPanel
              incident={selectedIncident}
              role={role}
              onClose={() => setSelectedIncidentId(null)}
              onAdvanceStage={handleAdvanceStage}
              onAddUpdate={handleAddUpdate}
            />
          )}

          {/* ── Activity Feed (··· button only) ── */}
          {!selectedIncident && !openPanel && isFeedOpen && (
            <ActivityFeed entries={MOCK_FEED_ENTRIES} onClose={() => setIsFeedOpen(false)} />
          )}
        </div>
        {/* Role-switch confirmation toast */}
        {roleToast && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center z-50">
            <div className="flex items-center gap-2 bg-gray-900 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-2xl border border-gray-700">
              <span className={`w-2 h-2 rounded-full shrink-0 ${role === 'Admin' ? 'bg-red-400' : role === 'Manager' ? 'bg-purple-400' : 'bg-blue-400'}`} />
              Switched to <strong className="font-bold">{role}</strong> — {roleToast}
            </div>
          </div>
        )}
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
