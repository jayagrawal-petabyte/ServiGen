import React, { useMemo, useState } from 'react';

import {
  INITIAL_ARTICLE_DRAFTS,
  type ArticleDraft,
  type ArticleDraftStatus,
} from './mockArticleDraftsData';

import ArticleDraftSidebar, {
  type ArticleDraftView,
} from './ArticleDraftSidebar';

import ArticleDraftsDesignView from './ArticleDraftsDesignView';
import ArticleDraftsLiveView from './ArticleDraftsLiveView';
import ArticleDraftDetailModal from './ArticleDraftDetailModal';

import './articleDrafts.css';

type ViewMode = 'design' | 'live';

export default function ArticleDraftsPage() {
  // -----------------------------
  // State
  // -----------------------------

  const [drafts, setDrafts] =
    useState<ArticleDraft[]>(INITIAL_ARTICLE_DRAFTS);

  const [viewMode, setViewMode] =
    useState<ViewMode>('design');

  const [activeSubnavView, setActiveSubnavView] =
    useState<ArticleDraftView>('all');

  const [searchQuery, setSearchQuery] =
    useState<string>('');

  const [perPage, setPerPage] =
    useState<number>(20);

  const [currentPage, setCurrentPage] =
    useState<number>(1);

  const [sortDirection, setSortDirection] =
    useState<'asc' | 'desc'>('desc');

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  const [selectedArticle, setSelectedArticle] =
    useState<ArticleDraft | null>(null);

  const [isLoading, setIsLoading] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string | null>(null);

  // -----------------------------
  // Filter drafts
  // -----------------------------

  const filteredDrafts = useMemo(() => {
    let result = [...drafts];

    // Filter based on the selected sidebar view.
    if (activeSubnavView === 'my-lists') {
      result = result.filter(
        (draft) =>
          draft.author.toLowerCase().includes('demo') ||
          draft.author.toLowerCase().includes('user')
      );
    }

    if (activeSubnavView === 'by-agent') {
      result = result.filter(
        (draft) => draft.agent.trim().length > 0
      );
    }

    if (activeSubnavView === 'by-team') {
      result = result.filter(
        (draft) => draft.team.trim().length > 0
      );
    }

    if (activeSubnavView === 'by-status') {
      result = result.filter(
        (draft) => draft.status.trim().length > 0
      );
    }

    // Search by ID, title, category, author, team, or agent.
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
  }, [
    drafts,
    activeSubnavView,
    searchQuery,
  ]);

  // -----------------------------
  // Sort drafts
  // -----------------------------

  const sortedDrafts = useMemo(() => {
    return [...filteredDrafts].sort((a, b) => {
      const first = a.id.localeCompare(b.id);
      return sortDirection === 'asc'
        ? first
        : -first;
    });
  }, [filteredDrafts, sortDirection]);

  // -----------------------------
  // Pagination
  // -----------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(sortedDrafts.length / perPage)
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedDrafts = useMemo(() => {
    const startIndex =
      (safeCurrentPage - 1) * perPage;

    return sortedDrafts.slice(
      startIndex,
      startIndex + perPage
    );
  }, [
    sortedDrafts,
    safeCurrentPage,
    perPage,
  ]);

  // -----------------------------
  // Selection
  // -----------------------------

  const allVisibleSelected =
    paginatedDrafts.length > 0 &&
    paginatedDrafts.every((draft) =>
      selectedIds.includes(draft.id)
    );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((previousIds) =>
      previousIds.includes(id)
        ? previousIds.filter(
            (selectedId) => selectedId !== id
          )
        : [...previousIds, id]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = paginatedDrafts.map(
      (draft) => draft.id
    );

    if (allVisibleSelected) {
      setSelectedIds((previousIds) =>
        previousIds.filter(
          (id) => !visibleIds.includes(id)
        )
      );
    } else {
      setSelectedIds((previousIds) => [
        ...new Set([
          ...previousIds,
          ...visibleIds,
        ]),
      ]);
    }
  };

  // -----------------------------
  // Article status
  // -----------------------------

  const handleUpdateStatus = (
    id: string,
    newStatus: ArticleDraftStatus
  ) => {
    setDrafts((previousDrafts) =>
      previousDrafts.map((draft) =>
        draft.id === id
          ? {
              ...draft,
              status: newStatus,
            }
          : draft
      )
    );

    setSelectedArticle((previousArticle) =>
      previousArticle &&
      previousArticle.id === id
        ? {
            ...previousArticle,
            status: newStatus,
          }
        : previousArticle
    );
  };

  // -----------------------------
  // Bulk actions
  // -----------------------------

  const handleBulkSubmit = () => {
    if (selectedIds.length === 0) {
      return;
    }

    setDrafts((previousDrafts) =>
      previousDrafts.map((draft) =>
        selectedIds.includes(draft.id)
          ? {
              ...draft,
              status: 'Awaiting Approval',
            }
          : draft
      )
    );

    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      return;
    }

    setDrafts((previousDrafts) =>
      previousDrafts.filter(
        (draft) => !selectedIds.includes(draft.id)
      )
    );

    setSelectedIds([]);
  };

  // -----------------------------
  // Reset mock data
  // -----------------------------

  const handleResetData = () => {
    setIsLoading(true);
    setError(null);

    try {
      setDrafts(INITIAL_ARTICLE_DRAFTS);
      setSelectedIds([]);
      setSelectedArticle(null);
      setCurrentPage(1);
    } catch {
      setError(
        'Unable to reset article draft data.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // Search
  // -----------------------------

  const handleSearchChange = (
    value: string
  ) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // -----------------------------
  // Sidebar navigation
  // -----------------------------

  const handleSelectView = (
    view: ArticleDraftView
  ) => {
    setActiveSubnavView(view);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  // -----------------------------
  // Page size
  // -----------------------------

  const handlePerPageChange = (
    value: number
  ) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  // -----------------------------
  // Page change
  // -----------------------------

  const handlePageChange = (
    page: number
  ) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };

  // -----------------------------
  // Sorting
  // -----------------------------

  const handleToggleSort = () => {
    setSortDirection((previousDirection) =>
      previousDirection === 'asc'
        ? 'desc'
        : 'asc'
    );
  };

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <div className="article-drafts-page">
      <ArticleDraftSidebar
        activeView={activeSubnavView}
        onSelectView={handleSelectView}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <main className="article-drafts-main">
        {/* Page header */}
        <div className="article-drafts-header">
          <div>
            <h1>Article Drafts</h1>

            <p>
              Manage and review article drafts
            </p>
          </div>

          <div className="article-drafts-header-actions">
            <button
              type="button"
              onClick={() =>
                setViewMode('design')
              }
              className={
                viewMode === 'design'
                  ? 'active'
                  : ''
              }
            >
              Design View
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode('live')
              }
              className={
                viewMode === 'live'
                  ? 'active'
                  : ''
              }
            >
              Live View
            </button>

            <button
              type="button"
              onClick={handleResetData}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="article-drafts-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div className="article-drafts-bulk-actions">
            <span>
              {selectedIds.length} selected
            </span>

            <button
              type="button"
              onClick={handleBulkSubmit}
            >
              Submit for Approval
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
            >
              Delete
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedIds([])
              }
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="article-drafts-loading">
            Loading article drafts...
          </div>
        ) : viewMode === 'design' ? (
          <ArticleDraftsDesignView
            drafts={paginatedDrafts}
            totalDrafts={sortedDrafts.length}
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            perPage={perPage}
            onPageChange={handlePageChange}
            onPerPageChange={
              handlePerPageChange
            }
            selectedIds={selectedIds}
            onToggleSelect={
              handleToggleSelect
            }
            onToggleSelectAll={
              handleToggleSelectAll
            }
            onOpenArticle={
              setSelectedArticle
            }
            sortDirection={sortDirection}
            onToggleSort={
              handleToggleSort
            }
          />
        ) : (
          <ArticleDraftsLiveView
            drafts={sortedDrafts}
            onOpenArticle={(article) =>
              setSelectedArticle(article)
            }
          />
        )}

        {/* Empty state */}
        {!isLoading &&
          sortedDrafts.length === 0 && (
            <div className="article-drafts-empty">
              <h3>
                No article drafts found
              </h3>

              <p>
                Try changing your search or
                filter.
              </p>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() =>
                    handleSearchChange('')
                  }
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
      </main>

{/* Article detail modal */}
{selectedArticle !== null && (
  <ArticleDraftDetailModal
    article={selectedArticle}
    onClose={() => setSelectedArticle(null)}
    onUpdateStatus={handleUpdateStatus}
    onSaveContent={(id, updates) => {
      setDrafts((previousDrafts) =>
        previousDrafts.map((draft) =>
          draft.id === id
            ? { ...draft, ...updates }
            : draft
        )
      );

      setSelectedArticle((previousArticle) =>
        previousArticle
          ? { ...previousArticle, ...updates }
          : null
      );
    }}
  />
)}
    </div>
  );
}