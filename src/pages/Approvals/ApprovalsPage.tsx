import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { approvalsApi } from './services/approvalsApi';
import ApprovalCard, { type Approval } from './ApprovalCard';
import ApprovalDetailsModal from './ApprovalDetailsModal';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { SegmentedTabs, SearchInput, RefreshButton, Button } from '../../components/shared';
import './approvals.css';

interface Toast {
  message: string;
  type?: 'success' | 'error' | 'info';
}

type TabType = 'pending' | 'approved' | 'rejected' | 'all';

export default function ApprovalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [modalRejectMode, setModalRejectMode] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 4000);
    },
    []
  );

  // Load pending approvals from API (GET /api/approvals/pending) and merge with history
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const allData = await approvalsApi.getAllApprovals();
      setApprovals(allData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load approvals from server.';
      setErrorMessage(msg);
      // Fallback to cached items
      const cached = approvalsApi.getCachedHistory();
      if (cached.length > 0) {
        setApprovals(cached);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const counts = useMemo(() => {
    return {
      pending: approvals.filter((a) => a.status === 'pending').length,
      approved: approvals.filter((a) => a.status === 'approved').length,
      rejected: approvals.filter((a) => a.status === 'rejected').length,
      all: approvals.length,
    };
  }, [approvals]);

  const filteredApprovals = useMemo(() => {
    let result = approvals;

    // Filter by tab
    if (currentTab !== 'all') {
      result = result.filter((a) => a.status === currentTab);
    }

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((a) => {
        return (
          a.ticketNumber.toLowerCase().includes(q) ||
          a.authorName.toLowerCase().includes(q) ||
          (a.onBehalfOf && a.onBehalfOf.toLowerCase().includes(q)) ||
          a.title.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q)) ||
          (a.rejectReason && a.rejectReason.toLowerCase().includes(q)) ||
          (a.ticketDetails?.username && a.ticketDetails.username.toLowerCase().includes(q)) ||
          (a.ticketDetails?.fullName && a.ticketDetails.fullName.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [approvals, currentTab, searchQuery]);

  const pendingApprovalsCount = counts.pending;

  /**
   * Approve a single approval request via PATCH /api/approvals/:approvalId/approve
   */
  const handleApprove = async (id: string) => {
    if (actionLoadingId) return; // Prevent duplicate submission
    const item = approvals.find((a) => a.id === id);

    setActionLoadingId(id);
    try {
      const updated = await approvalsApi.approveRequest(id);
      setApprovals((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`Request ${item?.ticketNumber || id} approved successfully.`, 'success');
      setTimeout(() => {
        loadData();
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve request.';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  /**
   * Reject a single approval request via PATCH /api/approvals/:approvalId/reject
   * Requires mandatory justification/reason of at least 5 non-whitespace characters.
   */
  const handleReject = async (id: string, reason?: string) => {
    if (actionLoadingId) return; // Prevent duplicate submission
    const trimmed = reason ? reason.trim() : '';
    if (!trimmed || trimmed.length < 5) {
      showToast('Validation Error: A mandatory rejection reason (min 5 characters) is required.', 'error');
      return;
    }
    const item = approvals.find((a) => a.id === id);

    setActionLoadingId(id);
    try {
      const updated = await approvalsApi.rejectRequest(id, trimmed);
      setApprovals((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`Request ${item?.ticketNumber || id} rejected.`, 'info');
      setTimeout(() => {
        loadData();
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject request.';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  /**
   * Batch approve pending requests
   */
  const handleAcceptAll = async () => {
    if (isBatchLoading) return;
    const pendingItems = approvals.filter((a) => a.status === 'pending');
    if (pendingItems.length === 0) {
      showToast('No pending approvals to accept.', 'info');
      return;
    }

    setIsBatchLoading(true);
    try {
      const pendingIds = pendingItems.map((a) => a.id);
      await approvalsApi.batchApprove(pendingIds);
      setApprovals((prev) =>
        prev.map((app) => (app.status === 'pending' ? { ...app, status: 'approved' } : app))
      );
      showToast(`Approved all ${pendingItems.length} pending request(s).`, 'success');
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Batch approve failed.', 'error');
    } finally {
      setIsBatchLoading(false);
    }
  };

  /**
   * Batch reject pending requests
   */
  const handleRejectAll = async () => {
    if (isBatchLoading) return;
    const pendingItems = approvals.filter((a) => a.status === 'pending');
    if (pendingItems.length === 0) {
      showToast('No pending approvals to reject.', 'info');
      return;
    }

    const reason = window.prompt('Please enter a mandatory rejection reason for all pending requests:');
    if (reason === null) return; // User cancelled
    const trimmedReason = reason.trim();
    if (!trimmedReason || trimmedReason.length < 5) {
      showToast('Validation Error: Rejection reason must be at least 5 characters long.', 'error');
      return;
    }

    setIsBatchLoading(true);
    try {
      const pendingIds = pendingItems.map((a) => a.id);
      await approvalsApi.batchReject(pendingIds, trimmedReason);
      setApprovals((prev) =>
        prev.map((app) => (app.status === 'pending' ? { ...app, status: 'rejected', rejectReason: trimmedReason } : app))
      );
      showToast(`Rejected all ${pendingItems.length} pending request(s).`, 'info');
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Batch reject failed.', 'error');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await loadData();
      showToast('Approvals list refreshed.', 'info');
    } catch {
      showToast('Failed to refresh approvals.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open Approval Details Modal
   * Loads specific approval details from GET /api/approvals/:approvalId
   */
  const handleOpenDetails = async (approval: Approval, defaultRejectMode = false) => {
    setSelectedApproval(approval);
    setModalRejectMode(defaultRejectMode);

    try {
      const fresh = await approvalsApi.getApprovalById(approval.id);
      setSelectedApproval(fresh);
    } catch {
      // Retain existing card details if individual fetch fails
    }
  };

  // Handle tab deep linking (e.g. /approvals?tab=pending)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['pending', 'approved', 'rejected', 'all'].includes(tabParam.toLowerCase())) {
      setCurrentTab(tabParam.toLowerCase() as TabType);
    }
  }, [searchParams]);

  // Handle direct approval deep linking (e.g. /approvals?id=APP-201 or /approvals?id=1)
  useEffect(() => {
    const targetId =
      searchParams.get('id') ||
      searchParams.get('approvalId') ||
      searchParams.get('requestId');
    if (!targetId) return;

    if (
      selectedApproval &&
      (selectedApproval.id.toLowerCase() === targetId.toLowerCase() ||
        selectedApproval.ticketNumber.toLowerCase() === targetId.toLowerCase())
    ) {
      return;
    }

    const clean = targetId.toLowerCase().replace(/^(#|req0*|app-?)/i, '').trim();

    const match = approvals.find(
      (a) =>
        a.id.toLowerCase() === targetId.toLowerCase() ||
        a.ticketNumber.toLowerCase() === targetId.toLowerCase() ||
        a.ticketNumber.toLowerCase().replace(/^(#|req0*|app-?)/i, '') === clean ||
        a.id.replace(/\D/g, '') === clean
    );

    if (match) {
      handleOpenDetails(match);
    } else if (!isLoading) {
      approvalsApi
        .getApprovalById(targetId)
        .then((fresh) => {
          if (fresh) setSelectedApproval(fresh);
        })
        .catch(() => {});
    }
  }, [searchParams, approvals, isLoading, selectedApproval]);

  return (
    <div className="approvals-page-wrapper">
      {/* Top Application Navbar matching UI/UX design */}
      <header className="approvals-top-navbar">
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">Approvals</span>
        </div>
        <GlobalNavbarActions />
      </header>

      {/* Main Page Content */}
      <main className="approvals-main-content">
        {/* Page Header */}
        <div className="approvals-header">
          <div className="approvals-title-group">
            <h1>My Approvals</h1>
            <p>Review and manage requests awaiting your approval</p>
          </div>

          <div className="approvals-actions">
            <Button
              variant="outline"
              size="sm"
              disabled={isBatchLoading || isLoading || pendingApprovalsCount === 0}
              onClick={handleAcceptAll}
              isLoading={isBatchLoading}
              icon={<Check className="w-3.5 h-3.5 text-emerald-600" />}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 font-semibold"
              title="Accept all pending approval requests"
            >
              <span>{isBatchLoading ? 'Processing...' : 'Accept All'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isBatchLoading || isLoading || pendingApprovalsCount === 0}
              onClick={handleRejectAll}
              icon={<X className="w-3.5 h-3.5 text-rose-600" />}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 font-semibold"
              title="Reject all pending approval requests"
            >
              <span>Reject All</span>
            </Button>

            <RefreshButton
              onClick={handleRefresh}
              isLoading={isLoading}
              title="Refresh requests list"
            />
          </div>
        </div>

        {/* Error Banner if any */}
        {errorMessage && (
          <div className="approvals-error-banner" role="alert">
            <div className="approvals-error-banner-content">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
            <button className="approvals-error-retry" type="button" onClick={handleRefresh}>
              Retry
            </button>
          </div>
        )}

        {/* Filter Subbar (Tabs & Search) */}
        <div className="approvals-subbar">
          <SegmentedTabs<TabType>
            variant="boxed"
            tabs={[
              { id: 'pending', label: 'Pending', count: counts.pending },
              { id: 'approved', label: 'Approved', count: counts.approved },
              { id: 'rejected', label: 'Rejected', count: counts.rejected },
              { id: 'all', label: 'All History', count: counts.all },
            ]}
            activeTab={currentTab}
            onChange={(tab) => setCurrentTab(tab)}
          />

          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by ticket #, requester, title..."
            className="w-full sm:w-72 md:w-80"
            onClear={() => setSearchQuery('')}
          />
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="approvals-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="approval-card" style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div
                    className="approval-skeleton"
                    style={{ width: '44px', height: '44px', borderRadius: '50%' }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="approval-skeleton" style={{ width: '240px', height: '16px' }} />
                    <div className="approval-skeleton" style={{ width: '420px', height: '14px' }} />
                  </div>
                </div>
                <div
                  className="approval-skeleton"
                  style={{ width: '85%', height: '36px', marginLeft: '60px', marginBottom: '16px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <div
                    className="approval-skeleton"
                    style={{ width: '44px', height: '44px', borderRadius: '50%' }}
                  />
                  <div
                    className="approval-skeleton"
                    style={{ width: '44px', height: '44px', borderRadius: '50%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : filteredApprovals.length === 0 ? (
          /* Empty State */
          <div className="approvals-empty">
            <div className="approvals-empty-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            {searchQuery ? (
              <>
                <h3>No matching approvals found</h3>
                <p>No requests match "{searchQuery}". Try a different search term or clear the filter.</p>
                <button className="btn-reset-approvals" type="button" onClick={() => setSearchQuery('')}>
                  Clear Search
                </button>
              </>
            ) : currentTab === 'pending' ? (
              <>
                <h3>You're all caught up!</h3>
                <p>There are no pending requests awaiting your review at the moment.</p>
                <button className="btn-reset-approvals" type="button" onClick={handleRefresh}>
                  Refresh Approvals
                </button>
              </>
            ) : (
              <>
                <h3>No requests in this tab</h3>
                <p>There are currently no {currentTab} approval requests.</p>
                <button className="btn-reset-approvals" type="button" onClick={() => setCurrentTab('pending')}>
                  View Pending Approvals
                </button>
              </>
            )}
          </div>
        ) : (
          /* Approval Cards List */
          <div className="approvals-list">
            {filteredApprovals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onApprove={handleApprove}
                onReject={handleReject}
                onOpenDetails={handleOpenDetails}
                isActionLoading={actionLoadingId === approval.id}
              />
            ))}
          </div>
        )}

        {selectedApproval && (
          <ApprovalDetailsModal
            approval={selectedApproval}
            initialRejectMode={modalRejectMode}
            onClose={() => {
              setSelectedApproval(null);
              setModalRejectMode(false);
              if (
                searchParams.get('id') ||
                searchParams.get('approvalId') ||
                searchParams.get('requestId')
              ) {
                const next = new URLSearchParams(searchParams);
                next.delete('id');
                next.delete('approvalId');
                next.delete('requestId');
                setSearchParams(next, { replace: true });
              }
            }}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}

        {toast && (
          <div className={`approvals-toast ${toast.type || 'info'}`}>
            <span>{toast.message}</span>
          </div>
        )}
      </main>
    </div>
  );
}
