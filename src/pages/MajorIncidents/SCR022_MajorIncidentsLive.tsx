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
import MajorIncidentConsole from './components/MajorIncidentConsole';
import type { MajorIncident, UserRole, IncidentUpdate, Priority, ActivityFeedEntry } from './types/majorIncident.types';
import { majorIncidentsService, mapStageToBackendStatus } from '../../services/majorIncidentsService';
import { cmdbService } from '../../services/cmdbService';
import { FeedPopover } from '../../components/shared/FeedPopover';
import { TimesheetPopover } from '../../components/shared/TimesheetPopover';
import { AgentKpiDrawer } from '../../components/shared/AgentKpiDrawer';

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

const BREADCRUMB_LABELS: Record<string, string> = {
  'update-required': 'Update Required',
  'my-team':         'My Team',
  'critical':        'Critical Major Incidents',
  'closed':          'Closed',
  'board':           'Major Incident Board',
  'calendar':        'Major Incident Calendar',
  'dashboard':       '🌐 Major Incident Dashboard',
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

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export interface TaskItem {
  id: string;
  label: string;
  done: boolean;
}

const INITIAL_TASKS: TaskItem[] = [];

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
    body: '',
  },
  status: {
    title: '📡 System / Service Health',
    body: '',
  },
  history: {
    title: '🕐 Audit Log',
    body: '',
  },
  help: {
    title: '❓ Major Incident Process',
    body: 'Standard ITSM response flow:\n\n1. Triage & severity classification\n2. Escalate to on-call engineer\n3. Open war-room bridge\n4. Post stakeholder updates every 30 min\n5. Record each lifecycle stage change\n6. Mitigate → confirm fix → resolve\n7. RCA due within 5 business days',
  },
  profile: {
    title: '👤 Your Profile',
    body: 'Inesh Agarwal\nEmail: inesh@servigen.io\nOrg:   ServiGen ITSM\nStatus: ● Online',
  },
};

const SCR022_MajorIncidentsLive: React.FC = () => {
  const { user } = useAuth();
  const [isFeedOpen, setIsFeedOpen]         = useState<boolean>(true);
  const [showNewModal, setShowNewModal]     = useState<boolean>(false);
  const [showGetStartedModal, setShowGetStartedModal] = useState<boolean>(false);
  const [localIncidents, setLocalIncidents] = usePersistentState<MajorIncident[]>(
    'servigen_major_incidents_live_v1',
    []
  );
  const [serverIncidents, setServerIncidents] = useState<MajorIncident[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isFetchingLive, setIsFetchingLive]   = useState<boolean>(true);
  const [selectedListId, setSelectedListId] = useState<string>('update-required');
  const [searchQuery, setSearchQuery]       = useState<string>('');
  const [page, setPage]                     = useState<number>(1);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isFeedPopoverOpen, setIsFeedPopoverOpen] = useState<boolean>(false);
  const [isTimesheetOpen, setIsTimesheetOpen] = useState<boolean>(false);
  const [isKpiDrawerOpen, setIsKpiDrawerOpen] = useState<boolean>(false);

  const loadLiveIncidents = useCallback(async () => {
    try {
      setIsFetchingLive(true);
      const live = await majorIncidentsService.getMajorIncidents();
      if (Array.isArray(live)) {
        setServerIncidents(live);
        setIsLiveConnected(true);
      } else {
        setServerIncidents([]);
        setIsLiveConnected(false);
      }
    } catch {
      setServerIncidents([]);
      setIsLiveConnected(false);
    } finally {
      setIsFetchingLive(false);
    }
  }, []);

  useEffect(() => {
    loadLiveIncidents();
  }, [loadLiveIncidents]);

  // Dynamically derive permissions from the authenticated user's role
  const role: UserRole = useMemo(() => {
    if (!user) return 'Admin';
    const r = (user.role || '').toLowerCase();
    if (r.includes('admin') || r.includes('manager')) return 'Admin';
    if (r.includes('lead') || r.includes('approv')) return 'Manager';
    return 'Agent';
  }, [user]);

  const [openPanel, setOpenPanel]           = useState<PanelType>(null);
  const [cmdbServices, setCmdbServices]     = useState<string[]>([]);
  const [notifications, setNotifications]   = usePersistentState<NotificationItem[]>(
    'servigen_major_incidents_notifs_v2',
    INITIAL_NOTIFICATIONS
  );
  const [tasks, setTasks]                   = usePersistentState<TaskItem[]>(
    'servigen_major_incidents_tasks_v2',
    INITIAL_TASKS
  );
  const [feedUnreadCount, setFeedUnreadCount] = useState<number>(0);
  const PAGE_SIZE = 4;

  const activeUserName = user?.fullName || 'Unknown User';
  const activeUserEmail = user?.email || '';
  const activeUserRole = user?.role || 'Support Agent';

  const unreadNotifCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  useEffect(() => {
    let mounted = true;
    cmdbService.fetchConfigurationItems()
      .then((res) => {
        if (mounted && Array.isArray(res?.data) && res.data.length > 0) {
          setCmdbServices(res.data.map((ci) => ci.name));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

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

  const allIncidents = useMemo(() => {
    const map = new Map<string, MajorIncident>();
    serverIncidents.forEach((inc) => map.set(inc.id, inc));
    localIncidents.forEach((inc) => map.set(inc.id, inc));
    return Array.from(map.values());
  }, [serverIncidents, localIncidents]);

  useEffect(() => {
    if (allIncidents.length > 0) {
      setNotifications((prev) => {
        const hasMock = prev.some((n) => n.title.includes('000267'));
        if (prev.length === 0 || hasMock) {
          return allIncidents.slice(0, 4).map((inc) => ({
            id: `notif-${inc.id}`,
            title: `Major Incident #${inc.id} (${inc.title}) is under active ITSM management.`,
            time: 'Live',
            isRead: false,
            priority: inc.priority === 'Critical' ? 'high' : 'medium',
          }));
        }
        return prev;
      });

      setTasks((prev) => {
        const hasMock = prev.some((t) => t.label.includes('000267'));
        if (prev.length === 0 || hasMock) {
          const freshTasks: TaskItem[] = [];
          allIncidents.slice(0, 3).forEach((inc) => {
            freshTasks.push({
              id: `task-${inc.id}-review`,
              label: `Verify incident diagnosis and mitigation path for #${inc.id}`,
              done: false,
            });
            freshTasks.push({
              id: `task-${inc.id}-stakeholder`,
              label: `Post real-time stakeholder update for #${inc.id}`,
              done: false,
            });
          });
          return freshTasks;
        }
        return prev;
      });
    }
  }, [allIncidents, setNotifications, setTasks]);

  const liveFeedEntries = useMemo<ActivityFeedEntry[]>(() => {
    const entries: ActivityFeedEntry[] = [];
    allIncidents.forEach((inc) => {
      (inc.updates || []).forEach((u) => {
        entries.push({
          id: `feed-${inc.id}-${u.id}`,
          avatarLabel: (u.author || 'Commander').slice(0, 2).toUpperCase(),
          actorName: u.author || 'Commander',
          actorOrg: inc.product,
          ticketRef: `#${inc.id}`,
          actionLabel: u.type === 'stage_change' ? 'Stage Advanced' : 'Incident Update',
          message: u.content,
          timeAgo: u.timestamp || 'just now',
          type: u.type === 'stage_change' ? 'status_change' : 'comment_added',
        });
      });
      entries.push({
        id: `feed-${inc.id}-decl`,
        avatarLabel: (inc.assignee || 'MI').slice(0, 2).toUpperCase(),
        actorName: inc.assignee !== 'Unassigned' ? inc.assignee : 'Commander',
        actorOrg: inc.product,
        ticketRef: `#${inc.id}`,
        actionLabel: 'Major Incident Declared',
        message: inc.title,
        timeAgo: 'Live',
        type: 'new_ticket',
      });
    });
    return entries;
  }, [allIncidents]);

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
  const selectedIncident = useMemo(() => {
    if (!selectedIncidentId) return null;
    return (
      allIncidents.find(
        (i) => i.id === selectedIncidentId || i.id.replace(/^0+/, '') === selectedIncidentId.replace(/^0+/, '')
      ) ?? null
    );
  }, [allIncidents, selectedIncidentId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const incParam = params.get('incident');
    if (incParam) {
      const match = allIncidents.find(
        (i) => i.id === incParam || i.id.replace(/^0+/, '') === incParam.replace(/^0+/, '')
      );
      if (match) {
        setSelectedIncidentId(match.id);
      }
    }
  }, [location.search, allIncidents]);

  useEffect(() => {
    if (!selectedIncidentId) return;
    majorIncidentsService.getMajorIncidentById(selectedIncidentId).then((fresh) => {
      if (fresh) {
        setServerIncidents((prev) => prev.map((i) => i.id === fresh.id ? fresh : i));
      }
    }).catch(() => {});
  }, [selectedIncidentId]);

  const handleAddIncident = (incident: MajorIncident) => {
    setLocalIncidents((prev) => [incident, ...prev]);
    setPage(1);
    setFeedUnreadCount((c) => c + 1);

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

  const handleSetStage = (incidentId: string, targetStageIdx: number) => {
    if (targetStageIdx < 0 || targetStageIdx >= STAGE_ORDER.length) return;
    const now = new Date().toLocaleString('en-GB', {
      hour12: true,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const updateStageInList = (list: MajorIncident[]): MajorIncident[] =>
      list.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const currentActiveIdx = inc.lifecycleStages.findIndex((s) => s.isActive);
        const fromStageLabel = currentActiveIdx !== -1 ? STAGE_ORDER[currentActiveIdx] : 'Unknown';
        const toStageLabel = STAGE_ORDER[targetStageIdx];

        const newStages = inc.lifecycleStages.map((s, i) => ({
          ...s,
          isCompleted: i < targetStageIdx || (targetStageIdx === 5 && i === 5),
          isActive: i === targetStageIdx,
          timestamp: i === targetStageIdx ? now : (i < targetStageIdx ? (s.timestamp || now) : undefined),
        }));

        const stageUpdate: IncidentUpdate = {
          id: `u-${Date.now()}`,
          timestamp: now,
          author: activeUserName,
          authorRole: role,
          type: 'stage_change',
          content: `Lifecycle stage moved from ${fromStageLabel} to ${toStageLabel}`,
          fromStage: fromStageLabel,
          toStage: toStageLabel,
        };

        return {
          ...inc,
          resolutionTarget: targetStageIdx === 5 ? 'Completed' : (inc.resolutionTarget === 'Completed' ? '0d 4h 0m' : inc.resolutionTarget),
          lifecycleStages: newStages,
          updates: [...(inc.updates ?? []), stageUpdate],
        };
      });

    setLocalIncidents((prev) => {
      const alreadyLocal = prev.some((i) => i.id === incidentId);
      if (alreadyLocal) return updateStageInList(prev);
      const existing = allIncidents.find((i) => i.id === incidentId);
      if (existing) return updateStageInList([{ ...existing }, ...prev]);
      return prev;
    });

    setServerIncidents((prev) => updateStageInList(prev));

    const backendStatus = mapStageToBackendStatus(targetStageIdx);
    majorIncidentsService.updateMajorIncident(incidentId, {
      status: backendStatus,
      resolvedAt: targetStageIdx === 5 ? new Date().toISOString() : null,
    }).then((updated) => {
      if (updated) {
        setServerIncidents((prev) => prev.map((i) => i.id === incidentId ? updated : i));
      }
    }).catch(() => {});

    majorIncidentsService.addMajorIncidentUpdate(incidentId, {
      message: `Lifecycle stage moved to ${STAGE_ORDER[targetStageIdx]}`,
      author: activeUserName,
    }).catch(() => {});
  };

  const handleStepBackStage = (incidentId: string) => {
    const inc = allIncidents.find((i) => i.id === incidentId);
    if (!inc) return;
    const activeIdx = inc.lifecycleStages.findIndex((s) => s.isActive);
    if (activeIdx > 0) {
      handleSetStage(incidentId, activeIdx - 1);
    }
  };

  const handleAdvanceStage = (incidentId: string) => {
    const inc = allIncidents.find((i) => i.id === incidentId);
    if (!inc) return;
    const activeIdx = inc.lifecycleStages.findIndex((s) => s.isActive);
    if (activeIdx !== -1 && activeIdx < STAGE_ORDER.length - 1) {
      handleSetStage(incidentId, activeIdx + 1);
    }
  };

  const handleReopenIncident = (incidentId: string) => {
    handleSetStage(incidentId, 0);
  };

  const handleResetDemoIncidents = async () => {
    localStorage.removeItem('servigen_major_incidents_live_v1');
    setLocalIncidents([]);
    try {
      await majorIncidentsService.updateMajorIncident('0002671', { status: 'Investigating', commander: 'Unassigned', priority: 'P1' });
      await majorIncidentsService.updateMajorIncident('0002672', { status: 'Investigating', commander: 'Jennifer Williams', priority: 'P2' });
      await majorIncidentsService.updateMajorIncident('0002673', { status: 'Investigating', commander: 'Demo User', priority: 'P1' });
    } catch {}
    await loadLiveIncidents();
  };

  const handleAddUpdate = (incidentId: string, update: IncidentUpdate) => {
    const inject = (list: MajorIncident[]): MajorIncident[] =>
      list.map((inc) => inc.id === incidentId ? { ...inc, updates: [...(inc.updates ?? []), update] } : inc);

    setLocalIncidents((prev) => {
      const alreadyLocal = prev.some((i) => i.id === incidentId);
      if (alreadyLocal) return inject(prev);
      const existing = allIncidents.find((i) => i.id === incidentId);
      if (existing) return inject([{ ...existing }, ...prev]);
      return prev;
    });

    majorIncidentsService.addMajorIncidentUpdate(incidentId, {
      message: update.content,
      author: update.author || activeUserName,
    })
      .then((updated) => {
        if (updated) {
          setServerIncidents((prev) => prev.map((i) => i.id === incidentId ? updated : i));
        }
      })
      .catch(() => {});
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
      const existing = allIncidents.find((i) => i.id === incidentId);
      if (existing) return updateAssignee([{ ...existing }, ...prev]);
      return prev;
    });

    majorIncidentsService.updateMajorIncident(incidentId, { commander: newAssignee })
      .then((updated) => {
        if (updated) {
          setServerIncidents((prev) => prev.map((i) => i.id === incidentId ? updated : i));
        }
      })
      .catch(() => {});
    majorIncidentsService.addMajorIncidentUpdate(incidentId, {
      message: `Assignee reassigned to ${newAssignee}`,
      author: activeUserName,
    })
      .then((updated) => {
        if (updated) {
          setServerIncidents((prev) => prev.map((i) => i.id === incidentId ? updated : i));
        }
      })
      .catch(() => {});
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
      const existing = allIncidents.find((i) => i.id === incidentId);
      if (existing) return updatePrio([{ ...existing }, ...prev]);
      return prev;
    });

    majorIncidentsService.updateMajorIncident(incidentId, {
      priority: newPriority === 'Critical' ? 'P1' : 'P2',
    })
      .then((updated) => {
        if (updated) {
          setServerIncidents((prev) => prev.map((i) => i.id === incidentId ? updated : i));
        }
      })
      .catch(() => {});
    majorIncidentsService.addMajorIncidentUpdate(incidentId, {
      message: `Priority changed to ${newPriority}`,
      author: activeUserName,
    })
      .then((updated) => {
        if (updated) {
          setServerIncidents((prev) => prev.map((i) => i.id === incidentId ? updated : i));
        }
      })
      .catch(() => {});
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
      const existing = allIncidents.find((i) => i.id === incidentId);
      if (existing) return updateProd([{ ...existing }, ...prev]);
      return prev;
    });

    majorIncidentsService.updateMajorIncident(incidentId, {
      affectedServices: [newProduct],
    })
      .then((updated) => {
        if (updated) {
          setServerIncidents((prev) => prev.map((i) => i.id === incidentId ? updated : i));
        }
      })
      .catch(() => {});
    majorIncidentsService.addMajorIncidentUpdate(incidentId, {
      message: `Product / CI changed to ${newProduct}`,
      author: activeUserName,
    })
      .then((updated) => {
        if (updated) {
          setServerIncidents((prev) => prev.map((i) => i.id === incidentId ? updated : i));
        }
      })
      .catch(() => {});
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
            loadLiveIncidents();
          }}
          onResetDemo={handleResetDemoIncidents}
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
          onPerformance={() => {
            setIsFeedPopoverOpen(false);
            setIsKpiDrawerOpen(false);
            setOpenPanel(null);
            setIsTimesheetOpen((p) => !p);
          }}
          onStatus={() => {
            setIsFeedPopoverOpen(false);
            setIsTimesheetOpen(false);
            setOpenPanel(null);
            setIsKpiDrawerOpen((p) => !p);
          }}
          onHistory={() => {
            setIsTimesheetOpen(false);
            setIsKpiDrawerOpen(false);
            setOpenPanel(null);
            setIsFeedPopoverOpen((p) => !p);
          }}
          onHelp={() => handlePanel('help')}
          onProfile={() => handlePanel('profile')}
          breadcrumb={BREADCRUMB_LABELS[selectedListId] ?? selectedListId}
        />

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
                      <div><span className="text-gray-400">Effective Permissions:</span> <span className="font-semibold text-cyan-600">{role}</span></div>
                      <div><span className="text-gray-400">Department:</span> <span className="font-medium text-gray-800">{user?.department || 'IT Operations'}</span></div>
                      <div><span className="text-gray-400">Organization:</span> <span className="font-medium text-gray-800">{user?.defaultOrganisation || 'ServiGen Global Tech'}</span></div>
                      <div><span className="text-gray-400">Status:</span> <span className="inline-flex items-center gap-1 font-medium text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online</span></div>
                    </div>
                  </div>
                ) : openPanel === 'history' ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 pb-2 border-b border-gray-100">
                      Audit Log & Live Session History ({liveFeedEntries.length} events)
                    </p>
                    {liveFeedEntries.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No audit log entries recorded this session.</p>
                    ) : (
                      liveFeedEntries.slice(0, 10).map((entry) => (
                        <div key={entry.id} className="p-2.5 rounded-xl border border-gray-100 bg-white shadow-2xs text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                              {entry.ticketRef}
                            </span>
                            <span className="text-gray-400">{entry.timeAgo}</span>
                          </div>
                          <div className="font-semibold text-gray-800">{entry.actionLabel}</div>
                          <p className="text-gray-600 leading-snug">{entry.message}</p>
                          <div className="text-[10px] text-gray-400">By {entry.actorName} • {entry.actorOrg}</div>
                        </div>
                      ))
                    )}
                  </div>
                ) : openPanel === 'performance' ? (
                  <div className="space-y-3 text-xs text-gray-700">
                    <p className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Major Incident SLA Metrics</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                        <div className="text-[10px] text-emerald-600 uppercase font-bold">Response SLA</div>
                        <div className="text-lg font-bold text-emerald-700">—</div>
                        <div className="text-[10px] text-emerald-500">Live SLA monitoring</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-cyan-50 border border-cyan-100">
                        <div className="text-[10px] text-cyan-600 uppercase font-bold">Resolution SLA</div>
                        <div className="text-lg font-bold text-cyan-700">—</div>
                        <div className="text-[10px] text-cyan-500">Live SLA monitoring</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-gray-200 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Active P1 Incidents:</span>
                        <span className="font-bold text-red-600">{allIncidents.filter((i) => i.priority === 'Critical' && !i.lifecycleStages[5]?.isCompleted).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Active P2 Incidents:</span>
                        <span className="font-bold text-orange-600">{allIncidents.filter((i) => i.priority === 'High' && !i.lifecycleStages[5]?.isCompleted).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total In-Progress:</span>
                        <span className="font-bold text-cyan-700">{allIncidents.filter((i) => !i.lifecycleStages[5]?.isCompleted).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Resolved Incidents:</span>
                        <span className="font-bold text-emerald-600">{allIncidents.filter((i) => i.lifecycleStages[5]?.isCompleted).length}</span>
                      </div>
                    </div>
                  </div>
                ) : openPanel === 'status' ? (
                  <div className="space-y-3 text-xs text-gray-700">
                    <p className="font-semibold text-gray-900 border-b border-gray-100 pb-2">System & Service Health</p>
                    <div className="space-y-2">
                      {cmdbServices.length === 0 ? (
                        <div className="text-gray-400 text-xs py-4 text-center">No configuration items registered in CMDB</div>
                      ) : (
                        cmdbServices.map((svc) => {
                          const isAffected = allIncidents.some(
                            (inc) =>
                              !inc.lifecycleStages[5]?.isCompleted &&
                              ((inc.product || '').toLowerCase().includes(svc.toLowerCase()) ||
                               (inc.title || '').toLowerCase().includes(svc.toLowerCase()))
                          );
                          return (
                            <div key={svc} className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200">
                              <span className="font-medium text-gray-800">{svc}</span>
                              <span className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                                isAffected ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isAffected ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                {isAffected ? 'Degraded ⚠' : 'Operational'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                    {PANELS[openPanel].body}
                  </p>
                )}
              </div>
            </div>
          )}


          {/* ── Incident Detail Side Bar Menu (Primary) ── */}
          {selectedIncident && (
            <IncidentDetailPanel
              incident={selectedIncident}
              role={role}
              onClose={() => {
                setSelectedIncidentId(null);
                const url = new URL(window.location.href);
                url.searchParams.delete('incident');
                window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
              }}
              onAdvanceStage={handleAdvanceStage}
              onStepBackStage={handleStepBackStage}
              onSetStage={handleSetStage}
              onReopen={handleReopenIncident}
              onAddUpdate={handleAddUpdate}
              onReassign={handleReassign}
              onUpdatePriority={handleUpdatePriority}
              onUpdateProduct={handleUpdateProduct}
            />
          )}

          {/* ── Activity Feed (··· button only) ── */}
          {!selectedIncident && !openPanel && isFeedOpen && (
            <ActivityFeed entries={liveFeedEntries} onClose={() => setIsFeedOpen(false)} />
          )}
        </div>
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

      {/* Floating Popovers */}
      {isFeedPopoverOpen && (
        <FeedPopover
          onClose={() => setIsFeedPopoverOpen(false)}
          onOpenTicket={(id) => {
            setSelectedIncidentId(id);
            setIsFeedPopoverOpen(false);
          }}
        />
      )}

      {isTimesheetOpen && (
        <TimesheetPopover onClose={() => setIsTimesheetOpen(false)} />
      )}

      {isKpiDrawerOpen && (
        <AgentKpiDrawer
          onClose={() => setIsKpiDrawerOpen(false)}
          onOpenTicket={(id) => {
            setSelectedIncidentId(id);
            setIsKpiDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default SCR022_MajorIncidentsLive;
