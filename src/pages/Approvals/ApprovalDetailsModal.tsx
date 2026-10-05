import React, { useState } from 'react';
import type { Approval } from './ApprovalCard';

interface ApprovalDetailsModalProps {
  approval: Approval | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  initialRejectMode?: boolean;
}

export default function ApprovalDetailsModal({
  approval,
  onClose,
  onApprove,
  onReject,
  initialRejectMode = false,
}: ApprovalDetailsModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(initialRejectMode);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!approval) return null;

  const handleConfirmReject = async () => {
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setValidationError('Please provide a reason for rejecting this request.');
      return;
    }
    if (trimmed.length < 5) {
      setValidationError('Rejection reason must be at least 5 characters long.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    try {
      await onReject(approval.id, trimmed);
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(approval.id);
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
              }}
            >
              Approval Request Details
            </span>

            <h2 style={{ marginTop: '2px' }}>
              {approval.ticketNumber} - {approval.title}
            </h2>
          </div>

          <button
            className="btn-close-modal"
            onClick={onClose}
            type="button"
            aria-label="Close details"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor:
                approval.status === 'pending'
                  ? '#fff7ed'
                  : approval.status === 'approved'
                  ? '#f0fdf4'
                  : '#fef2f2',
              border: `1px solid ${
                approval.status === 'pending'
                  ? '#fed7aa'
                  : approval.status === 'approved'
                  ? '#bbf7d0'
                  : '#fecaca'
              }`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                Current Status:
              </span>

              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color:
                    approval.status === 'pending'
                      ? '#ea580c'
                      : approval.status === 'approved'
                      ? '#16a34a'
                      : '#dc2626',
                }}
              >
                {approval.status}
              </span>
            </div>

            <span
              style={{
                fontSize: '12px',
                color: '#64748b',
              }}
            >
              Submitted {approval.timeAgo}
            </span>
          </div>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td
                  style={{
                    padding: '8px 0',
                    color: '#64748b',
                    width: '130px',
                    fontWeight: 500,
                  }}
                >
                  Requester
                </td>

                <td
                  style={{
                    padding: '8px 0',
                    fontWeight: 600,
                    color: '#1e293b',
                  }}
                >
                  {approval.authorName}
                </td>
              </tr>

              {approval.onBehalfOf && (
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td
                    style={{
                      padding: '8px 0',
                      color: '#64748b',
                      fontWeight: 500,
                    }}
                  >
                    On Behalf Of
                  </td>

                  <td
                    style={{
                      padding: '8px 0',
                      fontWeight: 600,
                      color: '#1d68c9',
                    }}
                  >
                    {approval.onBehalfOf}
                  </td>
                </tr>
              )}

              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td
                  style={{
                    padding: '8px 0',
                    color: '#64748b',
                    fontWeight: 500,
                  }}
                >
                  Category
                </td>

                <td
                  style={{
                    padding: '8px 0',
                    color: '#1e293b',
                  }}
                >
                  {approval.category || 'General'}
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td
                  style={{
                    padding: '8px 0',
                    color: '#64748b',
                    fontWeight: 500,
                  }}
                >
                  Priority
                </td>

                <td
                  style={{
                    padding: '8px 0',
                    color: '#1e293b',
                  }}
                >
                  {approval.priority || 'Normal'}
                </td>
              </tr>
            </tbody>
          </table>

          {approval.ticketDetails && (
            <div
              className="approval-ticket-details"
              style={{ margin: '0 0 20px 0' }}
            >
              <div className="approval-details-header">
                Associated Ticket Metadata
              </div>

              <div className="approval-details-grid">
                <div className="detail-row-key">Ticket ID</div>

                <div className="detail-row-val">
                  {approval.ticketDetails.ticketId}
                </div>

                <div className="detail-row-key">Ticket Type</div>

                <div className="detail-row-val">
                  <span className="ticket-type-badge">
                    {approval.ticketDetails.ticketType}
                  </span>
                </div>

                {approval.ticketDetails.department && (
                  <>
                    <div className="detail-row-key">Department</div>

                    <div className="detail-row-val">
                      {approval.ticketDetails.department}
                    </div>
                  </>
                )}

                {approval.ticketDetails.fullName && (
                  <>
                    <div className="detail-row-key">Target User</div>

                    <div className="detail-row-val">
                      {approval.ticketDetails.fullName}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '6px',
              }}
            >
              Request Justification / Summary
            </h4>

            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '13.5px',
                color: '#334155',
                lineHeight: 1.6,
                border: '1px solid #e2e8f0',
              }}
            >
              {approval.description}
            </div>
          </div>

          {showRejectInput && (
            <div
              style={{
                marginBottom: '16px',
                padding: '14px',
                background: '#fef2f2',
                borderRadius: '8px',
                border: `1px solid ${validationError ? '#ef4444' : '#fecaca'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  htmlFor="reject-reason-input"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#991b1b',
                  }}
                >
                  Reason for Rejection <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <span style={{ fontSize: '11px', color: rejectReason.trim().length >= 5 ? '#16a34a' : '#94a3b8' }}>
                  {rejectReason.trim().length} / 5 min chars
                </span>
              </div>

              <textarea
                id="reject-reason-input"
                rows={3}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (validationError && e.target.value.trim().length >= 5) {
                    setValidationError(null);
                  }
                }}
                placeholder="State the justification or compliance reason for rejecting this request..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: `1.5px solid ${validationError ? '#ef4444' : '#fca5a5'}`,
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {validationError && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ {validationError}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-approval-action"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          {approval.status === 'pending' && (
            <>
              {showRejectInput ? (
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    fontWeight: 600,
                    fontSize: '13px',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowRejectInput(true)}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  Reject Request
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '13px',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Approving...' : 'Approve Request'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}