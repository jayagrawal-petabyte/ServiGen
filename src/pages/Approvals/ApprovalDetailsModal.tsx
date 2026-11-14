import React, { useState, useEffect } from 'react';
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
  const [touched, setTouched] = useState(initialRejectMode);

  // Prevent background page scrolling while modal is open (Bug 3 Requirement 9)
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!approval) return null;

  const trimmedReason = rejectReason.trim();
  const isReasonValid = trimmedReason.length >= 5;

  const handleConfirmReject = async () => {
    setTouched(true);
    if (!trimmedReason) {
      setValidationError('Rejection reason cannot be empty or whitespace only.');
      return;
    }
    if (trimmedReason.length < 5) {
      setValidationError('Rejection reason must be at least 5 characters long.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    try {
      await onReject(approval.id, trimmedReason);
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
        style={{
          width: '92%',
          maxWidth: '680px',
          maxHeight: 'calc(100vh - 40px)',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 15px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f0ede8',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Header (Bug 3 Requirement 6) */}
        <div
          className="modal-header"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            flexShrink: 0,
            padding: '20px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Approval Request Details
            </span>

            <h2 style={{ marginTop: '2px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
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

        {/* Vertically Scrollable Modal Body (Bug 3 Requirements 4 & 5) */}
        <div
          className="modal-body"
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            padding: '24px 28px',
          }}
        >
          {/* Status Badge Row */}
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

          {/* Saved Rejection Reason Banner (Bug 1 Requirement 9) */}
          {(approval.rejectReason || approval.status === 'rejected') && (
            <div
              className="approval-saved-rejection-banner"
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#991b1b',
                  fontWeight: 700,
                  fontSize: '13px',
                  marginBottom: '4px',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Recorded Rejection Feedback</span>
              </div>
              <div style={{ fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5 }}>
                <strong>Reason:</strong> "{approval.rejectReason || 'Request was rejected by approver.'}"
              </div>
            </div>
          )}

          {/* Details Table */}
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

          {/* Mandatory Rejection Reason Input Section (Bug 1 Requirements 1, 2, 3, 4, 5) */}
          {showRejectInput && approval.status === 'pending' && (
            <div
              className="approval-reject-box"
              style={{
                marginBottom: '16px',
                padding: '16px',
                backgroundColor: '#fff5f5',
                borderRadius: '10px',
                border: `1.5px solid ${validationError || (touched && !isReasonValid) ? '#ef4444' : '#fca5a5'}`,
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <label
                  htmlFor="reject-reason-input"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#991b1b',
                  }}
                >
                  <span>Reason for Rejection</span>
                  <span style={{ color: '#dc2626' }}>* (Mandatory)</span>
                </label>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isReasonValid ? '#16a34a' : '#94a3b8',
                  }}
                >
                  {trimmedReason.length} / 5 min characters
                </span>
              </div>

              <textarea
                id="reject-reason-input"
                rows={3}
                value={rejectReason}
                onFocus={() => setTouched(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  setRejectReason(val);
                  setTouched(true);
                  const trimmed = val.trim();
                  if (!trimmed) {
                    setValidationError('Rejection reason cannot be empty or whitespace only.');
                  } else if (trimmed.length < 5) {
                    setValidationError('Rejection reason must be at least 5 characters long.');
                  } else {
                    setValidationError(null);
                  }
                }}
                placeholder="State the mandatory justification or compliance reason for rejecting this request..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `1.5px solid ${validationError || (touched && !isReasonValid) ? '#ef4444' : '#cbd5e1'}`,
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  backgroundColor: '#ffffff',
                  resize: 'vertical',
                }}
              />

              {/* Validation Feedback (Bug 1 Requirements 4 & 5) */}
              {(validationError || (touched && !isReasonValid)) && (
                <div
                  className="rejection-validation-error"
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#dc2626',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>
                    {validationError ||
                      (!trimmedReason
                        ? 'Rejection reason is mandatory. Empty or whitespace-only input is not accepted.'
                        : 'Rejection reason must be at least 5 characters long.')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Modal Footer (Bug 3 Requirements 6 & 7) */}
        <div
          className="modal-footer"
          style={{
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            backgroundColor: '#fbf9f6',
            borderTop: '1px solid #f1f5f9',
            flexShrink: 0,
            padding: '16px 28px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px',
          }}
        >
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
                  disabled={isSubmitting || !isReasonValid}
                  title={
                    !isReasonValid
                      ? 'Please enter a valid rejection reason (min 5 characters) to enable rejection'
                      : 'Confirm and reject request'
                  }
                  style={{
                    backgroundColor: !isReasonValid ? '#f87171' : '#dc2626',
                    color: 'white',
                    padding: '8px 18px',
                    borderRadius: '999px',
                    fontWeight: 600,
                    fontSize: '13px',
                    border: 'none',
                    opacity: isSubmitting || !isReasonValid ? 0.6 : 1,
                    cursor: !isReasonValid || isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: isReasonValid ? '0 2px 6px rgba(220, 38, 38, 0.3)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectInput(true);
                    setTouched(true);
                  }}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
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
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
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
