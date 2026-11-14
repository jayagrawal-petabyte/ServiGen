import React from 'react';
import { ModalShell } from '../../../components/shared/ModalShell';

interface GetStartedModalProps {
  onClose: () => void;
  onOpenNewTicket?: () => void;
}

const GetStartedModal: React.FC<GetStartedModalProps> = ({ onClose, onOpenNewTicket }) => {
  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      size="md"
      icon={<span className="text-sm">🚀</span>}
      title="Getting Started with Major Incidents"
      description="Fast onboarding guide for IT response teams"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={onClose}
            className="text-xs font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Close Guide
          </button>
          <div className="flex items-center gap-2">
            {onOpenNewTicket && (
              <button
                onClick={() => {
                  onClose();
                  onOpenNewTicket();
                }}
                className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors shadow-sm cursor-pointer"
              >
                Create First Ticket →
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <div className="flex gap-3.5 items-start p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            1
          </span>
          <div>
            <h3 className="text-xs font-bold text-gray-800">Identify &amp; Log Critical Outages</h3>
            <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
              Click <strong>+ New Ticket</strong> to record a major incident, specify impact, affected users, priority, and product.
            </p>
          </div>
        </div>

        <div className="flex gap-3.5 items-start p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            2
          </span>
          <div>
            <h3 className="text-xs font-bold text-gray-800">Coordinate Lifecycle Stages</h3>
            <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
              Move from <strong>Started</strong> → <strong>Escalated</strong> → <strong>Diagnosed</strong> → <strong>Mitigated</strong> → <strong>Resolved</strong> → <strong>Closed</strong>.
              Managers and Admins can advance stages directly from cards or side panels.
            </p>
          </div>
        </div>

        <div className="flex gap-3.5 items-start p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            3
          </span>
          <div>
            <h3 className="text-xs font-bold text-gray-800">Broadcast Live Stakeholder Updates</h3>
            <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
              Open the <strong>Activity Feed</strong> (···) or click any incident to view timeline audits, post comments, and reassign engineers.
            </p>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default GetStartedModal;
