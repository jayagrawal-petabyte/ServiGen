import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  type ArticleDraft,
  type ArticleDraftStatus,
} from './articleDrafts.types';
import { articleDraftsApi } from './services/articleDraftsApi';
import ArticleDraftSidebar, {
  type ArticleDraftView,
} from './ArticleDraftSidebar';
import ArticleDraftsDesignView from './ArticleDraftsDesignView';
import ArticleDraftsLiveView from './ArticleDraftsLiveView';
import ArticleDraftDetailModal from './ArticleDraftDetailModal';
import CreateArticleDraftModal from './CreateArticleDraftModal';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { Button, RefreshButton } from '../../components/shared';
import { Table, LayoutGrid, Plus } from 'lucide-react';
import './articleDrafts.css';

export default function ArticleDraftsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drafts, setDrafts] = useState<ArticleDraft[]>([]);
  const [activeSubnavView, setActiveSubnavView] = useState<ArticleDraftView>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [perPage, setPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDraft | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await articleDraftsApi.getDrafts();
      setDrafts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load article drafts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const viewParam = searchParams.get('view') as ArticleDraftView | null;
    if (viewParam && ['all', 'my-lists', 'by-agent', 'by-team', 'by-status'].includes(viewParam)) {
      setActiveSubnavView(viewParam);
    }
    const qParam = searchParams.get('search') || searchParams.get('q');
    if (qParam !== null && qParam !== undefined) {
      setSearchQuery(qParam);
    }
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const parsed = parseInt(pageParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setCurrentPage(parsed);
      }
    }
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const targetId = searchParams.get('id');
    if (!targetId || drafts.length === 0) return;

    if (selectedArticle && selectedArticle.id.toLowerCase() === targetId.toLowerCase()) {
      return;
    }

    const matched = drafts.find((d) => d.id.toLowerCase() === targetId.toLowerCase());
    if (matched) {
      setSelectedArticle(matched);
    }
  }, [searchParams, drafts, selectedArticle]);

  const filteredDrafts = useMemo(() => {
    let result = [...drafts];

    if (activeSubnavView === 'my-lists') {
      result = result.filter(
        (draft) =>
          draft.author.toLowerCase().includes('demo') ||
          draft.author.toLowerCase().includes('user') ||
          draft.author.toLowerCase().includes('admin')
      );
    } else if (activeSubnavView === 'by-agent') {
      result = result.filter((draft) => draft.agent.trim().length > 0);
    } else if (activeSubnavView === 'by-team') {
      result = result.filter((draft) => draft.team.trim().length > 0);
    } else if (activeSubnavView === 'by-status') {
      result = result.filter((draft) => draft.status === 'Draft' || draft.status === 'Awaiting Approval');
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

  const sortedDrafts = useMemo(() => {
    return [...filteredDrafts].sort((a, b) => {
      const first = a.id.localeCompare(b.id);
      return sortDirection === 'asc' ? first : -first;
    });
  }, [filteredDrafts, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedDrafts.length / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedDrafts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * perPage;
    return sortedDrafts.slice(startIndex, startIndex + perPage);
  }, [sortedDrafts, safeCurrentPage, perPage]);

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

  const handleOpenArticle = (draft: ArticleDraft) => {
    setSelectedArticle(draft);
    const next = new URLSearchParams(searchParams);
    next.set('id', draft.id);
    setSearchParams(next, { replace: false });
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
    const next = new URLSearchParams(searchParams);
    next.delete('id');
    setSearchParams(next, { replace: true });
  };

  const handleDeleteDraft = (id: string) => {
    setDraftToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!draftToDelete) return;
    const id = draftToDelete;
    setDraftToDelete(null);
    setIsActionLoading(true);
    try {
      await articleDraftsApi.batchDelete([id]);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      if (selectedArticle && selectedArticle.id === id) {
        handleCloseArticle();
      }
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      showToast(`Article draft #${id} was deleted successfully.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete article draft');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="article-drafts-page-wrapper">
      <header className="article-drafts-top-navbar">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">Article Drafts</span>
        </div>
        <GlobalNavbarActions onNewTicket={() => setIsCreateModalOpen(true)} />
      </header>

      <div className="article-drafts-main-layout">
        <ArticleDraftSidebar
          activeView={activeSubnavView}
          onSelectView={(v) => {
            setActiveSubnavView(v);
            setCurrentPage(1);
            setSelectedIds([]);
            const next = new URLSearchParams(searchParams);
            if (v === 'all') {
              next.delete('view');
            } else {
              next.set('view', v);
            }
            setSearchParams(next, { replace: true });
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setCurrentPage(1);
            const next = new URLSearchParams(searchParams);
            if (q.trim()) {
              next.set('search', q.trim());
            } else {
              next.delete('search');
              next.delete('q');
            }
            setSearchParams(next, { replace: true });
          }}
        />

        <main className="article-drafts-main flex-1 flex flex-col min-w-[340px] h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 shrink-0 bg-white gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold text-slate-800 tracking-tight" style={{ margin: 0 }}>
                Open Article Drafts
              </h1>
              <span className="text-xs text-slate-400 font-normal">
                (Including SLA Hold)
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'table' ? 'bg-white text-[#C96F55] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Table view"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'cards' ? 'bg-white text-[#C96F55] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Card view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>

              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                {filteredDrafts.length > 0
                  ? `${(safeCurrentPage - 1) * perPage + 1}–${Math.min(safeCurrentPage * perPage, filteredDrafts.length)} of ${filteredDrafts.length}`
                  : '0 of 0'}
              </span>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="text-[11px] font-medium text-slate-500">Rows:</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C96F55]"
                  title="Rows per page"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs"
                  title="Previous page"
                >
                  ‹
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs"
                  title="Next page"
                >
                  ›
                </button>
              </div>

              <RefreshButton
                size="sm"
                onClick={loadData}
                isLoading={isLoading}
                title="Refresh article drafts"
              />

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                icon={<Plus size={14} className="shrink-0" />}
              >
                New Draft
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
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

            {viewMode === 'table' ? (
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
                onOpenArticle={handleOpenArticle}
                sortDirection={sortDirection}
                onToggleSort={() =>
                  setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                }
                isLoading={isLoading}
              />
            ) : (
              <ArticleDraftsLiveView
                drafts={filteredDrafts}
                onOpenArticle={handleOpenArticle}
                onUpdateStatus={handleUpdateStatus}
              />
            )}
          </div>
        </main>
      </div>

      {selectedArticle && (
        <ArticleDraftDetailModal
          article={selectedArticle}
          onClose={handleCloseArticle}
          onSaveContent={handleSaveContent}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteDraft}
        />
      )}

      {draftToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 m-0">Confirm Draft Deletion</h3>
                <p className="text-sm text-slate-600 mt-1 m-0">
                  Are you sure you want to permanently delete article draft #{draftToDelete}? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDraftToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Delete Draft
              </Button>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateArticleDraftModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateDraft={handleCreateDraft}
        />
      )}

      {toastMessage && (
        <div className="approvals-toast info">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
