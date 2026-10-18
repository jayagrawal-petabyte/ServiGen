import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ChangeRequest, ChangeType, RiskLevel } from '../../types/cmdb';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';

interface CreateChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newChange: Partial<ChangeRequest> & { title: string }) => Promise<void> | void;
}

export const CreateChangeModal: React.FC<CreateChangeModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChangeType>('Normal');
  const [risk, setRisk] = useState<RiskLevel>('Medium');
  const [linkedCiName, setLinkedCiName] = useState('Primary PostgreSQL Database Cluster');
  const [linkedCiId, setLinkedCiId] = useState('CI-1001');
  const [agentName, setAgentName] = useState(user?.fullName || 'Vooka Sai Siddharth');
  const [scheduledStart, setScheduledStart] = useState('Oct 16, 2026');
  const [scheduledEnd, setScheduledEnd] = useState('Oct 24, 2026');
  const [targetHours, setTargetHours] = useState(40);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length < 3) {
      setValidationError('Change Title must be at least 3 characters long.');
      return;
    }

    if (targetHours <= 0) {
      setValidationError('Target Hours must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        title: trimmedTitle,
        description: description.trim(),
        type,
        status: 'In Progress',
        risk,
        impact: 'Medium',
        linkedCiId,
        linkedCiName,
        agentName,
        scheduledStart,
        scheduledEnd,
        timeSpentHours: 0,
        targetHours,
        completionPercent: 0,
        tags: [type, 'ChangeManagement'],
      });

      // Reset form
      setTitle('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to submit Change Request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create New Change Request</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Submit a validated change request to Servigen Change Management (POST /api/change-requests)
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Change Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Upgrade Database Server to v14"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#E87A5D] focus:bg-white transition-all text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Description / Summary</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed justification, risk assessment, and planned rollback strategy..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E87A5D] focus:bg-white transition-all text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Change Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ChangeType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
              >
                <option value="Normal">Normal Change</option>
                <option value="Standard">Standard Change</option>
                <option value="Emergency">Emergency Change</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Risk Assessment</label>
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value as RiskLevel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
              >
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
                <option value="Critical">Critical Risk</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Linked CI Name</label>
              <input
                type="text"
                value={linkedCiName}
                onChange={(e) => setLinkedCiName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Linked CI Tag / ID</label>
              <input
                type="text"
                value={linkedCiId}
                onChange={(e) => setLinkedCiId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Assigned Agent</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Target Hours (Budget)</label>
              <input
                type="number"
                min={1}
                value={targetHours}
                onChange={(e) => setTargetHours(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Scheduled Window Start</label>
              <input
                type="text"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Scheduled Window End</label>
              <input
                type="text"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#E87A5D] hover:bg-[#d46a4e] text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Submit Change Request
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};