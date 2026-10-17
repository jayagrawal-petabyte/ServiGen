import React, { useState, useMemo, useEffect, useRef } from 'react';
import MajorIncidentsSidebar from './components/MajorIncidentsSidebar';
import IncidentCard from './components/IncidentCard';
import ActivityFeed from './components/ActivityFeed';
import PageHeader from './components/PageHeader';
import NewIncidentModal from './components/NewIncidentModal';
import { MOCK_MAJOR_INCIDENTS, MOCK_FEED_ENTRIES } from './data/mockData';
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

const LIVE_EVENTS: Array<Omit<ActivityFeedEntry, 'id'>> = [
  {
    avatarLabel: 'SA',
    actorName: 'Sanjay Arora',
    actorOrg: 'Ops/APAC',
    ticketRef: '#3996',
    actionLabel: 'Status Change',
    message: 'Escalated to Major Incident — all on-call engineers notified.',
    timeAgo: 'just now',
    type: 'status_change' as FeedEntryType,
  },
  {
    avatarLabel: 'KP',
    actorName: 'Kavya Pillai',
    actorOrg: 'SRE/EMEA',
    ticketRef: '#3995',
    actionLabel: 'Comment Added',
    message: 'Root cause identified: misconfigured load balancer rule on prod-lb-02.',
    timeAgo: 'just now',
    type: 'comment_added' as FeedEntryType,
  },
  {
    avatarLabel: '7',
    actorName: '',
    ticketRef: '#3997',
    actionLabel: 'New Ticket Logged',
    message: 'API gateway returning 503 for all /payments endpoints.',
    timeAgo: 'just now',
    type: 'new_ticket' as FeedEntryType,
  },
  {
    avatarLabel: 'DU',
    actorName: 'Demo User',
    actorOrg: 'consultation/EMEA',
    ticketRef: '#3995',
    actionLabel: 'User Update',
    message: 'Customer impact confirmed — approx. 400 users affected.',
    timeAgo: 'just now',
    type: 'user_update' as FeedEntryType,
  },
];

let liveEventIndex = 0;

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
  const [isFeedOpen, setIsFeedOpen]         = useState<boolean>(true);
  const [showNewModal, setShowNewModal]     = useState<boolean>(false);
  const [isLive, setIsLive]                 = useState<boolean>(true);
  const [selectedListId, setSelectedListId] = useState<string>('update-required');
  const [searchQuery, setSearchQuery]       = useState<string>('');
  const [localIncidents, setLocalIncidents] = useState<MajorIncident[]>([]);
  const [feedEntries, setFeedEntries]       = useState<ActivityFeedEntry[]>(MOCK_FEED_ENTRIES);
  const [newCount, setNewCount]             = useState<number>(0);
  const intervalRef                         = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      const template = LIVE_EVENTS[liveEventIndex % LIVE_EVENTS.length];
      liveEventIndex += 1;
      const newEntry: ActivityFeedEntry = {
        ...template,
        id: `live-${Date.now()}`,
        timeAgo: 'just now',
      };
      setFeedEntries((prev) => [newEntry, ...prev]);
      setNewCount((prev) => prev + 1);
    }, 8000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLive]);

  const handleFeedOpen = () => {
    setIsFeedOpen(true);
    setNewCount(0);
  };

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
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <MajorIncidentsSidebar onSelectList={setSelectedListId} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PageHeader
          totalCount={displayedIncidents.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleFeed={isFeedOpen ? () => setIsFeedOpen(false) : handleFeedOpen}
          feedNewCount={newCount}
          onNew={() => setShowNewModal(true)}
          breadcrumb="Update Required + Feed"
        />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <span className="font-medium text-gray-700">Major Incidents + Feed</span>
              <span className="text-gray-300">·</span>
              <span>{displayedIncidents.length === 0 ? '0' : `1–${displayedIncidents.length}`} of {displayedIncidents.length}</span>
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
            <LiveActivityFeed
              entries={feedEntries}
              isLive={isLive}
              onToggleLive={() => setIsLive((v) => !v)}
              onClose={() => setIsFeedOpen(false)}
            />
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
                  <span className="text-[10px] font-mono text-cyan-600 border border-cyan-300 rounded-full px-1.5 py-0.5 leading-none">
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
