import React, { useState } from 'react';

export default function ApprovalDetailsModal({ approval, onClose, onApprove, onReject }) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!approval) return null;

  const handleConfirmReject = () => {
    onReject(approval.id, rejectReason || 'Rejected by approver');
    onClose();
  };

  const handleConfirmApprove = () => {
    onApprove(approval.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
              Approval Request Details
            </span>
            <h2 style={{ marginTop: '2px' }}>
              {approval.ticketNumber} - {approval.title}
            </h2>
          </div>
          <button className="btn-close-modal" onClick={onClose} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Status banner */}
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
              }`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
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
                      : '#dc2626'
                }}
              >
                {approval.status}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Submitted {approval.timeAgo}
            </span>
          </div>

          {/* Details Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 0', color: '#64748b', width: '130px', fontWeight: 500 }}>Requester</td>
                <td style={{ padding: '8px 0', fontWeight: 600, color: '#1e293b' }}>{approval.authorName}</td>
              </tr>
              {approval.onBehalfOf && (
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 500 }}>On Behalf Of</td>
                  <td style={{ padding: '8px 0', fontWeight: 600, color: '#1d68c9' }}>{approval.onBehalfOf}</td>
                </tr>
              )}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 500 }}>Category</td>
                <td style={{ padding: '8px 0', color: '#1e293b' }}>{approval.category || 'General'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 500 }}>Priority</td>
                <td style={{ padding: '8px 0', color: '#1e293b' }}>{approval.priority || 'Normal'}</td>
              </tr>
            </tbody>
          </table>

          {/* Ticket Details Box if present */}
          {approval.ticketDetails && (
            <div className="approval-ticket-details" style={{ margin: '0 0 20px 0' }}>
              <div className="approval-details-header">Associated Ticket Metadata</div>
              <div className="approval-details-grid">
                <div className="detail-row-key">Ticket ID</div>
                <div className="detail-row-val">{approval.ticketDetails.ticketId}</div>

                <div className="detail-row-key">Ticket Type</div>
                <div className="detail-row-val">
                  <span className="ticket-type-badge">{approval.ticketDetails.ticketType}</span>
                </div>

                {approval.ticketDetails.department && (
                  <>
                    <div className="detail-row-key">Department</div>
                    <div className="detail-row-val">{approval.ticketDetails.department}</div>
                  </>
                )}

                {approval.ticketDetails.fullName && (
                  <>
                    <div className="detail-row-key">Target User</div>
                    <div className="detail-row-val">{approval.ticketDetails.fullName}</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
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
                border: '1px solid #e2e8f0'
              }}
            >
              {approval.description}
            </div>
          </div>

          {/* Reject Reason input if activated */}
          {showRejectInput && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#991b1b', marginBottom: '6px' }}>
                Reason for Rejection:
              </label>
              <textarea
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please state why this request is being rejected..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #fca5a5',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-approval-action"
            onClick={onClose}
          >
            Cancel
          </button>

          {approval.status === 'pending' && (
            <>
              {showRejectInput ? (
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                >
                  Confirm Rejection
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowRejectInput(true)}
                  style={{
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                >
                  Reject Request
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirmApprove}
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '13px',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                }}
              >
                Approve Request
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
