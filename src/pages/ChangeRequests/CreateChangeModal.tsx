import React, { useState } from 'react';
import type { ChangeRequest, ChangeType, RiskLevel } from '../../types/cmdb';
import { X, Plus } from 'lucide-react';

interface CreateChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newChange: ChangeRequest) => void;
}

export const CreateChangeModal: React.FC<CreateChangeModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChangeType>('Normal');
  const [risk, setRisk] = useState<RiskLevel>('Medium');
  const [linkedCiName, setLinkedCiName] = useState('DB-PROD-POSTGRES-01');
  const [agentName, setAgentName] = useState('Vooka Sai Siddharth');
  const [scheduledStart, setScheduledStart] = useState('Sep 25, 2026');
  const [scheduledEnd, setScheduledEnd] = useState('Oct 05, 2026');
  const [targetHours, setTargetHours] = useState(120);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newId = `#${Math.floor(2000 + Math.random() * 9000)}`;
    const newChange: ChangeRequest = {
      id: newId,
      title,
      description,
      type,
      status: 'In Progress',
      risk,
      impact: 'Medium',
      linkedCiId: 'CI-1000',
      linkedCiName,
      agentName,
      scheduledStart,
      scheduledEnd,
      timeSpentHours: 0,
      targetHours,
      completionPercent: 0,
      tags: [type, 'NewChange'],
      subtasks: [
        { id: `#${Math.floor(3000 + Math.random() * 1000)}`, title: 'Initial Assessment & Pre-check', completed: true },
        { id: `#${Math.floor(3000 + Math.random() * 1000)}`, title: 'Execution Phase 1', completed: false },
        { id: `#${Math.floor(3000 + Math.random() * 1000)}`, title: 'Post-Rollout Validation', completed: false },
      ],
    };

    onCreate(newChange);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create New Change Request</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Owner: Vooka Sai Siddharth — File a new change ticket under CMDB & Change Requests
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          <div>
            <label className="block text-slate-800 font-bold mb-1">
              Change Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., PostgreSQL Cluster Failover & Upgrade"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
            />
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of implementation steps..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-800 font-bold mb-1">Change Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ChangeType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#E87A5D] cursor-pointer"
              >
                <option value="Standard">Standard</option>
                <option value="Normal">Normal</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">Risk Level</label>
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value as RiskLevel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#E87A5D] cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-800 font-bold mb-1">Target Linked CI</label>
              <input
                type="text"
                value={linkedCiName}
                onChange={(e) => setLinkedCiName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">Assigned Agent</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#E87A5D] hover:bg-[#D96A4C] text-white text-xs font-bold rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Change Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
