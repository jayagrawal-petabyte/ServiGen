import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export interface TicketDetails {
  ticketId: string;
  ticketType: string;
  username?: string;
  fullName?: string;
  department?: string;
  extraInfo?: string;
}

export interface Approval {
  id: string;
  ticketNumber: string;
  authorName: string;
  authorInitials: string | null;
  authorType: 'ai' | 'user';
  onBehalfOf?: string;
  title: string;
  timeAgo: string;
  createdAt: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: string;
  category: string;
  urgency: string;
  ticketDetails: TicketDetails | null;
  rejectReason?: string;
}

interface ApprovalCardProps {
  approval: Approval;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onOpenDetails?: (approval: Approval, defaultRejectMode?: boolean) => void;
  isActionLoading?: boolean;
}

export default function ApprovalCard({
  approval,
  onApprove,
  onReject,
  onOpenDetails,
  isActionLoading = false,
}: ApprovalCardProps) {
  const isPending = approval.status === 'pending';
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reasonText.trim();
    if (!trimmed || trimmed.length < 5) {
      setErrorText('Please provide a mandatory rejection reason (at least 5 characters).');
      return;
    }
    setErrorText(null);
    setIsRejectDialogOpen(false);
    onReject(approval.id, trimmed);
    setReasonText('');
  };

  return (
    <div className={`approval-card status-${approval.status}`}>
      <div className="approval-card-main-row">
        {/* Left: Avatar */}
        <div className="approval-card-avatar-wrapper">
          {approval.authorType === 'ai' ? (
            <div className="approval-avatar ai" title="Dispatch Agent (AI)">
              {approval.authorInitials || 'DA'}
            </div>
          ) : (
            <div className="approval-avatar user" title={approval.authorName}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Right: Content Column */}
        <div className="approval-card-content-column">
          {/* Line 1: Author & On Behalf Of (left), timeAgo (right) */}
          <div className="approval-card-author-row">
            <div className="approval-card-author-left">
              <span
                className="card-blue-link"
                onClick={() => onOpenDetails?.(approval, false)}
                title="Click to view details"
              >
                {approval.authorName}
              </span>

              {approval.onBehalfOf && (
                <>
                  <span className="behalf-separator">- On behalf of:</span>
                  <span
                    className="card-blue-link"
                    onClick={() => onOpenDetails?.(approval, false)}
                    title="Click to view details"
                  >
                    {approval.onBehalfOf}
                  </span>
                </>
              )}
            </div>

            <span className="approval-card-time">{approval.timeAgo}</span>
          </div>

          {/* Line 2: Ticket Number & Title */}
          <div className="approval-card-title-row">
            <span
              className="card-blue-link font-semibold"
              onClick={() => onOpenDetails?.(approval, false)}
              title="Click to view details"
            >
              {approval.ticketNumber}
            </span>
            <span className="approval-card-title-text"> - {approval.title}</span>
          </div>

          {/* Line 3: Description if present */}
          {approval.description && approval.description.trim().length > 0 && (
            <div className="approval-card-body">
              {approval.description}
            </div>
          )}

          {/* Line 4: Nested Ticket Details Table if present */}
          {approval.ticketDetails && (
            <div className="approval-ticket-details">
              <div className="approval-details-header">
                Ticket Details
              </div>

              <div className="approval-details-table">
                <div className="detail-table-row">
                  <div className="detail-row-key">Ticket ID</div>
                  <div className="detail-row-val">
                    <a
                      href="#details"
                      className="ticket-id-blue-link"
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenDetails?.(approval, false);
                      }}
                    >
                      {approval.ticketDetails.ticketId}
                    </a>
                  </div>
                </div>

                <div className="detail-table-row">
                  <div className="detail-row-key">Ticket Type</div>
                  <div className="detail-row-val">
                    <span className="ticket-type-badge">
                      {approval.ticketDetails.ticketType}
                    </span>
                  </div>
                </div>

                {approval.ticketDetails.username && (
                  <div className="detail-table-row">
                    <div className="detail-row-key">Username</div>
                    <div className="detail-row-val">
                      {approval.ticketDetails.username}
                    </div>
                  </div>
                )}

                {approval.ticketDetails.fullName && (
                  <div className="detail-table-row">
                    <div className="detail-row-key">Full Name</div>
                    <div className="detail-row-val">
                      {approval.ticketDetails.fullName}
                    </div>
                  </div>
                )}

                {approval.ticketDetails.department && (
                  <div className="detail-table-row">
                    <div className="detail-row-key">Department</div>
                    <div className="detail-row-val">
                      {approval.ticketDetails.department}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Centered Thumbs Up / Down */}
      {isPending ? (
        <div className="approval-card-footer">
          <button
            className="btn-thumb approve"
            title="Approve Request"
            type="button"
            disabled={isActionLoading}
            onClick={() => onApprove(approval.id)}
            style={{ opacity: isActionLoading ? 0.6 : 1 }}
          >
            {isActionLoading ? (
              <span className="spinner-mini" />
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 10v12" />
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
              </svg>
            )}
          </button>

          <button
            className="btn-thumb reject"
            title="Reject Request (Requires Reason)"
            type="button"
            disabled={isActionLoading}
            onClick={() => {
              setErrorText(null);
              setIsRejectDialogOpen(true);
            }}
            style={{ opacity: isActionLoading ? 0.6 : 1 }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 14V2" />
              <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
            </svg>
          </button>

          {/* Mandatory Rejection Reason Dialog */}
          <Dialog.Root open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-md z-50 flex flex-col gap-3.5 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <Dialog.Title className="text-base font-bold text-rose-700 flex items-center gap-2">
                    <span>⚠️ Reject Approval Request</span>
                  </Dialog.Title>
                  <Dialog.Close className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</Dialog.Close>
                </div>

                <Dialog.Description className="text-xs text-slate-500">
                  Please provide a mandatory justification for rejecting <strong>{approval.ticketNumber}</strong> ({approval.title}). This reason will be logged to the audit trail and sent to <strong>{approval.authorName}</strong>.
                </Dialog.Description>

                <form onSubmit={handleConfirmReject} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Rejection Justification <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reasonText}
                      onChange={(e) => {
                        setReasonText(e.target.value);
                        if (errorText && e.target.value.trim().length >= 5) setErrorText(null);
                      }}
                      placeholder="e.g. Budget authorization cap exceeded; please submit revised quotation."
                      className="w-full p-2.5 text-xs text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                      autoFocus
                    />
                    {errorText && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">
                        {errorText}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsRejectDialogOpen(false)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isActionLoading}
                      className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm cursor-pointer transition-all disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      ) : (
        <div className="approval-card-completed">
          Action completed. Request marked as{' '}
          <strong style={{ textTransform: 'capitalize' }}>
            {approval.status}
          </strong>
          {approval.rejectReason && (
            <span className="reject-reason-note">
              Reason: {approval.rejectReason}
            </span>
          )}
        </div>
      )}
    </div>
  );
}