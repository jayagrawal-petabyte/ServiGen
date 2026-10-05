import React, { useMemo, useState, useEffect } from 'react';
import {
  type ArticleDraft,
  type ArticleDraftStatus,
} from './mockArticleDraftsData';
import { articleDraftsApi } from './services/articleDraftsApi';
import ArticleDraftSidebar, {
  type ArticleDraftView,
} from './ArticleDraftSidebar';
import ArticleDraftsDesignView from './ArticleDraftsDesignView';
import ArticleDraftsLiveView from './ArticleDraftsLiveView';
import ArticleDraftDetailModal from './ArticleDraftDetailModal';
import './articleDrafts.css';

type ViewMode = 'design' | 'live';

export default function ArticleDraftsPage() {
  const [drafts, setDrafts] = useState<ArticleDraft[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('design');
  const [activeSubnavView, setActiveSubnavView] = useState<ArticleDraftView>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [perPage, setPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDraft | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load drafts on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await articleDraftsApi.getDrafts();
        if (isMounted) {
          setDrafts(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load article drafts');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter drafts based on the selected sidebar view and search
  const filteredDrafts = useMemo(() => {
    let result = [...drafts];

    if (activeSubnavView === 'my-lists') {
      result = result.filter(
        (draft) =>
          draft.author.toLowerCase().includes('demo') ||
          draft.author.toLowerCase().includes('user') ||
          draft.author.toLowerCase().includes('aditya')
      );
    } else if (activeSubnavView === 'by-agent') {
      result = result.filter((draft) => draft.agent.trim().length > 0);
    } else if (activeSubnavView === 'by-team') {
      result = result.filter((draft) => draft.team.trim().length > 0);
    } else if (activeSubnavView === 'by-status') {
      result = result.filter((draft) => draft.status.trim().length > 0);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((draft) =>
        [
          draft.id,
          draft.summaryTitle,
          draft.summarySubtitle,
          draft.category,
          draft.priority,
          draft.status,
          draft.author,
          draft.team,
          draft.agent,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    return result;
  }, [drafts, activeSubnavView, searchQuery]);

  // Sort drafts
  const sortedDrafts = useMemo(() => {
    return [...filteredDrafts].sort((a, b) => {
      const first = a.id.localeCompare(b.id);
      return sortDirection === 'asc' ? first : -first;
    });
  }, [filteredDrafts, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedDrafts.length / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedDrafts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * perPage;
    return sortedDrafts.slice(startIndex, startIndex + perPage);
  }, [sortedDrafts, safeCurrentPage, perPage]);

  // Selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((previousIds) =>
      previousIds.includes(id)
        ? previousIds.filter((selectedId) => selectedId !== id)
        : [...previousIds, id]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = paginatedDrafts.map((draft) => draft.id);
    const allVisibleSelected =
      paginatedDrafts.length > 0 &&
      paginatedDrafts.every((draft) => selectedIds.includes(draft.id));

    if (allVisibleSelected) {
      setSelectedIds((previousIds) =>
        previousIds.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedIds((previousIds) => [
        ...new Set([...previousIds, ...visibleIds]),
      ]);
    }
  };

  // Article status update
  const handleUpdateStatus = async (id: string, newStatus: ArticleDraftStatus) => {
    setIsActionLoading(true);
    try {
      const updated = await articleDraftsApi.updateDraftStatus(id, newStatus);
      setDrafts((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setSelectedArticle((prev) => (prev && prev.id === id ? updated : prev));
      showToast(`Article #${id} updated to ${newStatus}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update article status');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Save content
  const handleSaveContent = async (id: string, updates: Partial<ArticleDraft>) => {
    setIsActionLoading(true);
    try {
      const updated = await articleDraftsApi.updateDraftContent(id, updates);
      setDrafts((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setSelectedArticle((prev) => (prev && prev.id === id ? updated : prev));
      showToast(`Saved changes for article #${id}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Validation error saving draft');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Bulk actions
  const handleBulkSubmit = async () => {
    if (selectedIds.length === 0) return;

    setIsActionLoading(true);
    try {
      await articleDraftsApi.batchUpdateStatus(selectedIds, 'Awaiting Approval');
      setDrafts((prev) =>
        prev.map((d) =>
          selectedIds.includes(d.id) ? { ...d, status: 'Awaiting Approval' } : d
        )
      );
      showToast(`Submitted ${selectedIds.length} article draft(s) for approval`);
      setSelectedIds([]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Batch submit failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected article draft(s)?`)) {
      setIsActionLoading(true);
      try {
        await articleDraftsApi.batchDelete(selectedIds);
        setDrafts((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
        showToast(`Deleted ${selectedIds.length} article draft(s)`);
        setSelectedIds([]);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Batch delete failed');
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleResetData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await articleDraftsApi.resetData();
      setDrafts(data);
      setSelectedIds([]);
      setSelectedArticle(null);
      setCurrentPage(1);
      showToast('Reset to default article drafts');
    } catch {
      setError('Unable to reset article draft data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="article-drafts-container">
      <ArticleDraftSidebar
        activeView={activeSubnavView}
        onSelectView={(v) => {
          setActiveSubnavView(v);
          setCurrentPage(1);
          setSelectedIds([]);
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
      />

      <main className="article-drafts-main">
        {/* Top View Mode Bar */}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeSubnavView !== 'all' && (
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Filter: <strong>{activeSubnavView}</strong>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetData}
              className="btn-approval-action refresh"
              title="Reset Sample Articles"
              style={{ fontSize: '12px', padding: '4px 12px' }}
            >
              Reset Data
            </button>
          </div>
        </div>

        <h1 className="drafts-title">
          Open Article Drafts (Including SLA Hold)
        </h1>

        {/* Error alert */}
        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: 500,
            }}
            role="alert"
          >
            ⚠️ {error}
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="bulk-actions-bar">
            <span>
              <strong>{selectedIds.length}</strong> article draft(s) selected
            </span>
            <div className="bulk-actions-buttons">
              <button
                type="button"
                className="btn-bulk"
                disabled={isActionLoading}
                onClick={handleBulkSubmit}
              >
                {isActionLoading ? 'Processing...' : 'Submit for Approval'}
              </button>
              <button
                type="button"
                className="btn-bulk"
                disabled={isActionLoading}
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

        {/* Loading Skeleton */}
        {isLoading ? (
          <div style={{ padding: '20px 0' }}>
            <div
              className="approval-skeleton"
              style={{ width: '100%', height: '44px', marginBottom: '12px', borderRadius: '8px' }}
            />
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="approval-skeleton"
                style={{
                  width: '100%',
                  height: '56px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                }}
              />
            ))}
          </div>
        ) : viewMode === 'design' ? (
          <ArticleDraftsDesignView
            drafts={paginatedDrafts}
            totalDrafts={sortedDrafts.length}
            currentPage={safeCurrentPage}
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
            onOpenArticle={setSelectedArticle}
            sortDirection={sortDirection}
            onToggleSort={() =>
              setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
          />
        ) : (
          <ArticleDraftsLiveView
            drafts={sortedDrafts}
            onOpenArticle={setSelectedArticle}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* Empty State */}
        {!isLoading && sortedDrafts.length === 0 && (
          <div className="approvals-empty" style={{ marginTop: '20px' }}>
            <div className="approvals-empty-icon" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <h3>No article drafts found</h3>
            <p>
              {searchQuery
                ? `No article drafts match your search for "${searchQuery}".`
                : 'There are no article drafts in this view.'}
            </p>
            <button
              type="button"
              className="btn-reset-approvals"
              onClick={handleResetData}
            >
              Reset Sample Articles
            </button>
          </div>
        )}
      </main>

      {/* Article Detail Modal */}
      {selectedArticle !== null && (
        <ArticleDraftDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onUpdateStatus={handleUpdateStatus}
          onSaveContent={handleSaveContent}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="approvals-toast">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}