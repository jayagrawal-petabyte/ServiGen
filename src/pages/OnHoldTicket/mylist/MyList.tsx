import React from 'react';
import './MyList.css';

export interface MyListItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  category: 'Active' | 'Pending' | 'Actioned' | 'Views';
}

const LIST_ITEMS: MyListItem[] = [
  {
    id: 'my-new-tickets',
    label: 'My New Tickets',
    icon: '📰',
    badge: 12,
    category: 'Active',
  },
  {
    id: 'my-on-hold-tickets',
    label: 'My On Hold Tickets',
    icon: '⛔',
    badge: 24,
    category: 'Pending',
  },
  {
    id: 'my-closed-tickets',
    label: 'My Closed Tickets',
    icon: '✓',
    badge: 84,
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
}

const MyList: React.FC<MyListProps> = ({
  searchQuery,
  setSearchQuery,
  activeView,
  setActiveView,
}) => {
  const categories: Array<'Active' | 'Pending' | 'Actioned' | 'Views'> = [
    'Active',
    'Pending',
    'Actioned',
    'Views',
  ];

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
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#00b4d8" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Header */}
      <div className="panel-my-lists-row">
        <div className="my-lists-icon-btn">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="#00bcd4">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
          </svg>
        </div>
        <span className="my-lists-text">My Lists</span>
        <span className="collapse-arrow">«</span>
      </div>

      {/* Categories & Items */}
      <div className="my-lists-scroll">
        {categories.map((cat) => {
          const items = LIST_ITEMS.filter((i) => i.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="my-lists-group">
              <h4 className="my-lists-category-title">{cat}</h4>
              <div className="my-lists-items-wrap">
                {items.map((item) => {
                  const isActive = activeView === item.label;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`my-list-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveView(item.label)}
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
            onClick={() => alert('Create custom ticket view list')}
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
