import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyList.css';
import {
  fetchTicketQueueCounts,
  fetchCustomListsSummary,
  type CustomListSummary,
  type QueueCounts,
} from '../services/onHoldTicketsApi';

export interface MyListItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  category: 'Active' | 'Pending' | 'Actioned' | 'Views';
}

const DEFAULT_LIST_ITEMS: MyListItem[] = [
  {
    id: 'my-new-tickets',
    label: 'My New Tickets',
    icon: '📰',
    badge: 0,
    category: 'Active',
  },
  {
    id: 'my-on-hold-tickets',
    label: 'My On Hold Tickets',
    icon: '⛔',
    badge: 0,
    category: 'Pending',
  },
  {
    id: 'my-closed-tickets',
    label: 'My Closed Tickets',
    icon: '✓',
    badge: 0,
    category: 'Actioned',
  },
  {
    id: 'my-followed-tickets',
    label: 'My Followed Tickets',
    icon: '🚶',
    category: 'Views',
  },
];

interface MyListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  ticketsCount?: number;
  onCreateNewList?: () => void;
}

const MyList: React.FC<MyListProps> = ({
  searchQuery,
  setSearchQuery,
  activeView,
  setActiveView,
  ticketsCount,
  onCreateNewList,
}) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<QueueCounts | null>(null);
  const [customLists, setCustomLists] = useState<CustomListSummary[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    const match = DEFAULT_LIST_ITEMS.find((i) => i.label === activeView);
    return match ? match.id : 'my-new-tickets';
  });

  // Fetch live backend counts & custom lists on mount
  useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        const [liveCounts, liveCustomLists] = await Promise.all([
          fetchTicketQueueCounts(),
          fetchCustomListsSummary(),
        ]);
        if (isMounted) {
          if (liveCounts) setCounts(liveCounts);
          if (liveCustomLists) setCustomLists(liveCustomLists);
        }
      } catch (err) {
        console.warn('[MyList] Error loading backend queue data:', err);
      }
    }

    loadBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories: Array<'Active' | 'Pending' | 'Actioned' | 'Views'> = [
    'Active',
    'Pending',
    'Actioned',
    'Views',
  ];

  // Merge static list items with live counts & synchronize active badge with table length
  const items: MyListItem[] = DEFAULT_LIST_ITEMS.map((item) => {
    let badge = 0;
    if (counts) {
      if (item.id === 'my-new-tickets') {
        badge = counts.active ?? 0;
      } else if (item.id === 'my-on-hold-tickets') {
        badge = counts.onHold ?? counts.pending ?? 0;
      } else if (item.id === 'my-closed-tickets') {
        badge = counts.actioned ?? 0;
      }
    }
    // Synchronize active view badge with real ticket list count (e.g. 12)
    if (activeView === item.label && typeof ticketsCount === 'number' && ticketsCount > 0) {
      badge = ticketsCount;
    }
    return { ...item, badge };
  });

  // Append any user-created lists from backend list-builder under "Views"
  const userCustomItems: MyListItem[] = customLists.map((cl) => ({
    id: `custom-list-${cl.id}`,
    label: cl.name,
    icon: '📑',
    category: 'Views',
  }));

  const allItems = [...items, ...userCustomItems];

  useEffect(() => {
    // If activeView changes externally, sync selectedItemId
    const currentItem = allItems.find((i) => i.id === selectedItemId);
    if (!currentItem || currentItem.label !== activeView) {
      const match = allItems.find((i) => i.label === activeView);
      if (match) setSelectedItemId(match.id);
    }
  }, [activeView, allItems.length]);

  const handleCreateListClick = () => {
    if (onCreateNewList) {
      onCreateNewList();
    } else {
      // Seamlessly navigate to the Custom Lists / List Builder page
      navigate('/custom-lists');
    }
  };

  return (
    <div className="left-panel">
      {/* Search Input */}
      <div className="search-bar-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search Tickets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#eb6a47" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Header */}
      <div className="panel-my-lists-row">
        <div className="my-lists-icon-btn">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="#eb6a47">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
          </svg>
        </div>
        <span className="my-lists-text">My Lists</span>
        <span className="collapse-arrow">«</span>
      </div>

      {/* Categories & Items */}
      <div className="my-lists-scroll">
        {categories.map((cat) => {
          const groupItems = allItems.filter((i) => i.category === cat);
          if (groupItems.length === 0) return null;
          return (
            <div key={cat} className="my-lists-group">
              <h4 className="my-lists-category-title">{cat}</h4>
              <div className="my-lists-items-wrap">
                {groupItems.map((item) => {
                  // Scope selection strictly by item.id so duplicate labels (e.g. 3 Agent Lists) select individually
                  const isActive = selectedItemId === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`my-list-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedItemId(item.id);
                        setActiveView(item.label);
                      }}
                    >
                      <div className="my-list-nav-left">
                        <span className="my-list-item-icon">{item.icon}</span>
                        <span className="my-list-item-label">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`my-list-badge ${isActive ? 'active' : ''}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Create a new List button */}
        <div className="my-lists-create-wrap">
          <button
            type="button"
            className="my-lists-create-btn"
            onClick={handleCreateListClick}
            title="Create a new custom ticket view list"
          >
            <span className="create-plus-icon">⊕</span>
            <span>Create a new List</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyList;
