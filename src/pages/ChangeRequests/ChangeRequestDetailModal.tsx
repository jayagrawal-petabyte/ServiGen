import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ChangeRequest, SubTask, ChangeStatus, ChangeType, RiskLevel } from '../../types/cmdb';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getChangeStatusVariant } from '../../utils/statusUtils';
import { useAuth } from '../Auth/AuthContext';
import {
  X,
  Clock,
  Tag,
  User,
  CheckSquare,
  ClipboardList,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  FileCheck,
  Calendar,
  Layers,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface ChangeRequestDetailModalProps {
  changeRequest: ChangeRequest | null;
  onClose: () => void;
  onToggleSubtask?: (subtaskId: string) => void;
  onChangeStatus?: (status: ChangeStatus) => void;
}

export const ChangeRequestDetailModal: React.FC<ChangeRequestDetailModalProps> = ({
  changeRequest,
  onClose,
  onToggleSubtask,
  onChangeStatus,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isApproverOrAdmin = user?.role === 'Administrator' || user?.role === 'System Manager' || user?.role === 'Team Lead';

  const [activeTab, setActiveTab] = useState<'overview' | 'cab' | 'implementation' | 'rollback' | 'pir'>('overview');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [cabNote, setCabNote] = useState(changeRequest?.cabReview?.cabNotes || '');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (!changeRequest) return null;

  // ITIL Lifecycle Stages
  const stages: { label: string; active: boolean; completed: boolean }[] = [
    {
      label: 'Draft',
      active: changeRequest.status === 'Draft',
      completed: changeRequest.status !== 'Draft',
    },
    {
      label: 'CAB Approval',
      active: changeRequest.status === 'Pending Approval',
      completed: ['Approved', 'Scheduled', 'Active', 'In Progress', 'Completed'].includes(changeRequest.status),
    },
    {
      label: 'Scheduled',
      active: changeRequest.status === 'Scheduled',
      completed: ['Active', 'In Progress', 'Completed'].includes(changeRequest.status),
    },
    {
      label: 'Implementation',
      active: changeRequest.status === 'In Progress' || changeRequest.status === 'Active',
      completed: changeRequest.status === 'Completed',
    },
    {
      label: 'PIR & Closed',
      active: changeRequest.status === 'Completed',
      completed: changeRequest.status === 'Completed',
    },
  ];

  const handleApprove = () => {
    if (!onChangeStatus) return;
    if (changeRequest.status === 'On Hold') {
      setActionMessage('⚠️ Cannot approve directly from On Hold. Move to Pending Approval first.');
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }
    onChangeStatus('Approved');
    setActionMessage('✓ Change Request approved by CAB.');
    setTimeout(() => setActionMessage(null), 2500);
  };

  const handleReject = () => {
    if (!onChangeStatus) return;
    onChangeStatus('Rejected');
    setActionMessage('⚠️ Change Request marked as Rejected.');
    setTimeout(() => setActionMessage(null), 2500);
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
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col"
      >
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 rounded-t-3xl">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-sm font-extrabold text-[#eb6a47] font-mono">{changeRequest.id}</span>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                changeRequest.type === 'Emergency'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : changeRequest.type === 'Standard'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
              }`}>
                {changeRequest.type} Change
              </span>
              <StatusBadge label={changeRequest.status} variant={getChangeStatusVariant(changeRequest.status)} />
              {changeRequest.freezeWindowConflict && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold rounded-md flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Freeze Window Warning
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {changeRequest.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Security Alert Banner */}
        {actionMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <span>{actionMessage}</span>
          </div>
        )}

        {/* ITIL Lifecycle Stepper */}
        <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-200 flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
          {stages.map((stage, idx) => (
            <div key={stage.label} className="flex items-center gap-1.5 shrink-0">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  stage.completed
                    ? 'bg-emerald-600 text-white'
                    : stage.active
                    ? 'bg-[#eb6a47] text-white ring-2 ring-[#eb6a47]/30'
                    : 'bg-slate-300 text-slate-600'
                }`}
              >
                {stage.completed ? '✓' : idx + 1}
              </div>
              <span
                className={`font-semibold ${
                  stage.active ? 'text-[#eb6a47] font-bold' : stage.completed ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {stage.label}
              </span>
              {idx < stages.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </div>
          ))}
        </div>

        {/* Quick Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 mx-6 mt-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Risk Assessment</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${
                changeRequest.risk === 'Critical'
                  ? 'bg-rose-600'
                  : changeRequest.risk === 'High'
                  ? 'bg-amber-500'
                  : changeRequest.risk === 'Medium'
                  ? 'bg-yellow-400'
                  : 'bg-emerald-500'
              }`} />
              <span className="font-bold text-slate-800">{changeRequest.risk} Risk</span>
              <span className="text-[10px] text-slate-400">(Score: {changeRequest.riskScore || 5}/9)</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Implementation Progress</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#eb6a47] h-full rounded-full transition-all duration-300"
                  style={{ width: `${changeRequest.completionPercent}%` }}
                />
              </div>
              <span className="font-extrabold text-[#eb6a47]">{changeRequest.completionPercent}%</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Scheduled Window</span>
            <span className="font-semibold text-slate-800 truncate block">{changeRequest.scheduledStart}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Effort Budget</span>
            <span className="font-bold text-slate-800">{changeRequest.timeSpentHours}h spent / {changeRequest.targetHours}h plan</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#eb6a47] text-[#eb6a47]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Context
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cab')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cab'
                ? 'border-[#eb6a47] text-[#eb6a47]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            CAB & Approvals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('implementation')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'implementation'
                ? 'border-[#eb6a47] text-[#eb6a47]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Implementation Plan ({changeRequest.subtasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rollback')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rollback'
                ? 'border-[#eb6a47] text-[#eb6a47]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Rollback & Contingency
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pir')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pir'
                ? 'border-[#eb6a47] text-[#eb6a47]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Post-Implementation Review
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {changeRequest.linkedRequestId && (
                <div className="p-3.5 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      SR
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-cyan-800 uppercase tracking-wider block">
                        Originating Service Request
                      </span>
                      <span className="font-bold text-slate-900 text-sm">#{changeRequest.linkedRequestId}</span>
                      {changeRequest.linkedRequestSummary && (
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                          {changeRequest.linkedRequestSummary}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/requests?id=${changeRequest.linkedRequestId}`);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-cyan-100 text-cyan-700 font-bold text-xs rounded-xl border border-cyan-300 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>View Request</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase mb-1">Description & Scope</h3>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                  {changeRequest.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-400 font-bold uppercase block mb-1 flex items-center gap-1 text-[10px]">
                    <Tag className="w-3.5 h-3.5 text-slate-400" /> Linked Configuration Item (CI)
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{changeRequest.linkedCiName}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{changeRequest.linkedCiId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`/cmdb?search=${encodeURIComponent(changeRequest.linkedCiId)}`);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      View in CMDB
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-400 font-bold uppercase block mb-1 flex items-center gap-1 text-[10px]">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Assigned Change Owner
                  </span>
                  <span className="font-bold text-slate-900 text-sm block">{changeRequest.agentName}</span>
                  <span className="text-slate-500 text-[10px]">Platform Operations & Infrastructure</span>
                </div>
              </div>

              {/* Status State Transition Workflow */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase">Workflow State Transition</h4>
                  <span className="text-[10px] text-slate-500 font-medium">Enforced ITIL State Machine</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {onChangeStatus && (
                    <>
                      {changeRequest.status === 'Draft' && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus('Pending Approval')}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                        >
                          Submit for CAB Approval →
                        </button>
                      )}
                      {changeRequest.status === 'Approved' && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus('Scheduled')}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                        >
                          Schedule Change Window →
                        </button>
                      )}
                      {(changeRequest.status === 'Approved' || changeRequest.status === 'Scheduled') && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus('In Progress')}
                          className="px-3 py-1.5 rounded-xl bg-[#eb6a47] hover:bg-[#db5936] text-white font-bold text-xs cursor-pointer shadow-2xs"
                        >
                          Start Implementation →
                        </button>
                      )}
                      {(changeRequest.status === 'In Progress' || changeRequest.status === 'Active') && (
                        <>
                          <button
                            type="button"
                            onClick={() => onChangeStatus('Completed')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                          >
                            Mark Completed & Close ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => onChangeStatus('On Hold')}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer shadow-2xs"
                          >
                            Place On Hold
                          </button>
                        </>
                      )}
                      {changeRequest.status === 'On Hold' && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus('Pending Approval')}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                        >
                          Resubmit for CAB Approval
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cab' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-sm text-slate-900">Change Advisory Board (CAB) Assessment</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    changeRequest.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : changeRequest.status === 'Rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    CAB Decision: {changeRequest.status === 'Approved' ? 'Approved' : changeRequest.status === 'Rejected' ? 'Rejected' : 'Under Review'}
                  </span>
                </div>
                <p className="text-slate-600 text-xs">
                  Normal and Emergency changes require CAB authorization before scheduled deployment. Approvers evaluate business impact, outage risks, and rollback readiness.
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    CAB Review Notes & Deliberation:
                  </label>
                  <textarea
                    rows={3}
                    value={cabNote}
                    onChange={(e) => setCabNote(e.target.value)}
                    placeholder="Enter CAB committee meeting decisions, risk sign-off conditions, or rollback prerequisites..."
                    className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#eb6a47] bg-white"
                  />
                </div>
              </div>

              {/* Role-Gated Approver Controls */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                <h4 className="font-bold text-xs text-slate-800 uppercase mb-2">Authorizer Actions</h4>
                {isApproverOrAdmin ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={changeRequest.status === 'Approved'}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authorize & Approve Change</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={changeRequest.status === 'Rejected'}
                      className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Change</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>You are viewing this change as an Agent. Only users with <strong>Approver</strong> or <strong>Administrator</strong> roles can record CAB decisions.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'implementation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Implementation Plan & Work Breakdown</h3>
                  <p className="text-slate-500 text-xs">Execute change tasks in order with verification checks.</p>
                </div>
                <span className="text-xs font-bold text-[#eb6a47]">
                  {changeRequest.subtasks.filter((s) => s.completed).length} / {changeRequest.subtasks.length} Done
                </span>
              </div>

              <div className="space-y-2">
                {changeRequest.subtasks.map((task: SubTask) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleSubtask && onToggleSubtask(task.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      onToggleSubtask ? 'cursor-pointer hover:border-[#eb6a47]' : ''
                    } ${
                      task.completed
                        ? 'bg-slate-50 border-slate-200 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => onToggleSubtask && onToggleSubtask(task.id)}
                      className="w-4 h-4 text-[#eb6a47] rounded focus:ring-[#eb6a47] cursor-pointer"
                    />
                    <span className={`font-medium flex-1 ${task.completed ? 'line-through text-slate-400' : ''}`}>
                      {task.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{task.id}</span>
                  </div>
                ))}

                {changeRequest.subtasks.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    No subtasks defined yet. Standard change plan applies.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'rollback' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-sm text-slate-900">Rollback Procedure & Backout Plan</h3>
                </div>
                <p className="text-slate-600 text-xs">
                  Mandatory ITIL contingency plan in case implementation fails or breaches verification tolerances.
                </p>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Contingency Trigger Threshold:</span>
                    <span className="text-rose-600 font-bold">&gt; 5% Error Rate or Database Latency &gt; 250ms</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Estimated Backout Duration:</span>
                    <span className="font-mono font-bold text-slate-800">45 Minutes</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-700 mb-2">Backout Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
                    <li>Revert DNS / load balancer target weight to previous stable replica.</li>
                    <li>Execute database point-in-time snapshot restore if schema changes were applied.</li>
                    <li>Verify application health probe returns 200 OK across all instances.</li>
                    <li>Notify incident commander and escalate to On-Call engineering.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pir' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">Post-Implementation Review (PIR)</h3>
                </div>
                <p className="text-slate-600 text-xs">
                  Completed changes are formally reviewed to capture lessons learned, verify business objectives, and identify automation opportunities.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase mb-1">Outcome Status</span>
                    <span className="font-bold text-emerald-700">
                      {changeRequest.status === 'Completed' ? 'Successful — Objectives Achieved' : 'Pending Change Completion'}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase mb-1">Review Date</span>
                    <span className="font-semibold text-slate-800">{changeRequest.scheduledEnd}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Lessons Learned & Continuous Improvement:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Document implementation findings, unforeseen dependencies, or automation improvements for future iterations..."
                    className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#eb6a47] bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Window & Tags */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-slate-500 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                Window: <strong>{changeRequest.scheduledStart}</strong> to <strong>{changeRequest.scheduledEnd}</strong>
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {changeRequest.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold text-[10px]">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
