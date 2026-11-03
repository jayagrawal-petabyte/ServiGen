import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ChangeRequest, ChangeType, RiskLevel, ImpactLevel } from '../../types/cmdb';
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
  const [impact, setImpact] = useState<ImpactLevel>('Medium');
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [linkedCiName, setLinkedCiName] = useState('Payment Gateway Cluster');
  const [linkedCiId, setLinkedCiId] = useState('PAY-001');
  const [agentName, setAgentName] = useState(user?.fullName || 'Adam Admin');
  const [scheduledStart, setScheduledStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [scheduledEnd, setScheduledEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [targetHours, setTargetHours] = useState(16);
  const [rollbackPlan, setRollbackPlan] = useState('Revert DNS routing and restore pre-change database snapshot within 30 minutes.');
  const [cabRequired, setCabRequired] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const weights = { Low: 1, Medium: 2, High: 3 };
  const riskScore = weights[impact] * weights[urgency];
  const computedRisk: RiskLevel = riskScore >= 6 ? 'Critical' : riskScore >= 4 ? 'High' : riskScore >= 2 ? 'Medium' : 'Low';

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
        description: description.trim() || 'Change submitted via Change Requests workspace.',
        type,
        status: type === 'Standard' ? 'Scheduled' : 'Pending Approval',
        risk: computedRisk,
        impact,
        urgency,
        riskScore,
        linkedCiId,
        linkedCiName,
        agentName,
        scheduledStart,
        scheduledEnd,
        timeSpentHours: 0,
        targetHours,
        completionPercent: 0,
        tags: [type, 'ITIL', linkedCiId],
        subtasks: [
          { id: 'TSK-01', title: 'Pre-change system backup and telemetry baseline', completed: false },
          { id: 'TSK-02', title: 'Execute primary implementation and script deployment', completed: false },
          { id: 'TSK-03', title: 'Post-deployment verification and smoke testing', completed: false },
        ],
        rollbackPlan: {
          steps: [
            { id: 'RB-01', title: 'Verify error trigger threshold and initiate failover', completed: false },
            { id: 'RB-02', title: 'Restore prior configuration and database snapshot', completed: false },
          ],
          estimatedDurationMinutes: 45,
          contingencyOwner: agentName,
          verificationProcedure: rollbackPlan,
        },
        cabReview: {
          decision: type === 'Standard' ? 'Approved' : 'Pending',
          cabNotes: cabRequired ? 'Requires review by CAB before execution.' : 'Standard pre-approved template.',
        },
      });

      onClose();
    } catch {
      setValidationError('Failed to create change request. Please try again.');
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#eb6a47]/10 flex items-center justify-center text-[#eb6a47]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Change Request</h2>
              <p className="text-xs text-slate-500">Plan and submit a change request for review and scheduling.</p>
            </div>
          </div>
          <button
            onClick={onClose}
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
              placeholder="e.g. Upgrade PostgreSQL production cluster to v16.2"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#eb6a47] focus:bg-white transition-all text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Change Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ChangeType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              >
                <option value="Standard">Standard</option>
                <option value="Normal">Normal</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Impact</label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as ImpactLevel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as 'Low' | 'Medium' | 'High')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-slate-600 font-semibold">Calculated Risk Profile:</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                computedRisk === 'Critical'
                  ? 'bg-rose-100 text-rose-800'
                  : computedRisk === 'High'
                  ? 'bg-amber-100 text-amber-800'
                  : computedRisk === 'Medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {computedRisk} Risk ({riskScore}/9)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Scope & Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline change scope, technical justification, and testing validation..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47] focus:bg-white text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Target CI ID</label>
              <input
                type="text"
                value={linkedCiId}
                onChange={(e) => setLinkedCiId(e.target.value)}
                placeholder="PAY-001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Target CI Name</label>
              <input
                type="text"
                value={linkedCiName}
                onChange={(e) => setLinkedCiName(e.target.value)}
                placeholder="Payment Gateway Cluster"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Scheduled Start</label>
              <input
                type="date"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Scheduled End</label>
              <input
                type="date"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Effort Plan (Hours)</label>
              <input
                type="number"
                min={1}
                max={200}
                value={targetHours}
                onChange={(e) => setTargetHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Rollback & Backout Strategy</label>
            <textarea
              rows={2}
              value={rollbackPlan}
              onChange={(e) => setRollbackPlan(e.target.value)}
              placeholder="Describe backout triggers, recovery snapshot, and failover steps..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb6a47] focus:bg-white text-xs resize-none"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="checkbox"
              id="cabToggle"
              checked={cabRequired}
              onChange={(e) => setCabRequired(e.target.checked)}
              className="w-4 h-4 text-[#eb6a47] rounded focus:ring-[#eb6a47] cursor-pointer"
            />
            <label htmlFor="cabToggle" className="text-slate-700 font-bold cursor-pointer select-none">
              Require CAB Approval before implementation
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#eb6a47] hover:bg-[#db5936] text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Submit Change</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
