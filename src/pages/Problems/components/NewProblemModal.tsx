import React, { useState } from 'react';
import { ProblemItem, ProblemPriority } from '../types/problem.types';

interface NewProblemModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<ProblemItem>) => void;
}

export const NewProblemModal: React.FC<NewProblemModalProps> = ({ onClose, onSubmit }) => {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ProblemPriority>('Medium');
  const [category, setCategory] = useState('Business Applications');
  const [team, setTeam] = useState('Infrastructure');
  const [agent, setAgent] = useState('Ken Yang');
  const [monitoredService, setMonitoredService] = useState('Microsoft Teams');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    onSubmit({
      summary: summary.trim(),
      description: description.trim() || 'No additional details provided.',
      priority,
      category,
      team,
      agent,
      monitoredServices: [monitoredService],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#eb6a47]/10 text-[#eb6a47] flex items-center justify-center font-bold text-sm">
              !
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Log New Problem Ticket</h2>
              <p className="text-[11px] text-slate-500">Create a root cause investigation record</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Summary / Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Issues with Teams performance across tenancy"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#eb6a47] focus:ring-1 focus:ring-[#eb6a47]/20 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Detailed Symptoms / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe recurring symptoms, affected users, and error patterns..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#eb6a47] focus:ring-1 focus:ring-[#eb6a47]/20 text-slate-800 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProblemPriority)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#eb6a47] bg-white text-slate-800"
              >
                <option value="Critical">🔴 Critical (P1)</option>
                <option value="High">🟠 High (P2)</option>
                <option value="Medium">🟡 Medium (P3)</option>
                <option value="Low">🟢 Low (P4)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#eb6a47] bg-white text-slate-800"
              >
                <option value="Business Applications">Business Applications</option>
                <option value="Email & Messaging">Email & Messaging</option>
                <option value="Identity & Access">Identity & Access</option>
                <option value="Network Infrastructure">Network Infrastructure</option>
                <option value="Cloud Platform">Cloud Platform</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Team</label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#eb6a47] bg-white text-slate-800"
              >
                <option value="Infrastructure">Infrastructure</option>
                <option value="Cloud Ops">Cloud Ops</option>
                <option value="Security & Identity">Security & Identity</option>
                <option value="2nd Line Support">2nd Line Support</option>
                <option value="Database Engineering">Database Engineering</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Agent</label>
              <input
                type="text"
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#eb6a47] text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Monitored Service CI</label>
            <input
              type="text"
              value={monitoredService}
              onChange={(e) => setMonitoredService(e.target.value)}
              placeholder="e.g. Microsoft Teams"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#eb6a47] text-slate-800"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!summary.trim()}
              className="px-5 py-2 rounded-xl bg-[#eb6a47] hover:bg-[#d65736] text-white font-bold transition-all disabled:opacity-50 shadow-sm"
            >
              Create Problem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
