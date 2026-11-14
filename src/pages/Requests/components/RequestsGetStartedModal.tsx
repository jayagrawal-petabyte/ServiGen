import React from 'react';
import { ModalShell } from '../../../components/shared/ModalShell';

interface RequestsGetStartedModalProps {
  onClose: () => void;
  onOpenNewRequest?: () => void;
}

export const RequestsGetStartedModal: React.FC<RequestsGetStartedModalProps> = ({
  onClose,
  onOpenNewRequest,
}) => {
  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      size="md"
      icon={<span className="text-sm">📋</span>}
      title="Getting Started with Service Requests"
      description="Fast onboarding guide for IT service delivery"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              onClose();
              if (onOpenNewRequest) onOpenNewRequest();
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#C96F55] hover:bg-[#b85e44] text-white shadow-xs transition-colors cursor-pointer"
          >
            + Create Request
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <div className="flex gap-3.5 items-start p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            1
          </span>
          <div>
            <h3 className="text-xs font-bold text-gray-800">Submit Standard Service Catalog Requests</h3>
            <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
              Click <strong>+ New Ticket</strong> to submit requests for hardware provisioning, software licenses, VPN access, and cloud sandbox projects.
            </p>
          </div>
        </div>

        <div className="flex gap-3.5 items-start p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            2
          </span>
          <div>
            <h3 className="text-xs font-bold text-gray-800">Filter by Assigned Team &amp; Agent</h3>
            <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
              Use the left hierarchy tree to inspect items across <strong>1st Line Support</strong>, <strong>2nd Line Support</strong>, or <strong>Infrastructure</strong>, or focus on your personal queue.
            </p>
          </div>
        </div>

        <div className="flex gap-3.5 items-start p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            3
          </span>
          <div>
            <h3 className="text-xs font-bold text-gray-800">Track Fulfillment SLAs &amp; Status</h3>
            <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
              Filter by <strong>Open Requests</strong>, <strong>In Progress</strong>, or <strong>Resolved</strong>. Monitor countdown targets to prevent SLA breaches.
            </p>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};
