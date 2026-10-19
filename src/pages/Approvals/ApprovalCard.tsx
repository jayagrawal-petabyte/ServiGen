import React from 'react';

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
              if (onOpenDetails) {
                onOpenDetails(approval, true);
              } else {
                onReject(approval.id);
              }
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