import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export interface GuideStep {
  title: string;
  body: React.ReactNode;
}

interface GetStartedGuideProps {
  title: string;
  subtitle?: string;
  steps: GuideStep[];
  /** Label for the primary action, e.g. "Create First Request →". */
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onClose: () => void;
}

/**
 * Shared onboarding guide dialog.
 *
 * Major Incidents had a real guide; other workspaces wired their "Get started"
 * button to a toast that vanished after 2.5s and explained nothing. This is the
 * Major Incidents dialog with its copy lifted out, so every workspace can show
 * the same thing with its own steps.
 */
export const GetStartedGuide: React.FC<GetStartedGuideProps> = ({
  title,
  subtitle,
  steps,
  primaryActionLabel,
  onPrimaryAction,
  onClose,
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
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center text-sm font-bold shadow-xs">
              🚀
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{title}</h2>
              {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
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

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="flex gap-3.5 items-start p-3 rounded-xl bg-gray-50 border border-gray-100"
            >
              <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div>
                <h3 className="text-xs font-bold text-gray-800">{step.title}</h3>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            Close Guide
          </button>
          {primaryActionLabel && onPrimaryAction && (
            <button
              onClick={() => {
                onClose();
                onPrimaryAction();
              }}
              className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors shadow-sm"
            >
              {primaryActionLabel}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GetStartedGuide;
