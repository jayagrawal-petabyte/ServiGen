import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ChangeRequest, ChangeType, RiskLevel, ImpactLevel } from '../../types/cmdb';
import { X, Plus, AlertCircle, Loader2, ShieldCheck, RotateCcw, Calendar, CheckSquare } from 'lucide-react';
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

  // Calculate Risk Score & Level based on Impact and Urgency matrix
  const getRiskCalculation = (imp: ImpactLevel, urg: 'Low' | 'Medium' | 'High') => {
    const weights = { Low: 1, Medium: 2, High: 3 };
    const score = weights[imp] * weights[urg]; // 1 to 9
    let level: RiskLevel = 'Low';
    if (score >= 6) level = 'Critical';
    else if (score >= 4) level = 'High';
    else if (score >= 2) level = 'Medium';
    return { score, level };
  };

  const { score: riskScore, level: computedRisk } = getRiskCalculation(impact, urgency);

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
            { id: 'RB-02', title: 'Restore snapshot or fallback configuration', completed: false },
          ],
          contingencyOwner: agentName,
          estimatedDurationMinutes: 45,
        },
        cabReview: {
          decision: type === 'Standard' ? 'Approved' : 'Pending',
          decisionBy: type === 'Standard' ? 'Pre-Approved Standard Process' : undefined,
          cabNotes: cabRequired ? 'Awaiting CAB scheduled agenda review.' : 'Standard expedited workflow.',
        },
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
              Submit an ITIL-compliant change request with risk scoring and rollback verification
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
              placeholder="e.g. Upgrade Database Server cluster to PostgreSQL 16"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#eb6a47] focus:bg-white transition-all text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Description & Justification</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe business reason, components affected, and maintenance window requirements..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#eb6a47] focus:bg-white transition-all text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Change Type</label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value as ChangeType;
                  setType(newType);
                  if (newType === 'Standard') setCabRequired(false);
                  else setCabRequired(true);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              >
                <option value="Normal">Normal (CAB Sign-off)</option>
                <option value="Standard">Standard (Pre-Approved)</option>
                <option value="Emergency">Emergency (Expedited)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Impact</label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as ImpactLevel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              >
                <option value="Low">Low (Isolated component)</option>
                <option value="Medium">Medium (Departmental)</option>
                <option value="High">High (Enterprise / Customer-facing)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              >
                <option value="Low">Low (Routine)</option>
                <option value="Medium">Medium (Upcoming milestone)</option>
                <option value="High">High (Immediate necessity)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Risk Rating Banner */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700">Calculated Risk Score:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{riskScore} / 9</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white ${
                computedRisk === 'Critical'
                  ? 'bg-rose-600'
                  : computedRisk === 'High'
                  ? 'bg-amber-600'
                  : computedRisk === 'Medium'
                  ? 'bg-yellow-500'
                  : 'bg-emerald-600'
              }`}>
                {computedRisk} Risk
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Target CI (Configuration Item)</label>
              <select
                value={linkedCiId}
                onChange={(e) => {
                  const id = e.target.value;
                  setLinkedCiId(id);
                  if (id === 'PAY-001') setLinkedCiName('Payment Gateway Cluster');
                  else if (id === 'DB-001') setLinkedCiName('Primary PostgreSQL Database');
                  else if (id === 'NET-001') setLinkedCiName('Core Cisco Switch Rack 4');
                  else setLinkedCiName('Cloudflare Edge CDN');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              >
                <option value="PAY-001">PAY-001 — Payment Gateway Cluster</option>
                <option value="DB-001">DB-001 — Customer Database Cluster</option>
                <option value="NET-001">NET-001 — Core Switch Rack 4</option>
                <option value="CDN-001">CDN-001 — Cloudflare Edge CDN</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Assigned Change Owner</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Window Start</label>
              <input
                type="date"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Window End</label>
              <input
                type="date"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Target Hours</label>
              <input
                type="number"
                min="1"
                max="200"
                value={targetHours}
                onChange={(e) => setTargetHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Rollback Contingency Plan</label>
            <input
              type="text"
              value={rollbackPlan}
              onChange={(e) => setRollbackPlan(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="cabReq"
              checked={cabRequired}
              onChange={(e) => setCabRequired(e.target.checked)}
              className="w-4 h-4 text-[#eb6a47] rounded cursor-pointer"
            />
            <label htmlFor="cabReq" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Require formal CAB (Change Advisory Board) approval before deployment
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
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Submit Change Request</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
