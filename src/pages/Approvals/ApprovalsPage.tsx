import React, { useState, useEffect, useCallback } from 'react';
import { approvalsApi } from './services/approvalsApi';
import ApprovalCard, { type Approval } from './ApprovalCard';
import ApprovalDetailsModal from './ApprovalDetailsModal';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import './approvals.css';

interface Toast {
  message: string;
  type?: 'success' | 'error' | 'info';
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [modalRejectMode, setModalRejectMode] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 4000);
    },
    []
  );

  // Load pending approvals from API (GET /api/approvals/pending)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const pendingData = await approvalsApi.getPendingApprovals();
      setApprovals(pendingData);
    } catch {
      // Fallback handled in approvalsApi
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');

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
   */
  const handleReject = async (id: string, reason = 'Rejected by approver') => {
    if (actionLoadingId) return; // Prevent duplicate submission
    const item = approvals.find((a) => a.id === id);

    setActionLoadingId(id);
    try {
      const updated = await approvalsApi.rejectRequest(id, reason);
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

    setIsBatchLoading(true);
    try {
      const pendingIds = pendingItems.map((a) => a.id);
      await approvalsApi.batchReject(pendingIds, 'Bulk rejection by user');
      setApprovals((prev) =>
        prev.map((app) => (app.status === 'pending' ? { ...app, status: 'rejected' } : app))
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

  return (
    <div className="approvals-page-wrapper">
      {/* Top Application Navbar matching UI/UX design */}
      <header className="approvals-top-navbar">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
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
            <button
              className="btn-approval-action accept-all"
              type="button"
              disabled={isBatchLoading || isLoading || pendingApprovals.length === 0}
              onClick={handleAcceptAll}
              title="Accept all pending approval requests"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{isBatchLoading ? 'Processing...' : 'Accept All'}</span>
            </button>

            <button
              className="btn-approval-action reject-all"
              type="button"
              disabled={isBatchLoading || isLoading || pendingApprovals.length === 0}
              onClick={handleRejectAll}
              title="Reject all pending approval requests"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
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
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4b5563"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
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
        ) : pendingApprovals.length === 0 ? (
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

            <h3>You're all caught up!</h3>
            <p>There are no pending requests awaiting your review at the moment.</p>

            <button className="btn-reset-approvals" type="button" onClick={handleRefresh}>
              Refresh Approvals
            </button>
          </div>
        ) : (
          /* Approval Cards List */
          <div className="approvals-list">
            {pendingApprovals.map((approval) => (
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
          <div className={`approvals-toast ${toast.type || 'info'}`}>
            <span>{toast.message}</span>
          </div>
        )}
      </main>
    </div>
  );
}