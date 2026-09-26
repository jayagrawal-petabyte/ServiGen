/**
 * ActivityFeed — right-hand sliding panel (SCR-021)
 *
 * Shows a chronological list of activity entries across all incidents.
 * Each entry has an avatar, actor name, ticket ref, action label,
 * optional message body, and a timestamp.
 */

import React from 'react';
import type { ActivityFeedEntry, FeedEntryType } from '../types/majorIncident.types';

interface ActivityFeedProps {
  entries: ActivityFeedEntry[];
  onClose: () => void;
}

// ── Colour mapping per entry type ──────────────────────────────────────────────

const typeAccent: Record<FeedEntryType, { dot: string; badge: string; badgeText: string }> = {
  new_ticket:             { dot: 'bg-blue-500',   badge: 'bg-blue-50 border-blue-200',   badgeText: 'text-blue-700'   },
  user_update:            { dot: 'bg-purple-500', badge: 'bg-purple-50 border-purple-200', badgeText: 'text-purple-700' },
  email_sent:             { dot: 'bg-teal-500',   badge: 'bg-teal-50 border-teal-200',   badgeText: 'text-teal-700'   },
  triaged:                { dot: 'bg-orange-400', badge: 'bg-orange-50 border-orange-200', badgeText: 'text-orange-700' },
  attachment_downloaded:  { dot: 'bg-gray-400',   badge: 'bg-gray-50 border-gray-200',   badgeText: 'text-gray-600'   },
  status_change:          { dot: 'bg-green-500',  badge: 'bg-green-50 border-green-200', badgeText: 'text-green-700'  },
  comment_added:          { dot: 'bg-yellow-400', badge: 'bg-yellow-50 border-yellow-200', badgeText: 'text-yellow-700' },
};

// ── Avatar ─────────────────────────────────────────────────────────────────────

const Avatar: React.FC<{ label: string }> = ({ label }) => {
  // Single digit → show as a small count bubble in orange
  const isCount = /^\d+$/.test(label);
  return (
    <div
      className={`
        w-7 h-7 rounded-full flex items-center justify-center
        text-[11px] font-bold shrink-0 select-none
        ${isCount
          ? 'bg-orange-400 text-white'
          : 'bg-blue-600 text-white'}
      `}
    >
      {label}
    </div>
  );
};

// ── Single feed entry ──────────────────────────────────────────────────────────

const FeedEntry: React.FC<{ entry: ActivityFeedEntry }> = ({ entry }) => {
  const accent = typeAccent[entry.type];
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* Avatar + vertical connector dot */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <Avatar label={entry.avatarLabel} />
        <span className={`w-1.5 h-1.5 rounded-full ${accent.dot} opacity-60`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Actor + ticket ref */}
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

        {/* Action label badge */}
        <span className={`
          inline-block mt-1 text-[10px] font-medium border rounded-sm px-1.5 py-0.5 leading-none
          ${accent.badge} ${accent.badgeText}
        `}>
          {entry.actionLabel}
        </span>

        {/* Optional message body */}
        {entry.message && (
          <p className="mt-1 text-xs text-gray-500 leading-snug line-clamp-2">
            {entry.message}
          </p>
        )}

        {/* Timestamp */}
        <p className="mt-1 text-[10px] text-gray-400">{entry.timeAgo}</p>
      </div>
    </div>
  );
};

// ── Panel ──────────────────────────────────────────────────────────────────────

const ActivityFeed: React.FC<ActivityFeedProps> = ({ entries, onClose }) => {
  return (
    <aside className="w-72 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Activity Feed</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">{entries.length} recent events</p>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close activity feed"
        >
          {/* × icon */}
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 shrink-0">
        <button className="text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
          All
        </button>
        <button className="text-[11px] text-gray-500 hover:text-gray-700 px-2 py-0.5 rounded-full hover:bg-gray-100 transition-colors">
          Tickets
        </button>
        <button className="text-[11px] text-gray-500 hover:text-gray-700 px-2 py-0.5 rounded-full hover:bg-gray-100 transition-colors">
          Updates
        </button>
      </div>

      {/* Scrollable entry list */}
      <div className="flex-1 overflow-y-auto px-4">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
            No activity yet
          </div>
        ) : (
          entries.map((entry) => <FeedEntry key={entry.id} entry={entry} />)
        )}
      </div>
    </aside>
  );
};

export default ActivityFeed;
