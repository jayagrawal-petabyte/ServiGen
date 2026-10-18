import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MajorIncidentsSidebar from './components/MajorIncidentsSidebar';
import IncidentCard from './components/IncidentCard';
import ActivityFeed from './components/ActivityFeed';
import PageHeader from './components/PageHeader';
import NewIncidentModal from './components/NewIncidentModal';
import TicketDetailModal from '../../components/TicketDetailModal/TicketDetailModal';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { majorIncidentsService } from '../../services/majorIncidentsService';
import type { MajorIncident, ActivityFeedEntry, FeedEntryType } from './types/majorIncident.types';

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

const LiveDot: React.FC<{ active: boolean }> = ({ active }) => (
  <span className="relative flex items-center gap-1.5">
    <span
      className={`w-2 h-2 rounded-full ${active ? 'bg-green-400' : 'bg-gray-300'}`}
      style={active ? { boxShadow: '0 0 0 3px rgba(74,222,128,0.25)' } : {}}
    />
    <span className={`text-[10px] font-medium ${active ? 'text-green-600' : 'text-gray-400'}`}>
      {active ? 'Live' : 'Paused'}
    </span>
  </span>
);

const SCR023_MajorIncidentsWithFeed: React.FC = () => {
  const navigate = useNavigate();
  const [isFeedOpen, setIsFeedOpen]         = useState<boolean>(true);
  const [showNewModal, setShowNewModal]     = useState<boolean>(false);
  const [isLive, setIsLive]                 = useState<boolean>(true);
  const [selectedListId, setSelectedListId] = useState<string>('update-required');
  const [searchQuery, setSearchQuery]       = useState<string>('');
  const [localIncidents, setLocalIncidents] = useState<MajorIncident[]>([]);
  const [serverIncidents, setServerIncidents] = useState<MajorIncident[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<MajorIncident | null>(null);
  const [feedEntries, setFeedEntries]       = useState<ActivityFeedEntry[]>([]);
  const [newCount, setNewCount]             = useState<number>(0);

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

  const handleFeedOpen = () => {
    setIsFeedOpen(true);
    setNewCount(0);
  };

  const allIncidents = useMemo(() => {
    const map = new Map<string, MajorIncident>();
    serverIncidents.forEach((inc) => {
      if (!inc.id.startsWith('000267')) map.set(inc.id, inc);
    });
    localIncidents.forEach((inc) => {
      if (!inc.id.startsWith('000267')) map.set(inc.id, inc);
    });
    return Array.from(map.values());
  }, [serverIncidents, localIncidents]);

  useEffect(() => {
    const entries: ActivityFeedEntry[] = [];
    allIncidents.forEach((inc) => {
      if (inc.id.startsWith('000267')) return;
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
    setFeedEntries(entries);
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

  const handleAddIncident = (incident: MajorIncident) => {
    setLocalIncidents((prev) => [incident, ...prev]);
    // also add a feed entry for the new ticket
    const feedEntry: ActivityFeedEntry = {
      id: `new-${Date.now()}`,
      avatarLabel: incident.assignee.slice(0, 2).toUpperCase() || 'MI',
      actorName: incident.assignee !== 'Unassigned' ? incident.assignee : 'System',
      actorOrg: '',
      ticketRef: `#${incident.id}`,
      actionLabel: 'New Ticket Logged',
      message: incident.title,
      timeAgo: 'just now',
      type: 'new_ticket' as FeedEntryType,
    };
    setFeedEntries((prev) => [feedEntry, ...prev]);
    if (!isFeedOpen) setNewCount((c) => c + 1);

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
            totalCount={displayedIncidents.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onRefresh={() => { setSearchQuery(''); loadLiveIncidents(); }}
            onToggleFeed={isFeedOpen ? () => setIsFeedOpen(false) : handleFeedOpen}
            feedNewCount={newCount}
            onNew={() => setShowNewModal(true)}
            breadcrumb="Update Required + Feed"
          />

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-semibold text-gray-800 text-sm">Major Incidents + Feed</span>
                  <span className="text-gray-300">·</span>
                  <span>{displayedIncidents.length === 0 ? '0' : `1–${displayedIncidents.length}`} of {displayedIncidents.length}</span>
                </div>
              </div>

              {displayedIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <p className="text-sm">No major incidents found</p>
                </div>
              ) : (
                displayedIncidents.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onClick={() => setSelectedTicketForModal(incident)}
                  />
                ))
              )}
            </div>

            {isFeedOpen && (
              <LiveActivityFeed
                entries={feedEntries}
                isLive={isLive}
                onToggleLive={() => setIsLive((v) => !v)}
                onClose={() => setIsFeedOpen(false)}
              />
            )}
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
            status: selectedTicketForModal.lifecycleStages.find((s) => s.isActive)?.label ?? 'Active',
            department: selectedTicketForModal.product,
            category: 'Major Incident Feed View',
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

type LiveFeedFilter = 'all' | 'tickets' | 'updates';

interface LiveActivityFeedProps {
  entries: ActivityFeedEntry[];
  isLive: boolean;
  onToggleLive: () => void;
  onClose: () => void;
}

const LIVE_TICKET_TYPES = new Set<FeedEntryType>(['new_ticket']);
const LIVE_UPDATE_TYPES = new Set<FeedEntryType>(['user_update', 'status_change', 'comment_added', 'triaged']);

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ entries, isLive, onToggleLive, onClose }) => {
  const [activeFilter, setActiveLiveFilter] = useState<LiveFeedFilter>('all');

  const filteredEntries = entries.filter((e) => {
    if (activeFilter === 'tickets') return LIVE_TICKET_TYPES.has(e.type);
    if (activeFilter === 'updates') return LIVE_UPDATE_TYPES.has(e.type);
    return true;
  });

  const typeAccent: Record<string, { dot: string; badge: string; badgeText: string }> = {
    new_ticket:            { dot: 'bg-blue-500',   badge: 'bg-blue-50 border-blue-200',     badgeText: 'text-blue-700'   },
    user_update:           { dot: 'bg-purple-500', badge: 'bg-purple-50 border-purple-200', badgeText: 'text-purple-700' },
    email_sent:            { dot: 'bg-teal-500',   badge: 'bg-teal-50 border-teal-200',     badgeText: 'text-teal-700'   },
    triaged:               { dot: 'bg-orange-400', badge: 'bg-orange-50 border-orange-200', badgeText: 'text-orange-700' },
    attachment_downloaded: { dot: 'bg-gray-400',   badge: 'bg-gray-50 border-gray-200',     badgeText: 'text-gray-600'   },
    status_change:         { dot: 'bg-green-500',  badge: 'bg-green-50 border-green-200',   badgeText: 'text-green-700'  },
    comment_added:         { dot: 'bg-yellow-400', badge: 'bg-yellow-50 border-yellow-200', badgeText: 'text-yellow-700' },
  };

  return (
    <aside className="w-72 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">Activity Feed</h2>
            <LiveDot active={isLive} />
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">{entries.length} events</p>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close activity feed"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-1">
          {(['all', 'tickets', 'updates'] as LiveFeedFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setActiveLiveFilter(f)}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                activeFilter === f
                  ? 'text-blue-600 bg-blue-50 border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={onToggleLive}
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
            isLive
              ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
              : 'text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}
        >
          {isLive ? '⏸ Pause' : '▶ Resume'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {filteredEntries.map((entry) => {
          const accent = typeAccent[entry.type] ?? typeAccent.comment_added;
          return (
            <div key={entry.id} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
              <div className="flex flex-col items-center gap-1 pt-0.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 select-none ${
                    /^\d+$/.test(entry.avatarLabel) ? 'bg-orange-400 text-white' : 'bg-blue-600 text-white'
                  }`}
                >
                  {entry.avatarLabel}
                </div>
                <span className={`w-1.5 h-1.5 rounded-full ${accent.dot} opacity-60`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  {entry.actorName && (
                    <span className="text-xs font-semibold text-gray-800">{entry.actorName}</span>
                  )}
                  {entry.actorOrg && (
                    <span className="text-[10px] text-gray-400">{entry.actorOrg}</span>
                  )}
                  <span className="text-[10px] font-mono text-[#eb6a47] border border-[#f8c5b1] rounded-full px-1.5 py-0.5 leading-none">
                    {entry.ticketRef}
                  </span>
                </div>
                <span className={`inline-block mt-1 text-[10px] font-medium border rounded-sm px-1.5 py-0.5 leading-none ${accent.badge} ${accent.badgeText}`}>
                  {entry.actionLabel}
                </span>
                {entry.message && (
                  <p className="mt-1 text-xs text-gray-500 leading-snug line-clamp-2">{entry.message}</p>
                )}
                <p className="mt-1 text-[10px] text-gray-400">{entry.timeAgo}</p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default SCR023_MajorIncidentsWithFeed;
