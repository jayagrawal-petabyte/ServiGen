import React, { useState, useEffect } from 'react';
import { ModalShell } from '../../components/shared';
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
    <ModalShell
      isOpen={Boolean(approval)}
      onClose={onClose}
      size="xl"
      className="max-w-3xl"
      bodyClassName="p-6 space-y-5"
      description="Approval Request Details"
      title={`${approval.ticketNumber} – ${approval.title}`}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            className="btn-approval-action"
            onClick={showRejectInput ? () => setShowRejectInput(false) : onClose}
            disabled={isSubmitting}
          >
            {showRejectInput ? 'Back' : 'Cancel'}
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
      }
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

          {/* Request Information Card */}
          <div className="approval-ticket-details">
            <div className="approval-details-header">
              Approval Request Information
            </div>
            <div className="approval-details-grid">
              <div className="detail-row-key">Requester</div>
              <div className="detail-row-val font-semibold text-slate-800">
                {approval.authorName}
              </div>

              {approval.onBehalfOf && (
                <>
                  <div className="detail-row-key">On Behalf Of</div>
                  <div className="detail-row-val font-semibold text-blue-600">
                    {approval.onBehalfOf}
                  </div>
                </>
              )}

              <div className="detail-row-key">Category</div>
              <div className="detail-row-val text-slate-700">
                {approval.category || 'General'}
              </div>

              <div className="detail-row-key">Priority</div>
              <div className="detail-row-val">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    approval.priority === 'Critical'
                      ? 'bg-rose-100 text-rose-700'
                      : approval.priority === 'High'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {approval.priority || 'Normal'}
                </span>
              </div>
            </div>
          </div>

          {/* Associated Ticket Metadata Card */}
          {approval.ticketDetails && (
            <div className="approval-ticket-details">
              <div className="approval-details-header">
                Associated Ticket Metadata
              </div>

              <div className="approval-details-grid">
                <div className="detail-row-key">Ticket ID</div>
                <div className="detail-row-val font-mono font-medium text-slate-800">
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
                    <div className="detail-row-val text-slate-700">
                      {approval.ticketDetails.department}
                    </div>
                  </>
                )}

                {approval.ticketDetails.fullName && (
                  <>
                    <div className="detail-row-key">Target User</div>
                    <div className="detail-row-val font-medium text-slate-800">
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
    </ModalShell>
  );
}
