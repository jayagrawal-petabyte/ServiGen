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
  onOpenDetails?: (approval: Approval) => void;
}

export default function ApprovalCard({
  approval,
  onApprove,
  onReject,
  onOpenDetails,
}: ApprovalCardProps) {
  const isPending = approval.status === 'pending';

  return (
    <div className={`approval-card status-${approval.status}`}>
      <div className="approval-card-top">
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

        <div className="approval-card-header-info">
          <div className="approval-card-author-line">
            <span>{approval.authorName}</span>

            {approval.onBehalfOf && (
              <>
                <span style={{ color: '#64748b', margin: '0 5px' }}>
                  - On behalf of:
                </span>

                <span
                  className="behalf-link"
                  onClick={() => onOpenDetails?.(approval)}
                >
                  {approval.onBehalfOf}
                </span>
              </>
            )}
          </div>

          <div className="approval-card-title-line">
            <span
              className="ticket-id-link"
              onClick={() => onOpenDetails?.(approval)}
            >
              {approval.ticketNumber}
            </span>

            <span>-</span>

            <span>{approval.title}</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '4px',
          }}
        >
          <span className="approval-card-time">{approval.timeAgo}</span>

          {!isPending && (
            <span className={`card-status-pill ${approval.status}`}>
              {approval.status}
            </span>
          )}
        </div>
      </div>

      <div className="approval-card-body">
        {approval.description}
      </div>

      {approval.ticketDetails && (
        <div className="approval-ticket-details">
          <div className="approval-details-header">
            Ticket Details
          </div>

          <div className="approval-details-grid">
            <div className="detail-row-key">Ticket ID</div>

            <div className="detail-row-val">
              <a
                href="#details"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenDetails?.(approval);
                }}
              >
                {approval.ticketDetails.ticketId}
              </a>
            </div>

            <div className="detail-row-key">Ticket Type</div>

            <div className="detail-row-val">
              <span className="ticket-type-badge">
                {approval.ticketDetails.ticketType}
              </span>
            </div>

            {approval.ticketDetails.username && (
              <>
                <div className="detail-row-key">Username</div>
                <div className="detail-row-val">
                  {approval.ticketDetails.username}
                </div>
              </>
            )}

            {approval.ticketDetails.fullName && (
              <>
                <div className="detail-row-key">Full Name</div>
                <div className="detail-row-val">
                  {approval.ticketDetails.fullName}
                </div>
              </>
            )}

            {approval.ticketDetails.department && (
              <>
                <div className="detail-row-key">Department</div>
                <div className="detail-row-val">
                  {approval.ticketDetails.department}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isPending ? (
        <div className="approval-card-footer">
          <button
            className="btn-thumb approve"
            title="Approve Request"
            type="button"
            onClick={() => onApprove(approval.id)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
          </button>

          <button
            className="btn-thumb reject"
            title="Reject Request"
            type="button"
            onClick={() => onReject(approval.id)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            paddingTop: '10px',
            fontSize: '13px',
            color: '#64748b',
          }}
        >
          Action completed. Request marked as{' '}
          <strong style={{ textTransform: 'capitalize' }}>
            {approval.status}
          </strong>
          .
        </div>
      )}
    </div>
  );
}