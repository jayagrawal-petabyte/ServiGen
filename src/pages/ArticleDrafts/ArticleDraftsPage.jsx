import React, { useState, useMemo } from 'react';
import { INITIAL_ARTICLE_DRAFTS } from './mockArticleDraftsData';
import ArticleDraftSidebar from './ArticleDraftSidebar';
import ArticleDraftsDesignView from './ArticleDraftsDesignView';
import ArticleDraftsLiveView from './ArticleDraftsLiveView';
import ArticleDraftDetailModal from './ArticleDraftDetailModal';
import './articleDrafts.css';

export default function ArticleDraftsPage() {
  const [drafts, setDrafts] = useState(INITIAL_ARTICLE_DRAFTS);
  const [viewMode, setViewMode] = useState('design'); // 'design' | 'live'
  const [activeSubnavView, setActiveSubnavView] = useState('all'); // 'all' | 'my-lists' | 'by-agent' | 'by-team' | 'by-status'
  const [searchQuery, setSearchQuery] = useState('');
  const [perPage, setPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Subnav filtering
  const filteredByView = useMemo(() => {
    switch (activeSubnavView) {
      case 'my-lists':
        return drafts.filter((d) => d.author === 'Demo User' || d.author === 'Aditya Kumar Singh');
      case 'by-status':
        return drafts.filter((d) => d.status === 'Draft' || d.status === 'Awaiting Approval');
      case 'by-agent':
      case 'by-team':
      case 'all':
      default:
        return drafts;
    }
  }, [drafts, activeSubnavView]);

  // Search filtering
  const searchedDrafts = useMemo(() => {
    if (!searchQuery.trim()) return filteredByView;
    const q = searchQuery.toLowerCase();
    return filteredByView.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.summaryTitle.toLowerCase().includes(q) ||
        d.summarySubtitle.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.author.toLowerCase().includes(q) ||
        d.status.toLowerCase().includes(q)
    );
  }, [filteredByView, searchQuery]);

  // Sorting
  const sortedDrafts = useMemo(() => {
    return [...searchedDrafts].sort((a, b) => {
      const cmp = a.id.localeCompare(b.id);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [searchedDrafts, sortDirection]);

  // Pagination
  const totalDrafts = sortedDrafts.length;
  const totalPages = Math.ceil(totalDrafts / perPage) || 1;
  const paginatedDrafts = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedDrafts.slice(start, start + perPage);
  }, [sortedDrafts, currentPage, perPage]);

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const pageIds = paginatedDrafts.map((d) => d.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Status updates
  const handleUpdateStatus = (id, newStatus) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
  };

  // Bulk actions
  const handleBulkSubmit = () => {
    setDrafts((prev) =>
      prev.map((d) =>
        selectedIds.includes(d.id) ? { ...d, status: 'Awaiting Approval' } : d
      )
    );
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedIds.length} selected draft(s)?`)) {
      setDrafts((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
      setSelectedIds([]);
    }
  };

  const handleToggleSort = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleResetData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setDrafts(INITIAL_ARTICLE_DRAFTS);
      setIsLoading(false);
      setSearchQuery('');
      setActiveSubnavView('all');
      setSelectedIds([]);
      setCurrentPage(1);
    }, 400);
  };

  return (
    <div className="article-drafts-container">
      {/* Peach Sub-Navigation Panel */}
      <ArticleDraftSidebar
        activeView={activeSubnavView}
        onSelectView={(v) => {
          setActiveSubnavView(v);
          setCurrentPage(1);
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
      />

      {/* Main Content Area */}
      <section className="article-drafts-main">
        {/* Top View Mode Bar (Figma Design View vs Live View) */}
        <div className="view-mode-bar">
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'design' ? 'active' : ''}`}
              onClick={() => setViewMode('design')}
            >
              Design View (Figma)
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'live' ? 'active' : ''}`}
              onClick={() => setViewMode('live')}
            >
              Live View (Portal)
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {activeSubnavView !== 'all' && (
              <span>Filter: <strong>{activeSubnavView}</strong></span>
            )}
          </div>
        </div>

        {/* Page Title */}
        <h1 className="drafts-title">
          Open Article Drafts (Including SLA Hold)
        </h1>

        {/* Bulk Action Bar (when items selected) */}
        {selectedIds.length > 0 && (
          <div className="bulk-actions-bar">
            <span>
              <strong>{selectedIds.length}</strong> article draft(s) selected
            </span>
            <div className="bulk-actions-buttons">
              <button
                type="button"
                className="btn-bulk"
                onClick={handleBulkSubmit}
              >
                Submit for Approval
              </button>
              <button
                type="button"
                className="btn-bulk"
                style={{ backgroundColor: '#dc2626' }}
                onClick={handleBulkDelete}
              >
                Delete Selected
              </button>
              <button
                type="button"
                className="btn-bulk"
                onClick={() => setSelectedIds([])}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{ backgroundColor: '#fee2e2', padding: '14px', borderRadius: '8px', color: '#dc2626', marginBottom: '16px' }}>
            <span>Error: {error}</span>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div style={{ padding: '30px 0' }}>
            <div className="approval-skeleton" style={{ width: '100%', height: '48px', marginBottom: '12px' }} />
            <div className="approval-skeleton" style={{ width: '100%', height: '240px' }} />
          </div>
        ) : paginatedDrafts.length === 0 ? (
          /* Empty state */
          <div className="approvals-empty">
            <div className="approvals-empty-icon" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <h3>No article drafts found</h3>
            <p>
              {searchQuery
                ? `No articles match the keyword "${searchQuery}".`
                : 'No article drafts in this view.'}
            </p>
            <button
              type="button"
              className="btn-reset-approvals"
              onClick={handleResetData}
            >
              Reset Sample Articles
            </button>
          </div>
        ) : viewMode === 'design' ? (
          /* Figma Design View */
          <ArticleDraftsDesignView
            drafts={paginatedDrafts}
            totalDrafts={totalDrafts}
            currentPage={currentPage}
            totalPages={totalPages}
            perPage={perPage}
            onPageChange={setCurrentPage}
            onPerPageChange={(n) => {
              setPerPage(n);
              setCurrentPage(1);
            }}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onOpenArticle={(item) => setSelectedArticle(item)}
            sortDirection={sortDirection}
            onToggleSort={handleToggleSort}
          />
        ) : (
          /* Live Knowledge Base View */
          <ArticleDraftsLiveView
            drafts={sortedDrafts}
            onOpenArticle={(item) => setSelectedArticle(item)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* Detail Modal */}
        {selectedArticle && (
          <ArticleDraftDetailModal
            article={selectedArticle}
            onClose={() => setSelectedArticle(null)}
            onUpdateStatus={handleUpdateStatus}
            onSaveContent={(id, updates) => {
              setDrafts((prev) =>
                prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
              );
              setSelectedArticle((prev) => (prev ? { ...prev, ...updates } : null));
            }}
          />
        )}
      </section>
    </div>
  );
}
