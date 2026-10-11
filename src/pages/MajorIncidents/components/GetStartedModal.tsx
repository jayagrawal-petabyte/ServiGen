import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface GetStartedModalProps {
  onClose: () => void;
  onOpenNewTicket?: () => void;
}

const GetStartedModal: React.FC<GetStartedModalProps> = ({ onClose, onOpenNewTicket }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center text-sm font-bold shadow-xs">
              🚀
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Getting Started with Major Incidents</h2>
              <p className="text-[11px] text-gray-500">Fast onboarding guide for IT response teams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
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

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
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
                className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors shadow-sm"
              >
                Create First Ticket →
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GetStartedModal;
