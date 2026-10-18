import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MajorIncident, UserRole, IncidentUpdate, Priority } from '../types/majorIncident.types';
import PriorityBadge from './PriorityBadge';
import { useAuth } from '../../Auth/AuthContext';
import { MOCK_ORGANISATION_USERS } from '../../Auth/mockAuthData';
import { mockConfigurationItems } from '../../../data/mockCmdbData';

interface IncidentDetailPanelProps {
  incident: MajorIncident;
  role: UserRole;
  onClose: () => void;
  onAdvanceStage: (incidentId: string) => void;
  onStepBackStage?: (incidentId: string) => void;
  onSetStage?: (incidentId: string, stageIndex: number) => void;
  onReopen?: (incidentId: string) => void;
  onAddUpdate: (incidentId: string, update: IncidentUpdate) => void;
  onReassign?: (incidentId: string, newAssignee: string) => void;
  onUpdatePriority?: (incidentId: string, newPriority: Priority) => void;
  onUpdateProduct?: (incidentId: string, newProduct: string) => void;
}

const STAGE_ORDER = ['Started', 'Escalated', 'Diagnosed', 'Mitigated', 'Resolved', 'Closed'] as const;

export const IncidentDetailPanel: React.FC<IncidentDetailPanelProps> = ({
  incident,
  role,
  onClose,
  onAdvanceStage,
  onStepBackStage,
  onSetStage,
  onReopen,
  onAddUpdate,
  onReassign,
  onUpdatePriority,
  onUpdateProduct,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserName = user?.fullName || 'Inesh Agarwal';
  const [updateText, setUpdateText] = useState('');
  const [isCustomAssignee, setIsCustomAssignee] = useState(false);
  const [customAssigneeInput, setCustomAssigneeInput] = useState('');
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [customProductInput, setCustomProductInput] = useState(incident.product);

  const activeStageIndex = incident.lifecycleStages.findIndex((s) => s.isActive);
  const isClosed = incident.lifecycleStages[5]?.isCompleted || activeStageIndex === 5;
  const isPrivileged = role === 'Manager' || role === 'Admin';
  const canAdvance = isPrivileged && !isClosed && activeStageIndex !== -1 && activeStageIndex < STAGE_ORDER.length - 1;
  const canStepBack = isPrivileged && activeStageIndex > 0;

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
      author: currentUserName,
      authorRole: role,
      type: 'comment',
      content: updateText.trim(),
    };

    onAddUpdate(incident.id, newUpdate);
    setUpdateText('');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (customProductInput.trim() && onUpdateProduct) {
      onUpdateProduct(incident.id, customProductInput.trim());
    }
    setIsEditingProduct(false);
  };

  return (
    <aside className="w-[430px] shrink-0 border-l border-gray-200 bg-white flex flex-col shadow-2xl overflow-hidden font-sans z-20 animate-in slide-in-from-right duration-200">
      {/* ── Panel Header ── */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 bg-[#fbfcfd]">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-mono font-bold bg-[#13273e] text-white px-2 py-0.5 rounded-md shadow-2xs">
              #{incident.id}
            </span>

            {/* Editable Priority for Admin */}
            {role === 'Admin' && onUpdatePriority ? (
              <select
                value={incident.priority}
                onChange={(e) => onUpdatePriority(incident.id, e.target.value as Priority)}
                className="bg-white border border-gray-300 rounded px-2 py-0.5 text-[10px] font-bold text-gray-800 outline-none focus:border-cyan-400 cursor-pointer shadow-2xs"
                title="Change Priority"
              >
                <option value="Critical">Critical (P1)</option>
                <option value="High">High (P2)</option>
                <option value="Medium">Medium (P3)</option>
                <option value="Low">Low (P4)</option>
              </select>
            ) : (
              <PriorityBadge priority={incident.priority} />
            )}

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              role === 'Admin'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : role === 'Manager'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {role}
            </span>
          </div>

          <h2 className="text-sm font-bold text-gray-900 leading-snug">
            {incident.title}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0 text-xs font-semibold"
          aria-label="Close details"
          title="Close details (Esc)"
        >
          ✕
        </button>
      </div>

      {/* ── Panel Body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Key Info Cards */}
        <div className="grid grid-cols-2 gap-2.5 p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-xs">
          {/* Commander / Assignee */}
          <div>
            <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center justify-between">
              Commander
              {role === 'Admin' && <span className="text-[9px] text-cyan-600 font-bold lowercase">(edit)</span>}
            </span>
            {role === 'Admin' && onReassign ? (
              isCustomAssignee ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="text"
                    value={customAssigneeInput}
                    onChange={(e) => setCustomAssigneeInput(e.target.value)}
                    placeholder="Name…"
                    className="w-full text-xs border border-cyan-400 rounded px-1.5 py-0.5 outline-none bg-white"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (customAssigneeInput.trim()) {
                        onReassign(incident.id, customAssigneeInput.trim());
                      }
                      setIsCustomAssignee(false);
                    }}
                    className="text-[10px] bg-[#13273e] text-white font-bold px-2 py-0.5 rounded shrink-0"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsCustomAssignee(false)}
                    className="text-[10px] text-gray-400 hover:text-gray-600 px-1 shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <select
                  value={incident.assignee}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomAssignee(true);
                      setCustomAssigneeInput('');
                    } else {
                      onReassign(incident.id, e.target.value);
                    }
                  }}
                  className="mt-0.5 w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs font-semibold text-gray-800 outline-none focus:border-cyan-400 truncate"
                >
                  <option value={incident.assignee}>{incident.assignee} (Current)</option>
                  <option value="Unassigned">Unassigned</option>
                  <optgroup label="Organisation Agents">
                    {MOCK_ORGANISATION_USERS.map((u) => (
                      <option key={u.id} value={u.fullName}>
                        {u.fullName} ({u.role})
                      </option>
                    ))}
                  </optgroup>
                  <option value="__custom__">+ Enter custom name…</option>
                </select>
              )
            ) : (
              <span className="font-semibold text-gray-800 block truncate mt-0.5">{incident.assignee}</span>
            )}
          </div>

          {/* Current State / Quick Stage Selector */}
          <div>
            <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center justify-between">
              State
              {isPrivileged && <span className="text-[9px] text-cyan-600 font-bold lowercase">(set)</span>}
            </span>
            {isPrivileged && onSetStage ? (
              <select
                value={activeStageIndex !== -1 ? activeStageIndex : (isClosed ? 5 : 0)}
                onChange={(e) => onSetStage(incident.id, Number(e.target.value))}
                className="mt-0.5 w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs font-semibold text-gray-800 outline-none focus:border-cyan-400 truncate cursor-pointer"
                title="Change incident lifecycle stage"
              >
                {STAGE_ORDER.map((stageName, idx) => (
                  <option key={stageName} value={idx}>
                    {idx + 1}. {stageName} {activeStageIndex === idx ? '✓' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-[#13273e] block truncate mt-0.5">
                {isClosed ? 'Closed' : activeStageIndex !== -1 ? STAGE_ORDER[activeStageIndex] : 'Started'}
              </span>
            )}
          </div>

          {/* Product / CI */}
          <div>
            <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center justify-between">
              Product / CI
              {role === 'Admin' && <span className="text-[9px] text-cyan-600 font-bold lowercase">(edit)</span>}
            </span>
            {role === 'Admin' && onUpdateProduct ? (
              isEditingProduct ? (
                <form onSubmit={handleSaveProduct} className="flex items-center gap-1 mt-0.5">
                  <input
                    type="text"
                    value={customProductInput}
                    onChange={(e) => setCustomProductInput(e.target.value)}
                    className="w-full text-xs border border-cyan-400 rounded px-1.5 py-0.5 outline-none bg-white"
                    autoFocus
                  />
                  <button type="submit" className="text-[10px] bg-[#13273e] text-white px-1.5 py-0.5 rounded font-bold">OK</button>
                  <button type="button" onClick={() => setIsEditingProduct(false)} className="text-[10px] text-gray-400 px-1">✕</button>
                </form>
              ) : (
                <div className="flex items-center justify-between mt-0.5">
                  <span
                    onClick={() => setIsEditingProduct(true)}
                    className="font-semibold text-gray-800 truncate cursor-pointer hover:text-cyan-700"
                    title="Click to edit CI"
                  >
                    {incident.product}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/cmdb')}
                    className="text-[9px] text-cyan-600 hover:text-cyan-800 font-bold ml-1 shrink-0"
                  >
                    CMDB →
                  </button>
                </div>
              )
            ) : (
              <span className="font-semibold text-gray-800 truncate block mt-0.5">{incident.product}</span>
            )}
          </div>

          {/* Resolution SLA */}
          <div>
            <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Resolution SLA</span>
            <span className={`font-semibold block truncate mt-0.5 ${incident.resolutionTarget.startsWith('-') ? 'text-rose-600 font-bold' : 'text-gray-800'}`}>
              {incident.resolutionTarget}
            </span>
          </div>
        </div>

        {/* ── Lifecycle Stage Progression & Controls ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Lifecycle Stages
            </h3>
            <span className="text-[11px] font-semibold text-cyan-600">
              {isClosed ? 'Closed' : activeStageIndex !== -1 ? `${activeStageIndex + 1} of 6: ${STAGE_ORDER[activeStageIndex]}` : 'In Progress'}
            </span>
          </div>

          {/* Interactive Stage Pipeline / Chevron Steps */}
          <div className="space-y-1.5 bg-gray-50/90 p-2.5 rounded-xl border border-gray-100">
            {incident.lifecycleStages.map((stage, idx) => {
              const isPast = stage.isCompleted;
              const isCurr = stage.isActive;
              return (
                <div
                  key={stage.label}
                  onClick={() => {
                    if (isPrivileged && onSetStage) {
                      onSetStage(incident.id, idx);
                    }
                  }}
                  className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                    isCurr
                      ? 'bg-[#13273e] text-white font-bold border-[#13273e] shadow-2xs'
                      : isPast
                      ? 'bg-emerald-50/70 border-emerald-100 text-gray-700 hover:bg-emerald-100/60'
                      : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-100/70'
                  } ${isPrivileged ? 'cursor-pointer hover:border-cyan-300' : ''}`}
                  title={isPrivileged ? `Click to jump incident to Stage ${idx + 1}: ${stage.label}` : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isCurr
                          ? 'bg-cyan-400 ring-2 ring-white/40'
                          : isPast
                          ? 'bg-emerald-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    <span className="font-semibold">
                      {idx + 1}. {stage.label}
                    </span>
                    {isCurr && (
                      <span className="text-[9px] bg-cyan-400/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] shrink-0 ${isCurr ? 'text-gray-300' : 'text-gray-400'}`}>
                    {stage.timestamp || (isPast ? 'Done' : 'Pending')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stage Action Buttons: Advance, Step Back, Reopen */}
          {isPrivileged ? (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                {/* Step Back button */}
                <button
                  type="button"
                  disabled={!canStepBack}
                  onClick={() => onStepBackStage && onStepBackStage(incident.id)}
                  className="py-1.5 px-3 bg-white hover:bg-gray-50 border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1 active:scale-95"
                  title={canStepBack ? `Step back to ${STAGE_ORDER[activeStageIndex - 1]}` : 'At initial stage'}
                >
                  <span>← Step Back</span>
                </button>

                {/* Advance Stage button */}
                <button
                  type="button"
                  disabled={!canAdvance}
                  onClick={() => onAdvanceStage(incident.id)}
                  className="py-1.5 px-3 bg-[#13273e] hover:bg-[#0c1a2b] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1 active:scale-95"
                  title={canAdvance ? `Advance to ${STAGE_ORDER[activeStageIndex + 1]}` : 'Incident completed'}
                >
                  <span>Advance Stage →</span>
                </button>
              </div>

              {/* Reopen button when closed */}
              {isClosed && onReopen && (
                <button
                  type="button"
                  onClick={() => onReopen(incident.id)}
                  className="w-full py-1.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>↺ Reopen Incident (Reset to Started)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-center">
              <p className="text-[11px] font-medium text-gray-500">
                🔒 Stage progression requires <strong>Manager</strong> or <strong>Admin</strong> role.
              </p>
            </div>
          )}
        </div>

        {/* ── Timeline Updates Feed ── */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Timeline Updates ({incident.updates?.length ?? 0})
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">Real-time Feed</span>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {!incident.updates || incident.updates.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 italic text-center border border-dashed border-gray-200 rounded-lg">
                No updates posted yet. Post a note below.
              </p>
            ) : (
              incident.updates.map((up) => {
                const isStageChange = up.type === 'stage_change';
                return (
                  <div
                    key={up.id}
                    className={`p-2.5 rounded-lg border text-xs transition-all ${
                      isStageChange
                        ? 'bg-cyan-50/60 border-cyan-100 text-cyan-950'
                        : 'bg-gray-50/70 border-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-gray-700 flex items-center gap-1">
                        {up.author}
                        {up.authorRole && (
                          <span className="text-[9px] font-normal text-gray-400">({up.authorRole})</span>
                        )}
                      </span>
                      <span className="text-[10px] text-gray-400">{up.timestamp}</span>
                    </div>
                    <p className="leading-relaxed text-[11px] text-gray-700">{up.content}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Post New Update Form ── */}
        <form onSubmit={handlePostUpdate} className="space-y-2 pt-2 border-t border-gray-100">
          <label className="text-xs font-semibold text-gray-700 block">
            Post Real-Time Update
          </label>
          <textarea
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            placeholder="Add a progress update, note, or handover comment…"
            rows={2}
            className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 resize-none bg-white text-gray-800"
          />
          <button
            type="submit"
            disabled={!updateText.trim()}
            className="w-full py-1.5 px-3 bg-[#13273e] hover:bg-[#0c1a2b] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            Post Update
          </button>
        </form>
      </div>
    </aside>
  );
};

export default IncidentDetailPanel;
