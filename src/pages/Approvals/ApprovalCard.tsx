import React, { useState } from 'react';
import { Check, X, Clock, User, CheckCircle2, XCircle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Button, ModalShell } from '../../components/shared';

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
            <div
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C96F55] to-[#B55F46] text-white font-bold text-sm flex items-center justify-center shadow-xs select-none shrink-0"
              title="Dispatch Agent (AI)"
            >
              {approval.authorInitials || 'DA'}
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-full bg-[#263B5E] text-white flex items-center justify-center shadow-xs select-none font-bold text-xs shrink-0"
              title={approval.authorName}
            >
              {approval.authorInitials ? (
                approval.authorInitials
              ) : (
                <User className="w-5 h-5 text-white/90" />
              )}
            </div>
          )}
        </div>

        {/* Right: Content Column */}
        <div className="approval-card-content-column">
          {/* Line 1: Author, On Behalf Of, Category, and Timestamp */}
          <div className="approval-card-author-row">
            <div className="approval-card-author-left">
              <button
                type="button"
                onClick={() => onOpenDetails?.(approval, false)}
                className="font-semibold text-slate-900 hover:text-[#C96F55] transition-colors cursor-pointer text-left"
                title="Click to view details"
              >
                {approval.authorName}
              </button>

              {approval.onBehalfOf && (
                <>
                  <span className="text-slate-400 font-normal">on behalf of</span>
                  <button
                    type="button"
                    onClick={() => onOpenDetails?.(approval, false)}
                    className="font-medium text-slate-700 hover:text-[#C96F55] transition-colors cursor-pointer text-left"
                    title="Click to view details"
                  >
                    {approval.onBehalfOf}
                  </button>
                </>
              )}

              {approval.category && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                  {approval.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium shrink-0 ml-auto">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{approval.timeAgo}</span>
            </div>
          </div>

          {/* Line 2: Ticket Number & Title */}
          <div className="approval-card-title-row">
            <button
              type="button"
              onClick={() => onOpenDetails?.(approval, false)}
              className="text-[#C96F55] font-bold text-sm tracking-tight hover:text-[#B55F46] hover:underline cursor-pointer inline-flex items-center gap-0.5"
              title="Click to view ticket details"
            >
              <span>{approval.ticketNumber}</span>
            </button>
            <span className="text-slate-300 font-light">•</span>
            <span
              onClick={() => onOpenDetails?.(approval, false)}
              className="text-sm sm:text-base font-bold text-slate-900 cursor-pointer hover:text-slate-700 transition-colors"
            >
              {approval.title}
            </span>
          </div>

          {/* Line 3: Description if present */}
          {approval.description && approval.description.trim().length > 0 && (
            <p className="approval-card-body">
              {approval.description}
            </p>
          )}

          {/* Line 4: Clean Metadata Strip for Ticket Details */}
          {approval.ticketDetails && (
            <div className="mt-3.5 bg-[#FFF9F5]/80 border border-[#ebdcd3] rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#ebdcd3]/70">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Ticket Details
                </span>
                <button
                  type="button"
                  onClick={() => onOpenDetails?.(approval, false)}
                  className="text-[11px] font-semibold text-[#C96F55] hover:text-[#B55F46] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>View Details</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium mb-0.5">Ticket ID</span>
                  <button
                    type="button"
                    onClick={() => onOpenDetails?.(approval, false)}
                    className="font-mono font-bold text-[#C96F55] hover:underline cursor-pointer"
                  >
                    {approval.ticketDetails.ticketId}
                  </button>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block font-medium mb-0.5">Ticket Type</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#263B5E] text-white">
                    {approval.ticketDetails.ticketType}
                  </span>
                </div>

                {(approval.ticketDetails.fullName || approval.ticketDetails.username) && (
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium mb-0.5">Target User</span>
                    <span className="font-semibold text-slate-800">
                      {approval.ticketDetails.fullName || approval.ticketDetails.username}
                    </span>
                  </div>
                )}

                {approval.ticketDetails.department && (
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium mb-0.5">Department</span>
                    <span className="font-semibold text-slate-800">
                      {approval.ticketDetails.department}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Standardized Action Controls */}
      {isPending ? (
        <div className="approval-card-footer">
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Pending your review</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isActionLoading}
              onClick={() => {
                setErrorText(null);
                setIsRejectDialogOpen(true);
              }}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 font-semibold"
              icon={<X className="w-3.5 h-3.5 text-rose-600" />}
              title="Reject Request (Requires Reason)"
            >
              Reject
            </Button>

            <Button
              variant="primary"
              size="sm"
              disabled={isActionLoading}
              isLoading={isActionLoading}
              onClick={() => onApprove(approval.id)}
              className="!bg-emerald-600 hover:!bg-emerald-700 !text-white font-bold shadow-xs"
              icon={<Check className="w-3.5 h-3.5" />}
              title="Approve Request"
            >
              Approve
            </Button>
          </div>

          {/* Mandatory Rejection Reason Dialog */}
          <ModalShell
            isOpen={isRejectDialogOpen}
            onClose={() => setIsRejectDialogOpen(false)}
            title={<span className="text-rose-700">⚠️ Reject Approval Request</span>}
            size="sm"
            description={
              <span>
                Please provide a mandatory justification for rejecting <strong>{approval.ticketNumber}</strong> ({approval.title}). This reason will be logged to the audit trail and sent to <strong>{approval.authorName}</strong>.
              </span>
            }
          >
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejectDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={isActionLoading}
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </ModalShell>
        </div>
      ) : approval.status === 'approved' ? (
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Approved by you</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">{approval.timeAgo}</span>
        </div>
      ) : (
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200/60">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Rejected by you</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{approval.timeAgo}</span>
          </div>
          {approval.rejectReason && (
            <div className="text-xs text-slate-700 bg-rose-50/60 px-3 py-2 rounded-lg border border-rose-100">
              <span className="font-semibold text-rose-800">Rejection Reason:</span>{' '}
              <span className="text-slate-700">{approval.rejectReason}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
