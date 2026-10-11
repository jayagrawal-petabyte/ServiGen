import React, { useState } from 'react';
import type { MajorIncident, UserRole, IncidentUpdate } from '../types/majorIncident.types';
import PriorityBadge from './PriorityBadge';

interface IncidentDetailPanelProps {
  incident: MajorIncident;
  role: UserRole;
  onClose: () => void;
  onAdvanceStage: (incidentId: string) => void;
  onAddUpdate: (incidentId: string, update: IncidentUpdate) => void;
}

const STAGE_ORDER = ['Started', 'Escalated', 'Diagnosed', 'Mitigated', 'Resolved', 'Closed'];

export const IncidentDetailPanel: React.FC<IncidentDetailPanelProps> = ({
  incident,
  role,
  onClose,
  onAdvanceStage,
  onAddUpdate,
}) => {
  const [updateText, setUpdateText] = useState('');

  const activeStageIndex = incident.lifecycleStages.findIndex((s) => s.isActive);
  const isClosed = incident.lifecycleStages[5]?.isCompleted;
  const canAdvance = (role === 'Manager' || role === 'Admin') && !isClosed && activeStageIndex !== -1 && activeStageIndex < STAGE_ORDER.length - 1;

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateText.trim()) return;

    const now = new Date().toLocaleString('en-GB', {
      hour12: true,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newUpdate: IncidentUpdate = {
      id: `u-${Date.now()}`,
      timestamp: now,
      author: role === 'Admin' ? 'Admin User' : role === 'Manager' ? 'Manager User' : 'Support Agent',
      authorRole: role,
      type: 'comment',
      content: updateText.trim(),
    };

    onAddUpdate(incident.id, newUpdate);
    setUpdateText('');
  };

  return (
    <aside className="w-96 shrink-0 border-l border-gray-200 bg-white flex flex-col shadow-xl overflow-hidden font-sans">
      {/* Panel Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold bg-cyan-500 text-white px-2 py-0.5 rounded-full">
              #{incident.id}
            </span>
            <PriorityBadge priority={incident.priority} />
          </div>
          <h2 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
            {incident.title}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          aria-label="Close details"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Key Info */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
          <div>
            <span className="text-gray-400 block text-[10px] font-medium uppercase tracking-wider">Product</span>
            <span className="font-semibold text-gray-700">{incident.product}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] font-medium uppercase tracking-wider">Assignee</span>
            <span className="font-semibold text-gray-700">{incident.assignee}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] font-medium uppercase tracking-wider">Resolution Target</span>
            <span className={incident.resolutionTarget.startsWith('-') ? 'text-red-500 font-semibold' : 'text-gray-700 font-semibold'}>
              {incident.resolutionTarget}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] font-medium uppercase tracking-wider">Response Target</span>
            <span className="text-gray-700 font-semibold">{incident.responseTarget}</span>
          </div>
        </div>

        {/* Lifecycle Stages */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Lifecycle Stages</h3>
            <span className="text-[11px] font-medium text-cyan-600">
              {isClosed ? 'Closed' : activeStageIndex !== -1 ? STAGE_ORDER[activeStageIndex] : 'In Progress'}
            </span>
          </div>

          <div className="space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
            {incident.lifecycleStages.map((stage, idx) => (
              <div key={stage.label} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      stage.isCompleted
                        ? 'bg-green-500'
                        : stage.isActive
                        ? 'bg-cyan-500 ring-2 ring-cyan-200'
                        : 'bg-gray-300'
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      stage.isActive ? 'text-cyan-700 font-bold' : stage.isCompleted ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {idx + 1}. {stage.label}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {stage.timestamp || (stage.isCompleted ? 'Done' : stage.isActive ? 'Active' : 'Pending')}
                </span>
              </div>
            ))}
          </div>

          {canAdvance && (
            <button
              onClick={() => onAdvanceStage(incident.id)}
              className="w-full mt-2 py-2 px-3 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Advance to next stage: {STAGE_ORDER[activeStageIndex + 1]}</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {!canAdvance && !isClosed && (
            <p className="text-[10px] text-gray-400 text-center italic mt-1">
              {role === 'Agent' ? 'Switch role to Manager or Admin above to advance stages.' : ''}
            </p>
          )}
        </div>

        {/* Updates / Activity timeline */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Incident Updates ({incident.updates?.length ?? 0})
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {(!incident.updates || incident.updates.length === 0) ? (
              <p className="text-xs text-gray-400 py-2 italic text-center">No updates posted yet.</p>
            ) : (
              incident.updates.map((up) => (
                <div key={up.id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-gray-700">{up.author} ({up.authorRole})</span>
                    <span className="text-[10px] text-gray-400">{up.timestamp}</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-[11px]">{up.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Post Update Form */}
        <form onSubmit={handlePostUpdate} className="space-y-2 pt-2 border-t border-gray-100">
          <label className="text-xs font-semibold text-gray-700 block">Post New Update</label>
          <textarea
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            placeholder="Add a progress update or note…"
            rows={2}
            className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 resize-none"
          />
          <button
            type="submit"
            disabled={!updateText.trim()}
            className="w-full py-1.5 px-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
          >
            Submit Update
          </button>
        </form>
      </div>
    </aside>
  );
};

export default IncidentDetailPanel;
