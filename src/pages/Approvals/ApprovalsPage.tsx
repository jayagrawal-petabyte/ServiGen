import React, { useState, useMemo, useEffect } from 'react';
import { approvalsApi } from './services/approvalsApi';
import ApprovalCard, { type Approval } from './ApprovalCard';
import ApprovalDetailsModal from './ApprovalDetailsModal';
import './approvals.css';

type ApprovalTab = 'pending' | 'approved' | 'rejected' | 'all';

interface ToastAction {
  id: string;
  prevStatus: Approval['status'];
}

interface Toast {
  message: string;
  lastAction: ToastAction | null;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [currentTab, setCurrentTab] = useState<ApprovalTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [modalRejectMode, setModalRejectMode] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  // Load approvals from API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await approvalsApi.getApprovals();
        if (isMounted) {
          setApprovals(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load approvals');
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

  const showToast = (message: string, lastAction: ToastAction | null = null) => {
    setToast({ message, lastAction });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleApprove = async (id: string) => {
    const item = approvals.find((a) => a.id === id);
    const prevStatus = item ? item.status : 'pending';

    setActionLoadingId(id);
    try {
      const updated = await approvalsApi.approveRequest(id);
      setApprovals((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`Request ${item?.ticketNumber || id} approved`, { id, prevStatus });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string, reason = 'Rejected by approver') => {
    const item = approvals.find((a) => a.id === id);
    const prevStatus = item ? item.status : 'pending';

    setActionLoadingId(id);
    try {
      const updated = await approvalsApi.rejectRequest(id, reason);
      setApprovals((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`Request ${item?.ticketNumber || id} rejected`, { id, prevStatus });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptAll = async () => {
    const pendingItems = approvals.filter((a) => a.status === 'pending');
    if (pendingItems.length === 0) {
      showToast('No pending approvals to accept');
      return;
    }

    setIsBatchLoading(true);
    try {
      const pendingIds = pendingItems.map((a) => a.id);
      await approvalsApi.batchApprove(pendingIds);
      setApprovals((prev) =>
        prev.map((app) => (app.status === 'pending' ? { ...app, status: 'approved' } : app))
      );
      showToast(`Approved all ${pendingItems.length} pending request(s)`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Batch approve failed');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleRejectAll = async () => {
    const pendingItems = approvals.filter((a) => a.status === 'pending');
    if (pendingItems.length === 0) {
      showToast('No pending approvals to reject');
      return;
    }

    setIsBatchLoading(true);
    try {
      const pendingIds = pendingItems.map((a) => a.id);
      await approvalsApi.batchReject(pendingIds, 'Bulk rejection by user');
      setApprovals((prev) =>
        prev.map((app) => (app.status === 'pending' ? { ...app, status: 'rejected' } : app))
      );
      showToast(`Rejected all ${pendingItems.length} pending request(s)`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Batch reject failed');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await approvalsApi.getApprovals();
      setApprovals(data);
      showToast('Approvals list refreshed');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to refresh approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = async () => {
    setIsLoading(true);
    try {
      const data = await approvalsApi.resetData();
      setApprovals(data);
      setCurrentTab('pending');
      setSearchQuery('');
      showToast('Reset to initial sample approvals');
    } catch {
      showToast('Failed to reset approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!toast?.lastAction) return;
    const { id, prevStatus } = toast.lastAction;
    try {
      const reverted = await approvalsApi.undoStatus(id, prevStatus);
      setApprovals((prev) => prev.map((app) => (app.id === id ? reverted : app)));
      setToast(null);
    } catch {
      showToast('Undo failed');
    }
  };

  const handleOpenDetails = (approval: Approval, defaultRejectMode = false) => {
    setSelectedApproval(approval);
    setModalRejectMode(defaultRejectMode);
  };

  return (
    <div className="approvals-page">
      <div className="approvals-header">
        <div className="approvals-title-group">
          <h1>My Approvals</h1>
          <p>Review and manage requests awaiting your approval</p>
        </div>

        <div className="approvals-actions">
          <button
            className="btn-approval-action accept-all"
            type="button"
            disabled={isBatchLoading || isLoading}
            onClick={handleAcceptAll}
            title="Accept all pending approval requests"
            style={{ opacity: isBatchLoading ? 0.6 : 1 }}
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
            disabled={isBatchLoading || isLoading}
            onClick={handleRejectAll}
            title="Reject all pending approval requests"
            style={{ opacity: isBatchLoading ? 0.6 : 1 }}
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
          }}
        >
          <div>
            <strong>Error:</strong> {error}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="approvals-list">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="approval-card"
              style={{ padding: '24px' }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <div
                  className="approval-skeleton"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                  }}
                />

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    className="approval-skeleton"
                    style={{
                      width: '220px',
                      height: '16px',
                    }}
                  />

                  <div
                    className="approval-skeleton"
                    style={{
                      width: '380px',
                      height: '14px',
                    }}
                  />
                </div>
              </div>

              <div
                className="approval-skeleton"
                style={{
                  width: '90%',
                  height: '40px',
                  marginLeft: '60px',
                  marginBottom: '16px',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                }}
              >
                <div
                  className="approval-skeleton"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                  }}
                />

                <div
                  className="approval-skeleton"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : filteredApprovals.length === 0 ? (
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

          <button
            className="btn-reset-approvals"
            type="button"
            onClick={handleResetData}
          >
            Reset Sample Data
          </button>
        </div>
      ) : (
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
        <div className="approvals-toast">
          <span>{toast.message}</span>

          {toast.lastAction && (
            <button
              type="button"
              onClick={handleUndo}
              style={{
                color: '#38bdf8',
                fontWeight: 700,
                textDecoration: 'underline',
                marginLeft: '8px',
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}