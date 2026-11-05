import React, { useState } from 'react';
import type { ActivityFeedEntry, FeedEntryType } from '../types/majorIncident.types';

interface ActivityFeedProps {
  entries: ActivityFeedEntry[];
  onClose: () => void;
  onPostUpdate?: (message: string, incidentId?: string) => Promise<void> | void;
  incidents?: Array<{ id: string; title: string }>;
  defaultIncidentId?: string;
}

type FeedFilter = 'all' | 'tickets' | 'updates' | 'emails';

const TICKET_TYPES = new Set<FeedEntryType>(['new_ticket']);
const UPDATE_TYPES = new Set<FeedEntryType>(['user_update', 'status_change', 'comment_added', 'triaged']);
const EMAIL_TYPES  = new Set<FeedEntryType>(['email_sent']);

const getAvatarStyle = (label: string) => {
  if (label === 'DU') return 'bg-[#13273e] text-white font-bold';
  if (label === 'JW') return 'bg-[#f59e0b] text-white font-bold';
  if (label === 'Q') return 'bg-[#bae6fd] text-[#0369a1] font-bold';
  return 'bg-[#13273e] text-white font-bold';
};

const Avatar: React.FC<{ label: string; type: FeedEntryType }> = ({ label }) => (
  <div
    className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] shrink-0 select-none shadow-2xs ${getAvatarStyle(label)}`}
  >
    {label}
  </div>
);

const FeedEntry: React.FC<{ entry: ActivityFeedEntry }> = ({ entry }) => (
  <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
    <Avatar label={entry.avatarLabel} type={entry.type} />

    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-gray-800 truncate">
          {entry.actorName
            ? `${entry.actorName}${entry.actorOrg ? ` (${entry.actorOrg})` : ''}`
            : entry.actorOrg ?? ''}
        </span>
        <span className="text-[11px] text-gray-400 shrink-0">{entry.timeAgo}</span>
      </div>

      <p className="text-[12px] font-semibold text-gray-700 mt-0.5">
        {entry.ticketRef} — {entry.actionLabel}
      </p>

      {entry.message && (
        <p className="mt-0.5 text-[11px] text-gray-500 leading-snug line-clamp-3">{entry.message}</p>
      )}
    </div>
  </div>
);

const FILTER_OPTIONS: { value: FeedFilter; label: string }[] = [
  { value: 'all',     label: 'All Activity' },
  { value: 'tickets', label: 'Tickets'      },
  { value: 'updates', label: 'Updates'      },
  { value: 'emails',  label: 'Emails'       },
];

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  entries,
  onClose,
  onPostUpdate,
  incidents = [],
  defaultIncidentId,
}) => {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [targetIncidentId, setTargetIncidentId] = useState<string>(
    defaultIncidentId || (incidents.length > 0 ? incidents[0].id : '')
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filtered = entries.filter((e) => {
    if (activeFilter === 'tickets') return TICKET_TYPES.has(e.type);
    if (activeFilter === 'updates') return UPDATE_TYPES.has(e.type);
    if (activeFilter === 'emails')  return EMAIL_TYPES.has(e.type);
    return true;
  });

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim() || !onPostUpdate) return;

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const cleanMsg = broadcastMessage.replace(/<[^>]*>?/gm, '').trim();
      if (!cleanMsg) return;
      const targetId = targetIncidentId || defaultIncidentId || (incidents.length > 0 ? incidents[0].id : undefined);
      await onPostUpdate(cleanMsg, targetId);
      setBroadcastMessage('');
      setStatusMessage('✓ Update posted to live timeline');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('⚠️ Could not post update');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="w-80 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Feed Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900">Activity Feed</h2>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live telemetry active" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent"
            aria-label="Close feed"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Post Broadcast / War-Room Update Composer */}
      {onPostUpdate && (
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
              <span>📡</span> Post Broadcast Update
            </span>
            {incidents.length > 1 && (
              <select
                value={targetIncidentId}
                onChange={(e) => setTargetIncidentId(e.target.value)}
                className="text-[10px] font-semibold text-gray-600 bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>#{inc.id}</option>
                ))}
              </select>
            )}
          </div>
          <form onSubmit={handlePostSubmit} className="space-y-2">
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="e.g. Teams war-room link shared with Database responders..."
              className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#eb6a47] resize-none text-gray-800"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 truncate max-w-[170px]">
                {statusMessage ? (
                  <span className="text-emerald-600 font-semibold">{statusMessage}</span>
                ) : (
                  'Syncs with incident audit log'
                )}
              </span>
              <button
                type="submit"
                disabled={!broadcastMessage.trim() || isSubmitting}
                className="px-3 py-1 bg-[#eb6a47] hover:bg-[#db5936] disabled:opacity-50 text-white text-[11px] font-bold rounded-md transition-colors cursor-pointer border-none flex items-center gap-1 shadow-2xs"
              >
                {isSubmitting ? 'Posting...' : 'Post Update'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
        <div className="relative">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as FeedFilter)}
            className="appearance-none text-[12px] font-semibold text-gray-700 bg-transparent pr-5 focus:outline-none cursor-pointer"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        <button className="text-gray-400 hover:text-gray-600 p-1 border-none bg-transparent" title="Filter activity">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto px-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center px-4">
            <svg className="w-8 h-8 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-semibold text-gray-600">No activity logged</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Post an update to see live timeline events appear here.</p>
          </div>
        ) : (
          filtered.map((entry) => <FeedEntry key={entry.id} entry={entry} />)
        )}
      </div>
    </aside>
  );
};

export default ActivityFeed;
