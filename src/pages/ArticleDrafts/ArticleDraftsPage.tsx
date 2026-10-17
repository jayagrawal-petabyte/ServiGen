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
import ArticleDraftDetailModal from './ArticleDraftDetailModal';
import CreateArticleDraftModal from './CreateArticleDraftModal';
import './articleDrafts.css';

export default function ArticleDraftsPage() {
  const [drafts, setDrafts] = useState<ArticleDraft[]>([]);
  const [activeSubnavView, setActiveSubnavView] = useState<ArticleDraftView>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [perPage, setPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDraft | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
          draft.author.toLowerCase().includes('inesh')
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

  // Create article draft
  const handleCreateDraft = async (draftData: Omit<ArticleDraft, 'id'>) => {
    setIsActionLoading(true);
    try {
      const created = await articleDraftsApi.createArticleDraft(draftData);
      setDrafts((prev) => [created, ...prev]);
      showToast(`Created draft #${created.id} successfully!`);
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create article draft');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Article status update
  const handleUpdateStatus = async (id: string, newStatus: ArticleDraftStatus) => {
    setIsActionLoading(true);
    try {
      const updated = await articleDraftsApi.updateDraftStatus(id, newStatus);
      setDrafts((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setSelectedArticle((prev) => (prev && prev.id === id ? updated : prev));
      if (newStatus === 'Awaiting Approval') {
        showToast(`Article #${id} submitted for approval. It is now queued in My Approvals!`);
      } else {
        showToast(`Article #${id} updated to ${newStatus}`);
      }
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
      if (updated.status === 'Awaiting Approval') {
        showToast(`Saved changes for article #${id}. The pending request in My Approvals has been updated.`);
      } else {
        showToast(`Saved draft changes for article #${id}. Click 'Submit for Approval' to queue for review.`);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Validation error saving draft');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete single article draft
  const handleDeleteDraft = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete article draft #${id}?`)) {
      setIsActionLoading(true);
      try {
        await articleDraftsApi.batchDelete([id]);
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        setSelectedArticle(null);
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        showToast(`Article draft #${id} was deleted successfully.`);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to delete article draft');
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  return (
    <div className="article-drafts-page-wrapper">
      {/* Top Application Navbar matching UI/UX design */}
      <header className="article-drafts-top-navbar">
        <div className="article-drafts-top-navbar-right">
          <button type="button" className="btn-top-coral" title="Get started guide">
            Get started
          </button>
          <button
            type="button"
            className="btn-top-coral"
            title="Create a new ticket or draft"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + New Ticket
          </button>

          <div className="top-navbar-bells">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <button
                key={i}
                type="button"
                className="top-navbar-bell-btn"
                title={`Notification alert ${i}`}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
            ))}
          </div>

          <div className="top-navbar-avatar" title="Logged in user profile" />
        </div>
      </header>

      {/* Main Page Layout Container */}
      <div className="article-drafts-main-layout">
        {/* Left Peach Sidebar */}
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

        {/* Right Content Area */}
        <main className="article-drafts-main">
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

          {/* Table View matching UI/UX design */}
          <ArticleDraftsDesignView
            drafts={paginatedDrafts}
            totalDrafts={filteredDrafts.length}
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            perPage={perPage}
            onPageChange={setCurrentPage}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setCurrentPage(1);
            }}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onOpenArticle={(draft) => setSelectedArticle(draft)}
            sortDirection={sortDirection}
            onToggleSort={() =>
              setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
          />
        </main>
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <ArticleDraftDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onSaveContent={handleSaveContent}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteDraft}
        />
      )}

      {/* Create Article Draft Modal */}
      {isCreateModalOpen && (
        <CreateArticleDraftModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateDraft={handleCreateDraft}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="approvals-toast info">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}