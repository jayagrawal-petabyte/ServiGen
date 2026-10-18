import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import './FeedPopover.css';

interface FeedPopoverProps {
  onClose: () => void;
  onOpenTicket?: (ticketId: string) => void;
}

interface FeedItem {
  id: string;
  avatar: string;
  avatarBg?: string;
  authorName: string;
  authorOrg?: string;
  ticketId: string;
  actionText: string;
  snippet: string;
  timestamp: string;
  category: 'major' | 'stage' | 'ticket' | 'update';
}

type FilterType = 'all' | 'major' | 'stage' | 'ticket' | 'update';

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'All Activity',
  major: 'Major Incidents',
  stage: 'Stage Advancements',
  ticket: 'New Tickets',
  update: 'Incident Updates',
};

export const FeedPopover: React.FC<FeedPopoverProps> = ({ onClose, onOpenTicket }) => {
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled([
      api.get('/api/major-incidents'),
      api.get('/api/tickets'),
    ]).then(([miRes, tickRes]) => {
      if (!isMounted) return;

      const items: FeedItem[] = [];

      // 1. Live Major Incident Updates
      if (miRes.status === 'fulfilled' && Array.isArray(miRes.value?.data)) {
        miRes.value.data.forEach((mi: any) => {
          (mi.updates || []).forEach((u: any, idx: number) => {
            const author = u.author || 'Commander';
            const initials = author.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'DU';
            const isStageChange = u.type === 'stage_change' || (u.message || u.content || '').toLowerCase().includes('stage');
            items.push({
              id: `mi-up-${mi.id}-${idx}`,
              avatar: initials,
              authorName: author,
              authorOrg: mi.product || 'Infrastructure',
              ticketId: String(mi.id),
              actionText: isStageChange ? 'Stage Advanced' : 'Incident Update',
              snippet: u.content || u.message || mi.title,
              timestamp: u.timestamp || 'Live',
              category: isStageChange ? 'stage' : 'update',
            });
          });

          // Incident declared event
          const commander = mi.commander || 'Admin';
          const cmdInitials = commander.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'IA';
          items.push({
            id: `mi-decl-${mi.id}`,
            avatar: cmdInitials,
            authorName: commander,
            authorOrg: mi.product || 'ITSM',
            ticketId: String(mi.id),
            actionText: 'Major Incident Declared',
            snippet: mi.title,
            timestamp: 'Live',
            category: 'major',
          });
        });
      }

      // 2. Live Tickets Logged
      if (tickRes.status === 'fulfilled' && Array.isArray(tickRes.value?.data)) {
        tickRes.value.data.slice(0, 6).forEach((t: any) => {
          const author = t.assignee || t.agent || 'Support Lead';
          const initials = author.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'JW';
          items.push({
            id: `tick-${t.id}`,
            avatar: initials,
            authorName: author,
            authorOrg: t.organisation || t.organisationId || 'ServiGen',
            ticketId: String(t.id),
            actionText: 'New Ticket Logged',
            snippet: t.summary || 'Ticket active in service queue',
            timestamp: 'Recent',
            category: 'ticket',
          });
        });
      }

      setFeedItems(items);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTicketClick = (ticketId: string) => {
    if (onOpenTicket) {
      onOpenTicket(ticketId);
    } else {
      onClose();
      navigate(`/major-incidents/live?incident=${ticketId}`);
    }
  };

  const filteredItems = feedItems.filter((item) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'major') return item.category === 'major' || item.ticketId.startsWith('MI-') || item.ticketId.startsWith('000267');
    if (selectedFilter === 'stage') return item.category === 'stage';
    if (selectedFilter === 'ticket') return item.category === 'ticket';
    if (selectedFilter === 'update') return item.category === 'update';
    return true;
  });

  return (
    <div className="feed-floating-popover">
      {/* Header */}
      <div className="feed-popover-header">
        <h3 className="feed-popover-title">Feed</h3>
        <button
          type="button"
          className="feed-popover-close-btn"
          onClick={onClose}
          title="Close Feed"
        >
          ✕
        </button>
      </div>

      {/* Subheader Filter & Popout */}
      <div className="feed-subheader-row">
        {/* Interactive Filter Dropdown */}
        <div className="feed-filter-dropdown-container" ref={filterDropdownRef}>
          <button
            type="button"
            className="feed-filter-dropdown cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors flex items-center gap-1.5 border border-transparent hover:border-gray-200"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-expanded={isFilterOpen}
            aria-haspopup="true"
          >
            <span>{FILTER_LABELS[selectedFilter]}</span>
            <span className={`dropdown-caret transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {isFilterOpen && (
            <div className="feed-filter-menu animate-in fade-in duration-100">
              {(Object.keys(FILTER_LABELS) as FilterType[]).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  className={`feed-filter-option ${selectedFilter === filterKey ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedFilter(filterKey);
                    setIsFilterOpen(false);
                  }}
                >
                  <span>{FILTER_LABELS[filterKey]}</span>
                  {selectedFilter === filterKey && <span className="text-emerald-600 font-bold">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="feed-popout-btn hover:text-cyan-600 hover:bg-gray-100 rounded p-1 transition-colors cursor-pointer"
          title="Open Major Incidents Live View"
          onClick={() => {
            onClose();
            navigate('/major-incidents/live');
          }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </button>
      </div>

      {/* Feed Cards Stack (Live Backend Stream) */}
      <div className="feed-cards-stack">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center text-gray-400">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Connecting to live feed…</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 bg-white border border-dashed border-gray-200 rounded-xl">
            No activity found for {FILTER_LABELS[selectedFilter].toLowerCase()}.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="feed-card-item">
              <div className="feed-card-top">
                <div className="feed-avatar-circle bg-[#13273e] text-white font-bold">
                  {item.avatar}
                </div>
                <div className="feed-card-meta">
                  <div className="feed-author-line">
                    <span className="feed-author-name">{item.authorName}</span>
                    {item.authorOrg && <span className="feed-author-org">({item.authorOrg})</span>}
                  </div>
                  <button
                    type="button"
                    className="feed-ticket-link"
                    onClick={() => handleTicketClick(item.ticketId)}
                  >
                    <span className="ticket-num">#{item.ticketId}</span>
                    <span className="ticket-dash">-</span>
                    <span className="ticket-action">{item.actionText}</span>
                  </button>
                </div>
                <span className="feed-timestamp">{item.timestamp}</span>
              </div>
              <p className="feed-snippet-text">{item.snippet}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedPopover;
