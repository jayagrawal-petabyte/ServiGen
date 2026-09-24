import React from 'react';

export default function ArticleDraftSidebar({
  activeView,
  onSelectView,
  searchQuery,
  onSearchChange
}) {
  return (
    <aside className="article-drafts-subnav">
      {/* Search Input */}
      <div className="subnav-search-box">
        <input
          type="text"
          placeholder="Search Article Drafts"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <svg
          className="subnav-search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* All Article Drafts item */}
      <button
        type="button"
        className={`subnav-all-drafts-btn ${activeView === 'all' ? 'active' : ''}`}
        onClick={() => onSelectView('all')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <circle cx="12" cy="14" r="2.5" />
          <line x1="14" y1="16" x2="16" y2="18" />
        </svg>
        <span>All Article Drafts</span>
      </button>

      {/* Select a View header */}
      <div className="subnav-section-title">Select a View</div>

      {/* View list */}
      <div className="subnav-menu-list">
        <button
          type="button"
          className={`subnav-menu-item ${activeView === 'my-lists' ? 'active' : ''}`}
          onClick={() => onSelectView('my-lists')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>My Lists</span>
        </button>

        <button
          type="button"
          className={`subnav-menu-item ${activeView === 'by-agent' ? 'active' : ''}`}
          onClick={() => onSelectView('by-agent')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Article Drafts by Agent</span>
        </button>

        <button
          type="button"
          className={`subnav-menu-item ${activeView === 'by-team' ? 'active' : ''}`}
          onClick={() => onSelectView('by-team')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Article Drafts by Team</span>
        </button>

        <button
          type="button"
          className={`subnav-menu-item ${activeView === 'by-status' ? 'active' : ''}`}
          onClick={() => onSelectView('by-status')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>Article Drafts by Status</span>
        </button>
      </div>
    </aside>
  );
}
