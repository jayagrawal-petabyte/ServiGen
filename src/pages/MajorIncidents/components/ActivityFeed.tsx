import React, { useState } from 'react';
import type { ActivityFeedEntry, FeedEntryType } from '../types/majorIncident.types';

interface ActivityFeedProps {
  entries: ActivityFeedEntry[];
  onClose: () => void;
}

type FeedFilter = 'all' | 'tickets' | 'updates' | 'emails';

const TICKET_TYPES = new Set<FeedEntryType>(['new_ticket']);
const UPDATE_TYPES = new Set<FeedEntryType>(['user_update', 'status_change', 'comment_added', 'triaged']);
const EMAIL_TYPES  = new Set<FeedEntryType>(['email_sent']);

const avatarBg: Record<FeedEntryType, string> = {
  new_ticket:            'bg-teal-500',
  user_update:           'bg-teal-500',
  email_sent:            'bg-orange-400',
  triaged:               'bg-gray-500',
  attachment_downloaded: 'bg-teal-500',
  status_change:         'bg-green-600',
  comment_added:         'bg-blue-500',
};

const Avatar: React.FC<{ label: string; type: FeedEntryType }> = ({ label, type }) => (
  <div
    className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 select-none text-white ${avatarBg[type]}`}
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

const ActivityFeed: React.FC<ActivityFeedProps> = ({ entries, onClose }) => {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');

  const filtered = entries.filter((e) => {
    if (activeFilter === 'tickets') return TICKET_TYPES.has(e.type);
    if (activeFilter === 'updates') return UPDATE_TYPES.has(e.type);
    if (activeFilter === 'emails')  return EMAIL_TYPES.has(e.type);
    return true;
  });

  return (
    <aside className="w-80 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <h2 className="text-sm font-semibold text-gray-800">Feed</h2>
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-pointer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close feed"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 shrink-0">
        <div className="relative">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as FeedFilter)}
            className="appearance-none text-[12px] font-medium text-gray-700 bg-white border border-gray-200 rounded px-2.5 py-1 pr-6 focus:outline-none focus:border-cyan-400 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-xs">No activity</div>
        ) : (
          filtered.map((entry) => <FeedEntry key={entry.id} entry={entry} />)
        )}
      </div>
    </aside>
  );
};

export default ActivityFeed;
