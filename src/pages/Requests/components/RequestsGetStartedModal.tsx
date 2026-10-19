import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface RequestsGetStartedModalProps {
  onClose: () => void;
  onOpenNewRequest?: () => void;
}

export const RequestsGetStartedModal: React.FC<RequestsGetStartedModalProps> = ({
  onClose,
  onOpenNewRequest,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={(e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
              📋
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Getting Started with Service Requests</h2>
              <p className="text-[11px] text-gray-500">Fast onboarding guide for IT service delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
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

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-gray-50 border-t border-gray-100">
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
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            + Create Request
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
