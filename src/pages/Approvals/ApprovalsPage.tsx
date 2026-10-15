import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { approvalsApi } from './services/approvalsApi';
import ApprovalCard, { type Approval } from './ApprovalCard';
import ApprovalDetailsModal from './ApprovalDetailsModal';
import { ApiError } from '../../services/apiClient';
import './approvals.css';

type ApprovalTab = 'pending' | 'approved' | 'rejected' | 'all';

interface ToastAction {
  id: string;
  prevStatus: Approval['status'];
}

interface Toast {
  message: string;
  type?: 'success' | 'error' | 'info';
  lastAction?: ToastAction | null;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [currentTab, setCurrentTab] = useState<ApprovalTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatusCode, setErrorStatusCode] = useState<number | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [modalRejectMode, setModalRejectMode] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info', lastAction: ToastAction | null = null) => {
      setToast({ message, type, lastAction });
      setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 5000);
    },
    []
  );

  // Load approvals from API (GET /api/approvals/pending)
  const loadData = useCallback(async (demoModeOverride?: boolean) => {
    const demo = demoModeOverride !== undefined ? demoModeOverride : isDemoMode;
    setIsLoading(true);
    setError(null);
    setErrorStatusCode(null);
    try {
      const data = await approvalsApi.getPendingApprovals(demo);
      setApprovals(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorStatusCode(err.statusCode);
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while communicating with the backend API.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter approvals based on tab and search query
  const filteredApprovals = useMemo(() => {
    return approvals.filter((item) => {
      if (currentTab !== 'all' && item.status !== currentTab) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTicket = item.ticketNumber.toLowerCase().includes(query);
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesAuthor = item.authorName.toLowerCase().includes(query);
        const matchesBehalf = item.onBehalfOf?.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);

        return matchesTicket || matchesTitle || matchesAuthor || matchesBehalf || matchesDesc;
      }

      return true;
    });
  }, [approvals, currentTab, searchQuery]);

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;
  const approvedCount = approvals.filter((a) => a.status === 'approved').length;
  const rejectedCount = approvals.filter((a) => a.status === 'rejected').length;

  /**
   * Approve a single approval request via PATCH /api/approvals/:approvalId/approve
   */
  const handleApprove = async (id: string) => {
    if (actionLoadingId) return; // Prevent duplicate submission
    const item = approvals.find((a) => a.id === id);
    const prevStatus = item ? item.status : 'pending';

    setActionLoadingId(id);
    try {
      const updated = await approvalsApi.approveRequest(id, isDemoMode);
      setApprovals((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`Request ${item?.ticketNumber || id} approved successfully.`, 'success', {
        id,
        prevStatus,
      });
      // Refresh pending list after approval
      if (!isDemoMode) {
        loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve request.';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  /**
   * Reject a single approval request via PATCH /api/approvals/:approvalId/reject
   */
  const handleReject = async (id: string, reason = 'Rejected by approver') => {
    if (actionLoadingId) return; // Prevent duplicate submission
    const item = approvals.find((a) => a.id === id);
    const prevStatus = item ? item.status : 'pending';

    setActionLoadingId(id);
    try {
      const updated = await approvalsApi.rejectRequest(id, reason, isDemoMode);
      setApprovals((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`Request ${item?.ticketNumber || id} rejected.`, 'info', {
        id,
        prevStatus,
      });
      // Refresh pending list after rejection
      if (!isDemoMode) {
        loadData();
      }
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
      await approvalsApi.batchApprove(pendingIds, isDemoMode);
      setApprovals((prev) =>
        prev.map((app) => (app.status === 'pending' ? { ...app, status: 'approved' } : app))
      );
      showToast(`Approved all ${pendingItems.length} pending request(s).`, 'success');
      if (!isDemoMode) {
        loadData();
      }
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

    setIsBatchLoading(true);
    try {
      const pendingIds = pendingItems.map((a) => a.id);
      await approvalsApi.batchReject(pendingIds, 'Bulk rejection by user', isDemoMode);
      setApprovals((prev) =>
        prev.map((app) => (app.status === 'pending' ? { ...app, status: 'rejected' } : app))
      );
      showToast(`Rejected all ${pendingItems.length} pending request(s).`, 'info');
      if (!isDemoMode) {
        loadData();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Batch reject failed.', 'error');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadData();
    showToast('Approvals list refreshed.', 'info');
  };

  const handleResetData = async () => {
    setIsLoading(true);
    try {
      const data = await approvalsApi.resetMockData();
      setApprovals(data);
      setCurrentTab('pending');
      setSearchQuery('');
      showToast('Reset sample data in local demo store.', 'info');
    } catch {
      showToast('Failed to reset sample data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDemoMode = () => {
    const nextMode = !isDemoMode;
    setIsDemoMode(nextMode);
    loadData(nextMode);
    showToast(
      nextMode
        ? 'Switched to Demo Mode (Local Mock Data)'
        : 'Switched to Live API Mode (/api/approvals)',
      'info'
    );
  };

  /**
   * Open Approval Details Modal
   * Loads specific approval details from GET /api/approvals/:approvalId
   */
  const handleOpenDetails = async (approval: Approval, defaultRejectMode = false) => {
    setSelectedApproval(approval);
    setModalRejectMode(defaultRejectMode);

    // Call GET /api/approvals/:approvalId to fetch fresh backend details
    try {
      const fresh = await approvalsApi.getApprovalById(approval.id, isDemoMode);
      setSelectedApproval(fresh);
    } catch {
      // Retain existing card details if individual fetch fails
    }
  };

  return (
    <div className="approvals-page">
      <div className="approvals-header">
        <div className="approvals-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>My Approvals</h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: isDemoMode ? '#fef3c7' : '#dcfce7',
                color: isDemoMode ? '#b45309' : '#15803d',
                border: `1px solid ${isDemoMode ? '#fde68a' : '#bbf7d0'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title={
                isDemoMode
                  ? 'Currently rendering isolated mock data for demonstration'
                  : 'Currently connected to documented backend endpoints (/api/approvals/*)'
              }
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isDemoMode ? '#d97706' : '#16a34a',
                }}
              />
              {isDemoMode ? 'Demo Mode' : 'Live API (Backend)'}
            </span>
          </div>
          <p>Review and manage requests awaiting your approval per ServiGen API V1.0</p>
        </div>

        <div className="approvals-actions">
          <button
            className="btn-approval-action accept-all"
            type="button"
            disabled={isBatchLoading || isLoading || pendingCount === 0}
            onClick={handleAcceptAll}
            title="Accept all pending approval requests"
            style={{ opacity: isBatchLoading || pendingCount === 0 ? 0.6 : 1 }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{isBatchLoading ? 'Processing...' : 'Accept All'}</span>
          </button>

          <button
            className="btn-approval-action reject-all"
            type="button"
            disabled={isBatchLoading || isLoading || pendingCount === 0}
            onClick={handleRejectAll}
            title="Reject all pending approval requests"
            style={{ opacity: isBatchLoading || pendingCount === 0 ? 0.6 : 1 }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>Reject All</span>
          </button>

          <button
            className="btn-approval-action refresh"
            type="button"
            disabled={isLoading}
            onClick={handleRefresh}
            title="Refresh requests list"
          >
            <svg
              className={isLoading ? 'spinning' : ''}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-approval-action"
            onClick={handleToggleDemoMode}
            title={isDemoMode ? 'Switch to Live API Mode' : 'Switch to Demo Mock Mode'}
            style={{
              fontSize: '12px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
            }}
          >
            {isDemoMode ? 'Use Live API' : 'Use Demo Mode'}
          </button>
        </div>
      </div>

      <div className="approvals-subbar">
        <div className="approval-tabs">
          <button
            type="button"
            className={`approval-tab ${currentTab === 'pending' ? 'active' : ''}`}
            onClick={() => setCurrentTab('pending')}
          >
            Pending ({pendingCount})
          </button>

          <button
            type="button"
            className={`approval-tab ${currentTab === 'approved' ? 'active' : ''}`}
            onClick={() => setCurrentTab('approved')}
          >
            Approved ({approvedCount})
          </button>

          <button
            type="button"
            className={`approval-tab ${currentTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setCurrentTab('rejected')}
          >
            Rejected ({rejectedCount})
          </button>

          <button
            type="button"
            className={`approval-tab ${currentTab === 'all' ? 'active' : ''}`}
            onClick={() => setCurrentTab('all')}
          >
            All ({approvals.length})
          </button>
        </div>

        <div className="approvals-search-box">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="text"
            placeholder="Search approvals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                color: '#94a3b8',
                fontSize: '12px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Useful Error State Display */}
      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '16px 20px',
            color: '#991b1b',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.08)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <strong>
                {errorStatusCode ? `API Error (HTTP ${errorStatusCode}):` : 'API Error:'}
              </strong>
              <span>{error}</span>
            </div>
            {!isDemoMode && (
              <p style={{ margin: '4px 0 0 24px', fontSize: '12px', color: '#b91c1c' }}>
                Tip: If the backend server is not running on localhost, click "Switch to Demo Mode"
                to test with local sample data.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => loadData()}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>

            {!isDemoMode && (
              <button
                type="button"
                onClick={handleToggleDemoMode}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#dc2626',
                  border: '1px solid #dc2626',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Switch to Demo Mode
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="approvals-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="approval-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div
                  className="approval-skeleton"
                  style={{ width: '44px', height: '44px', borderRadius: '50%' }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="approval-skeleton" style={{ width: '220px', height: '16px' }} />
                  <div className="approval-skeleton" style={{ width: '380px', height: '14px' }} />
                </div>
              </div>
              <div
                className="approval-skeleton"
                style={{ width: '90%', height: '40px', marginLeft: '60px', marginBottom: '16px' }}
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

          <h3>
            {searchQuery
              ? 'No matching approval requests found'
              : currentTab === 'pending'
              ? "You're all caught up!"
              : `No ${currentTab} approvals`}
          </h3>

          <p>
            {searchQuery
              ? `No requests matching "${searchQuery}". Try a different search keyword.`
              : currentTab === 'pending'
              ? 'There are no pending requests awaiting your review at the moment.'
              : `There are currently no items in the ${currentTab} list.`}
          </p>

          <button className="btn-reset-approvals" type="button" onClick={handleResetData}>
            Load Sample Data
          </button>
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
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {toast && (
        <div
          className={`approvals-toast ${toast.type || 'info'}`}
          style={{
            borderColor:
              toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#22c55e' : undefined,
          }}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}