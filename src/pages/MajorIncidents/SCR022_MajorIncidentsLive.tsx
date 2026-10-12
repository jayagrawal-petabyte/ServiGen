import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../Auth';
import { usePersistentState } from '../../utils/persistentState';
import MajorIncidentsSidebar from './components/MajorIncidentsSidebar';
import IncidentCard from './components/IncidentCard';
import ActivityFeed from './components/ActivityFeed';
import PageHeader from './components/PageHeader';
import NewIncidentModal from './components/NewIncidentModal';
import GetStartedModal from './components/GetStartedModal';
import PriorityBadge from './components/PriorityBadge';
import IncidentDetailPanel from './components/IncidentDetailPanel';
import { MOCK_MAJOR_INCIDENTS, MOCK_FEED_ENTRIES } from './data/mockData';
import type { MajorIncident, UserRole, IncidentUpdate, Priority } from './types/majorIncident.types';

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

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', title: 'Major Incident #0002671 is OVERDUE — no update posted in 4 h. SLA breach imminent.', time: '10m ago', isRead: false, priority: 'high' },
  { id: 'n2', title: 'War-room bridge initiated for #0002672.', time: '45m ago', isRead: false, priority: 'medium' },
  { id: 'n3', title: 'Stakeholder update published by Ravi M. on #0002673.', time: '2h ago', isRead: true, priority: 'low' },
];

export interface TaskItem {
  id: string;
  label: string;
  done: boolean;
}

const INITIAL_TASKS: TaskItem[] = [
  { id: 't1', label: 'Escalate #0002671 to L3 support', done: false },
  { id: 't2', label: 'Post stakeholder update for #0002673 (due in 12 min)', done: false },
  { id: 't3', label: 'Close war-room bridge for #0002672', done: false },
  { id: 't4', label: 'Review RCA draft for #0002670', done: true },
];

const PANELS: Record<NonNullable<PanelType>, PanelDef> = {
  notifications: {
    title: '🔔 Notifications',
    body: '',
  },
  tasks: {
    title: '📋 My Tasks',
    body: '',
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
  const { user } = useAuth();
  const [isFeedOpen, setIsFeedOpen]         = useState<boolean>(false);
  const [showNewModal, setShowNewModal]     = useState<boolean>(false);
  const [showGetStartedModal, setShowGetStartedModal] = useState<boolean>(false);
  const [localIncidents, setLocalIncidents] = usePersistentState<MajorIncident[]>(
    'servigen_major_incidents_live_v1',
    []
  );
  const [selectedListId, setSelectedListId] = useState<string>('update-required');
  const [searchQuery, setSearchQuery]       = useState<string>('');
  const [page, setPage]                     = useState<number>(1);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [role, setRole]                     = useState<UserRole>('Agent');
  const [openPanel, setOpenPanel]           = useState<PanelType>(null);
  const [roleToast, setRoleToast]           = useState<string | null>(null);
  const [notifications, setNotifications]   = usePersistentState<NotificationItem[]>(
    'servigen_major_incidents_notifs_v1',
    INITIAL_NOTIFICATIONS
  );
  const [tasks, setTasks]                   = usePersistentState<TaskItem[]>(
    'servigen_major_incidents_tasks_v1',
    INITIAL_TASKS
  );
  const [feedUnreadCount, setFeedUnreadCount] = useState<number>(MOCK_FEED_ENTRIES.length);
  const PAGE_SIZE = 2;

  const activeUserName = user?.fullName || 'Inesh Agarwal';
  const activeUserEmail = user?.email || 'inesh@servigen.io';
  const activeUserRole = user?.role || 'Administrator';

  const unreadNotifCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleToggleNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: !n.isRead } : n));
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };

  useEffect(() => { setPage(1); }, [selectedListId, searchQuery]);

  const allIncidents = useMemo(() => [...localIncidents, ...MOCK_MAJOR_INCIDENTS], [localIncidents]);

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
    setFeedUnreadCount((c) => c + 1);
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
          author: activeUserName,
          authorRole: role,
          type: 'stage_change',
          content: 'Stage advanced.',
          fromStage: STAGE_ORDER[activeIdx],
          toStage: STAGE_ORDER[activeIdx + 1],
        };
        return { ...inc, lifecycleStages: newStages, updates: [...(inc.updates ?? []), stageChangeUpdate] };
      });

    setLocalIncidents((prev) => {
      const alreadyLocal = prev.some((i) => i.id === incidentId);
      if (alreadyLocal) return advance(prev);
      const original = MOCK_MAJOR_INCIDENTS.find((i) => i.id === incidentId);
      if (original) return advance([{ ...original }, ...prev]);
      return prev;
    });
  };

  const handleAddUpdate = (incidentId: string, update: IncidentUpdate) => {
    const inject = (list: MajorIncident[]): MajorIncident[] =>
      list.map((inc) => inc.id === incidentId ? { ...inc, updates: [...(inc.updates ?? []), update] } : inc);

    setLocalIncidents((prev) => {
      const alreadyLocal = prev.some((i) => i.id === incidentId);
      if (alreadyLocal) return inject(prev);
      const original = MOCK_MAJOR_INCIDENTS.find((i) => i.id === incidentId);
      if (original) return inject([{ ...original }, ...prev]);
      return prev;
    });
  };

  const handleReassign = (incidentId: string, newAssignee: string) => {
    const updateAssignee = (list: MajorIncident[]): MajorIncident[] =>
      list.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const now = new Date().toLocaleString('en-GB', {
          hour12: true, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const assignUpdate: IncidentUpdate = {
          id: `u-${Date.now()}`,
          timestamp: now,
          author: activeUserName,
          authorRole: role,
          type: 'status_change',
          content: `Assignee reassigned to ${newAssignee}`,
        };
        return {
          ...inc,
          assignee: newAssignee,
          updates: [...(inc.updates ?? []), assignUpdate],
        };
      });

    setLocalIncidents((prev) => {
      const alreadyLocal = prev.some((i) => i.id === incidentId);
      if (alreadyLocal) return updateAssignee(prev);
      const original = MOCK_MAJOR_INCIDENTS.find((i) => i.id === incidentId);
      if (original) return updateAssignee([{ ...original }, ...prev]);
      return prev;
    });
  };

  const handleUpdatePriority = (incidentId: string, newPriority: Priority) => {
    const updatePrio = (list: MajorIncident[]): MajorIncident[] =>
      list.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const now = new Date().toLocaleString('en-GB', {
          hour12: true, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const updateLog: IncidentUpdate = {
          id: `u-${Date.now()}`,
          timestamp: now,
          author: activeUserName,
          authorRole: role,
          type: 'status_change',
          content: `Priority changed to ${newPriority}`,
        };
        return { ...inc, priority: newPriority, updates: [...(inc.updates ?? []), updateLog] };
      });

    setLocalIncidents((prev) => {
      const alreadyLocal = prev.some((i) => i.id === incidentId);
      if (alreadyLocal) return updatePrio(prev);
      const original = MOCK_MAJOR_INCIDENTS.find((i) => i.id === incidentId);
      if (original) return updatePrio([{ ...original }, ...prev]);
      return prev;
    });
  };

  const handleUpdateProduct = (incidentId: string, newProduct: string) => {
    const updateProd = (list: MajorIncident[]): MajorIncident[] =>
      list.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const now = new Date().toLocaleString('en-GB', {
          hour12: true, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const updateLog: IncidentUpdate = {
          id: `u-${Date.now()}`,
          timestamp: now,
          author: activeUserName,
          authorRole: role,
          type: 'status_change',
          content: `Product / CI changed to ${newProduct}`,
        };
        return { ...inc, product: newProduct, updates: [...(inc.updates ?? []), updateLog] };
      });

    setLocalIncidents((prev) => {
      const alreadyLocal = prev.some((i) => i.id === incidentId);
      if (alreadyLocal) return updateProd(prev);
      const original = MOCK_MAJOR_INCIDENTS.find((i) => i.id === incidentId);
      if (original) return updateProd([{ ...original }, ...prev]);
      return prev;
    });
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
      <MajorIncidentsSidebar onSelectList={setSelectedListId} counts={sidebarCounts} />

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
          onToggleFeed={() => {
            setIsFeedOpen((v) => {
              const next = !v;
              if (next) setFeedUnreadCount(0);
              return next;
            });
            setOpenPanel(null);
          }}
          feedNewCount={isFeedOpen ? 0 : feedUnreadCount}
          notifCount={unreadNotifCount}
          onNew={() => setShowNewModal(true)}
          onGetStarted={() => setShowGetStartedModal(true)}
          onNotifications={() => handlePanel('notifications')}
          onTasks={() => handlePanel('tasks')}
          onPerformance={() => handlePanel('performance')}
          onStatus={() => handlePanel('status')}
          onHistory={() => handlePanel('history')}
          onHelp={() => handlePanel('help')}
          onProfile={() => handlePanel('profile')}
          breadcrumb={BREADCRUMB_LABELS[selectedListId] ?? selectedListId}
        />

        {/* View Switcher Bar */}
        <div className="flex items-center justify-between px-5 py-2 bg-white border-b border-gray-200 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-semibold mr-1">Views:</span>
            <Link
              to="/major-incidents/live"
              className="px-3 py-1 rounded-full font-semibold transition-all bg-cyan-500 text-white shadow-xs"
            >
              Live Cards
            </Link>
            <Link
              to="/major-incidents/list"
              className="px-3 py-1 rounded-full font-semibold transition-all bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            >
              List Table
            </Link>
            <Link
              to="/major-incidents/feed"
              className="px-3 py-1 rounded-full font-semibold transition-all bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            >
              Live Feed
            </Link>
            <Link
              to="/major-incidents/design"
              className="px-3 py-1 rounded-full font-semibold transition-all bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            >
              Design Canvas
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/cmdb"
              className="text-[11px] font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-full transition-colors"
            >
              Asset CMDB →
            </Link>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50">
            {selectedListId === 'board' ? (
              <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {['Started', 'Diagnosed', 'Mitigated', 'Resolved'].map((column) => {
                  const colIncidents = allIncidents.filter((inc) => {
                    const activeStage = inc.lifecycleStages.find((s) => s.isActive)?.label;
                    return activeStage === column || (!activeStage && column === 'Started');
                  });
                  return (
                    <div key={column} className="w-80 shrink-0 bg-gray-100 rounded-xl p-3 flex flex-col border border-gray-200">
                      <div className="text-xs font-bold text-gray-700 mb-3 flex items-center justify-between">
                        <span>{column}</span>
                        <span className="bg-white text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold shadow-2xs">
                          {colIncidents.length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                        {colIncidents.length === 0 ? (
                          <div className="h-32 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                            No incidents in {column}
                          </div>
                        ) : (
                          colIncidents.map((inc) => (
                            <div
                              key={inc.id}
                              onClick={() => setSelectedIncidentId(inc.id)}
                              className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs hover:shadow-xs cursor-pointer transition-all space-y-2"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-mono font-bold text-cyan-600 bg-cyan-50 border border-cyan-100 px-1.5 py-0.5 rounded">
                                  #{inc.id}
                                </span>
                                <PriorityBadge priority={inc.priority} />
                              </div>
                              <h4 className="text-xs font-bold text-gray-800 leading-snug line-clamp-2">
                                {inc.title}
                              </h4>
                              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                                <span className="truncate max-w-[120px]">{inc.assignee}</span>
                                {(role === 'Manager' || role === 'Admin') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAdvanceStage(inc.id);
                                    }}
                                    className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full"
                                  >
                                    Advance →
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : selectedListId === 'calendar' ? (
              <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 text-center py-2">
                  <div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div>
                </div>
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const matchInc = allIncidents[i % (allIncidents.length + 5)];
                    const hasEvent = i % 7 === 2 && matchInc;
                    return (
                      <div key={i} className="border-r border-b border-gray-100 p-2 relative hover:bg-gray-50 transition-colors">
                        <span className="text-gray-400 text-xs">{i + 1}</span>
                        {hasEvent && (
                          <div
                            onClick={() => setSelectedIncidentId(matchInc.id)}
                            className="mt-1 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 text-[10px] font-bold p-1 rounded cursor-pointer truncate transition-colors"
                          >
                            #{matchInc.id} {matchInc.title}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : selectedListId === 'dashboard' ? (
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Incidents by Priority</h3>
                    <span className="text-xs text-gray-400 font-semibold">Total: {allIncidents.length}</span>
                  </div>
                  {(() => {
                    const criticalCount = allIncidents.filter((i) => i.priority === 'Critical').length;
                    const highCount = allIncidents.filter((i) => i.priority === 'High').length;
                    const medCount = allIncidents.filter((i) => i.priority === 'Medium' || i.priority === 'Low').length;
                    const maxVal = Math.max(1, criticalCount, highCount, medCount);
                    return (
                      <>
                        <div className="flex-1 flex items-end justify-around gap-4 mt-4 pb-3 border-b border-gray-100">
                          <div className="flex flex-col items-center gap-1.5 w-16">
                            <span className="text-xs font-bold text-red-600">{criticalCount}</span>
                            <div className="w-full bg-red-500 rounded-t-lg transition-all" style={{ height: `${(criticalCount / maxVal) * 120 + 10}px` }} />
                          </div>
                          <div className="flex flex-col items-center gap-1.5 w-16">
                            <span className="text-xs font-bold text-orange-500">{highCount}</span>
                            <div className="w-full bg-orange-400 rounded-t-lg transition-all" style={{ height: `${(highCount / maxVal) * 120 + 10}px` }} />
                          </div>
                          <div className="flex flex-col items-center gap-1.5 w-16">
                            <span className="text-xs font-bold text-yellow-600">{medCount}</span>
                            <div className="w-full bg-yellow-400 rounded-t-lg transition-all" style={{ height: `${(medCount / maxVal) * 120 + 10}px` }} />
                          </div>
                        </div>
                        <div className="flex justify-around text-xs text-gray-500 mt-2 font-medium">
                          <span>Critical</span><span>High</span><span>Med/Low</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col items-center justify-center">
                  {(() => {
                    const onTimeCount = allIncidents.filter((i) => !i.resolutionTarget.startsWith('-')).length;
                    const slaRate = Math.round((onTimeCount / Math.max(1, allIncidents.length)) * 100);
                    return (
                      <>
                        <div className="w-36 h-36 rounded-full border-8 border-cyan-400 border-t-gray-100 flex items-center justify-center shadow-xs">
                          <span className="text-3xl font-extrabold text-gray-800">{slaRate}%</span>
                        </div>
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-4">Resolution SLA Performance</span>
                        <p className="text-[11px] text-gray-400 mt-1">{onTimeCount} of {allIncidents.length} incidents meeting SLA</p>
                      </>
                    );
                  })()}
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
                    role={role}
                    onAdvanceStage={() => handleAdvanceStage(incident.id)}
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
            <div className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col shadow-lg overflow-hidden">
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
                {openPanel === 'notifications' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="text-xs font-semibold text-gray-500">
                        {unreadNotifCount} unread
                      </span>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={handleMarkAllNotificationsRead}
                          className="text-[11px] font-bold text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-full transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-xl border transition-all ${
                            notif.isRead
                              ? 'bg-gray-50/60 border-gray-100 text-gray-500 opacity-75'
                              : 'bg-white border-cyan-200 shadow-xs text-gray-800 ring-1 ring-cyan-100'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                                notif.isRead
                                  ? 'bg-gray-300'
                                  : notif.priority === 'high'
                                  ? 'bg-red-500 ring-2 ring-red-200'
                                  : 'bg-cyan-500 ring-2 ring-cyan-200'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs leading-snug ${notif.isRead ? 'font-normal' : 'font-semibold'}`}>
                                {notif.title}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-gray-400">{notif.time}</span>
                                <button
                                  onClick={() => handleToggleNotificationRead(notif.id)}
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                                    notif.isRead
                                      ? 'text-gray-500 hover:bg-gray-200'
                                      : 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100'
                                  }`}
                                >
                                  {notif.isRead ? 'Mark unread' : 'Mark as read'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : openPanel === 'tasks' ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Assigned Action Items</p>
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          task.done ? 'bg-gray-50 border-gray-100 text-gray-400' : 'bg-white border-gray-200 text-gray-700 hover:border-cyan-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                        />
                        <span className={`text-xs leading-snug ${task.done ? 'line-through' : 'font-medium'}`}>
                          {task.label}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : openPanel === 'profile' ? (
                  <div className="space-y-3 text-xs text-gray-700">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {activeUserName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{activeUserName}</div>
                        <div className="text-gray-500">{activeUserEmail}</div>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div><span className="text-gray-400">Account Role:</span> <span className="font-semibold text-gray-800">{activeUserRole}</span></div>
                      <div><span className="text-gray-400">Simulated Role:</span> <span className="font-semibold text-cyan-600">{role}</span></div>
                      <div><span className="text-gray-400">Department:</span> <span className="font-medium text-gray-800">{user?.department || 'IT Operations'}</span></div>
                      <div><span className="text-gray-400">Organization:</span> <span className="font-medium text-gray-800">{user?.defaultOrganisation || 'ServiGen Global Tech'}</span></div>
                      <div><span className="text-gray-400">Status:</span> <span className="inline-flex items-center gap-1 font-medium text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online</span></div>
                    </div>
                    <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                      Switch simulated role using the bar at the top of the screen.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                    {PANELS[openPanel].body}
                  </p>
                )}
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
              onReassign={handleReassign}
              onUpdatePriority={handleUpdatePriority}
              onUpdateProduct={handleUpdateProduct}
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

      {showGetStartedModal && (
        <GetStartedModal
          onClose={() => setShowGetStartedModal(false)}
          onOpenNewTicket={() => setShowNewModal(true)}
        />
      )}
    </div>
  );
};

export default SCR022_MajorIncidentsLive;
