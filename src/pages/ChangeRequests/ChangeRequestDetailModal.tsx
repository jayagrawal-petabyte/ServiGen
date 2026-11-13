import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ChangeRequest, SubTask, ChangeStatus, CabVote, RiskQuestionnaire, RiskLevel } from '../../types/cmdb';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getChangeStatusVariant } from '../../utils/statusUtils';
import { useAuth } from '../Auth/AuthContext';
import {
  X,
  Clock,
  Tag,
  User,
  CheckSquare,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Check,
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

  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'cab' | 'implementation' | 'rollback' | 'pir'>('overview');
  const [cabNote, setCabNote] = useState(changeRequest?.cabReview?.cabNotes || '');
  const [voteChoice, setVoteChoice] = useState<'Approved' | 'Rejected'>('Approved');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // 1. Interactive 4-Question Risk Assessment State
  const [riskAnswers, setRiskAnswers] = useState<RiskQuestionnaire>(() => {
    return changeRequest?.cabReview?.riskQuestionnaire || {
      causesDowntime: changeRequest?.risk === 'Critical' || changeRequest?.risk === 'High',
      testedInStaging: changeRequest?.risk !== 'Critical',
      hasRollbackScript: Boolean(changeRequest?.rollbackPlan?.steps?.length),
      inMaintenanceWindow: !changeRequest?.freezeWindowConflict,
    };
  });

  const calculatedRiskScore = useMemo(() => {
    let score = 1;
    if (riskAnswers.causesDowntime) score += 3;
    if (!riskAnswers.testedInStaging) score += 3;
    if (!riskAnswers.hasRollbackScript) score += 2;
    if (!riskAnswers.inMaintenanceWindow) score += 1;
    return Math.min(score, 9);
  }, [riskAnswers]);

  const calculatedRiskLevel: RiskLevel = useMemo(() => {
    if (calculatedRiskScore >= 7) return 'Critical';
    if (calculatedRiskScore >= 5) return 'High';
    if (calculatedRiskScore >= 3) return 'Medium';
    return 'Low';
  }, [calculatedRiskScore]);

  // 2. CAB Voting Audit Trail State
  const [votes, setVotes] = useState<CabVote[]>(() => {
    if (changeRequest?.cabReview?.votes && changeRequest.cabReview.votes.length > 0) {
      return changeRequest.cabReview.votes;
    }
    return [
      {
        id: 'vote-1',
        voterName: 'Alice Approver',
        voterRole: 'System Manager',
        decision: changeRequest?.status === 'Approved' ? 'Approved' : 'Approved',
        note: 'Staging verification passed and rollback playbook confirmed.',
        timestamp: '12/11/2026, 04:15 PM',
      },
      {
        id: 'vote-2',
        voterName: 'Sarah Support',
        voterRole: 'Team Lead',
        decision: 'Approved',
        note: 'Support team briefed on failover contingencies.',
        timestamp: '12/11/2026, 04:45 PM',
      },
    ];
  });

  if (!changeRequest) return null;

  const stages = [
    {
      label: 'Draft',
      active: changeRequest.status === 'Draft',
      completed: changeRequest.status !== 'Draft',
    },
    {
      label: 'CAB Approval',
      active: changeRequest.status === 'Pending Approval',
      completed: ['Approved', 'Scheduled', 'In Progress', 'Active', 'Completed'].includes(changeRequest.status),
    },
    {
      label: 'Scheduled',
      active: changeRequest.status === 'Scheduled',
      completed: ['In Progress', 'Active', 'Completed'].includes(changeRequest.status),
    },
    {
      label: 'Implementation',
      active: changeRequest.status === 'In Progress' || changeRequest.status === 'Active',
      completed: changeRequest.status === 'Completed',
    },
    {
      label: 'Review & Closed',
      active: changeRequest.status === 'Completed',
      completed: changeRequest.status === 'Completed',
    },
  ];

  const handleApprove = () => {
    if (!onChangeStatus) return;
    if (changeRequest.status === 'On Hold') {
      setActionMessage('Changes cannot be approved while on hold. Resubmit for approval first.');
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }
    onChangeStatus('Approved');
    setActionMessage('Change request approved.');
    setTimeout(() => setActionMessage(null), 2500);
  };

  const handleReject = () => {
    if (!onChangeStatus) return;
    onChangeStatus('Rejected');
    setActionMessage('Change request rejected.');
    setTimeout(() => setActionMessage(null), 2500);
  };

  const handleSubmitVote = () => {
    if (!isApproverOrAdmin) {
      setActionMessage('Only Approver or Administrator accounts can cast a CAB vote.');
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }

    const newVote: CabVote = {
      id: `vote-${Date.now()}`,
      voterName: user?.fullName || 'Alice Approver',
      voterRole: user?.role || 'CAB Approver',
      decision: voteChoice,
      note: cabNote.trim() || (voteChoice === 'Approved' ? 'Approved without additional conditions.' : 'Rejected per review requirements.'),
      timestamp: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };

    setVotes((prev) => [newVote, ...prev]);
    if (voteChoice === 'Approved') {
      handleApprove();
    } else {
      handleReject();
    }
    setCabNote('');
    setActionMessage(`Vote recorded: ${voteChoice} by ${newVote.voterName}`);
    setTimeout(() => setActionMessage(null), 3000);
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

        {actionMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between">
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Prominent Change Freeze Window Alert Banner */}
        {changeRequest.freezeWindowConflict && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-start gap-3 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs uppercase tracking-wide text-amber-950 flex items-center gap-1.5">
                  Production Change Freeze Active
                </h4>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full border border-amber-300">
                  BLACKOUT RESTRICTION
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                This change is scheduled during an active <strong>Company-Wide Change Freeze Period</strong>. Standard deployments are blocked; only Emergency changes with explicit Executive CAB authorization can proceed.
              </p>
            </div>
          </div>
        )}

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 mx-6 mt-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Risk Level</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${
                calculatedRiskLevel === 'Critical'
                  ? 'bg-rose-600'
                  : calculatedRiskLevel === 'High'
                  ? 'bg-amber-500'
                  : calculatedRiskLevel === 'Medium'
                  ? 'bg-yellow-400'
                  : 'bg-emerald-500'
              }`} />
              <span className="font-bold text-slate-800">{calculatedRiskLevel}</span>
              <span className="text-[10px] text-slate-400">({calculatedRiskScore}/9)</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Progress</span>
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
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Start Date</span>
            <span className="font-semibold text-slate-800 truncate block">{changeRequest.scheduledStart}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[10px]">Hours</span>
            <span className="font-bold text-slate-800">{changeRequest.timeSpentHours}h spent / {changeRequest.targetHours}h plan</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#eb6a47] text-[#eb6a47]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('risk')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'risk'
                ? 'border-[#eb6a47] text-[#eb6a47]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Risk Assessment
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
            CAB Review ({votes.length})
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
            Tasks ({changeRequest.subtasks.length})
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
            Rollback Plan
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
                    <Tag className="w-3.5 h-3.5 text-slate-400" /> Linked CI
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
                    <User className="w-3.5 h-3.5 text-slate-400" /> Assigned Owner
                  </span>
                  <span className="font-bold text-slate-900 text-sm block">{changeRequest.agentName}</span>
                  <span className="text-slate-500 text-[10px]">Platform Operations</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase">Workflow State Transition</h4>
                  <span className="text-[10px] text-slate-500 font-medium">Lifecycle Actions</span>
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
                          Submit for Approval →
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
                            Mark Completed ✓
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
                          Resubmit for Approval
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-4">
              {/* Dynamic Score Header Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-sm text-slate-900">Interactive Risk Assessment Questionnaire</h3>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Answer the 4 risk parameters below to dynamically recalculate the change impact score.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Calculated Profile</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          calculatedRiskLevel === 'Critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : calculatedRiskLevel === 'High'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : calculatedRiskLevel === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {calculatedRiskLevel} Risk
                      </span>
                      <span className="font-extrabold text-sm text-slate-800">
                        {calculatedRiskScore} / 9
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Questions Checklist Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Q1: User Downtime */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  riskAnswers.causesDowntime ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">1. Will this change cause user downtime?</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Impacts live customer services or staff availability.</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      riskAnswers.causesDowntime ? 'bg-rose-200 text-rose-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {riskAnswers.causesDowntime ? '+3 Risk' : '0 Risk'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setRiskAnswers((prev) => ({ ...prev, causesDowntime: false }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        !riskAnswers.causesDowntime ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      No (Zero Downtime)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRiskAnswers((prev) => ({ ...prev, causesDowntime: true }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        riskAnswers.causesDowntime ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Yes (Causes Downtime)
                    </button>
                  </div>
                </div>

                {/* Q2: Staging Testing */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  !riskAnswers.testedInStaging ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">2. Has the change been tested in staging?</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Pre-production validation and test scripts executed.</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      !riskAnswers.testedInStaging ? 'bg-rose-200 text-rose-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {!riskAnswers.testedInStaging ? '+3 Risk' : '0 Risk'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setRiskAnswers((prev) => ({ ...prev, testedInStaging: true }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        riskAnswers.testedInStaging ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Yes (Fully Tested)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRiskAnswers((prev) => ({ ...prev, testedInStaging: false }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        !riskAnswers.testedInStaging ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      No (Untested / Partial)
                    </button>
                  </div>
                </div>

                {/* Q3: Automated Rollback */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  !riskAnswers.hasRollbackScript ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">3. Is there an automated rollback script?</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Single-command rollback or documented failover playbook.</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      !riskAnswers.hasRollbackScript ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {!riskAnswers.hasRollbackScript ? '+2 Risk' : '0 Risk'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setRiskAnswers((prev) => ({ ...prev, hasRollbackScript: true }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        riskAnswers.hasRollbackScript ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Yes (Automated)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRiskAnswers((prev) => ({ ...prev, hasRollbackScript: false }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        !riskAnswers.hasRollbackScript ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      No (Manual / None)
                    </button>
                  </div>
                </div>

                {/* Q4: Maintenance Window */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  !riskAnswers.inMaintenanceWindow ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">4. Within approved maintenance window?</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Scheduled in standard low-traffic change window.</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      !riskAnswers.inMaintenanceWindow ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {!riskAnswers.inMaintenanceWindow ? '+1 Risk' : '0 Risk'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setRiskAnswers((prev) => ({ ...prev, inMaintenanceWindow: true }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        riskAnswers.inMaintenanceWindow ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Yes (In Window)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRiskAnswers((prev) => ({ ...prev, inMaintenanceWindow: false }))}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        !riskAnswers.inMaintenanceWindow ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      No (Out of Window)
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Risk Guidance Policy */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                calculatedRiskLevel === 'Critical'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : calculatedRiskLevel === 'High'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : calculatedRiskLevel === 'Medium'
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="font-extrabold block">Policy Enforcement:</span>
                    <span>
                      {calculatedRiskLevel === 'Critical'
                        ? 'Critical Changes require Emergency CAB Quorum and VP of Infrastructure approval before proceeding.'
                        : calculatedRiskLevel === 'High'
                        ? 'High Risk Changes require at least 2 Approver votes and verified rollback execution test.'
                        : calculatedRiskLevel === 'Medium'
                        ? 'Medium Risk Changes require standard single-approver CAB authorization.'
                        : 'Low Risk Changes meet criteria for expedited or pre-approved standard implementation.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cab' && (
            <div className="space-y-4">
              {/* Board Review Summary Header */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Change Advisory Board Review</h3>
                      <p className="text-slate-500 text-xs">
                        CAB authorization is required before production deployment.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {changeRequest.freezeWindowConflict && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Freeze Override Required
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      changeRequest.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : changeRequest.status === 'Rejected'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      Status: {changeRequest.status === 'Approved' ? 'Approved' : changeRequest.status === 'Rejected' ? 'Rejected' : 'Pending Authorization'}
                    </span>
                  </div>
                </div>

                {/* Quorum Metric Row */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Quorum Votes:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {votes.filter((v) => v.decision === 'Approved').length} Approvals
                    </span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {votes.filter((v) => v.decision === 'Rejected').length} Rejections
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{votes.length} Board Votes Cast</span>
                </div>
              </div>

              {/* Authorizer Voting Action Box */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <h4 className="font-bold text-xs text-slate-800 uppercase mb-2 flex items-center justify-between">
                  <span>Cast Your CAB Vote</span>
                  <span className="text-[10px] text-slate-400 lowercase font-normal">as {user?.fullName || 'Alice Approver'} ({user?.role || 'Approver'})</span>
                </h4>

                {isApproverOrAdmin ? (
                  <div className="space-y-3">
                    {/* Vote Selector Buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setVoteChoice('Approved')}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          voteChoice === 'Approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-400/20'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Vote: Approve Change</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoteChoice('Rejected')}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          voteChoice === 'Rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-400 ring-2 ring-rose-400/20'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <X className="w-4 h-4 text-rose-600" />
                        <span>Vote: Reject Change</span>
                      </button>
                    </div>

                    {/* Review Note Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Vote Rationale & Conditions:
                      </label>
                      <textarea
                        rows={2}
                        value={cabNote}
                        onChange={(e) => setCabNote(e.target.value)}
                        placeholder="State technical justification, verification of rollback test, or reason for rejection..."
                        className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#eb6a47] bg-white resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="button"
                      onClick={handleSubmitVote}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2 text-white ${
                        voteChoice === 'Approved'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>Submit {voteChoice} Vote</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Only Approver or Administrator accounts can cast official CAB votes.</span>
                  </div>
                )}
              </div>

              {/* CAB Voting Record (Audit Trail Stream) */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                    CAB Voting Audit Trail ({votes.length})
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">Immutable audit record</span>
                </div>

                <div className="space-y-2.5">
                  {votes.map((vote) => (
                    <div
                      key={vote.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#13273e] text-white flex items-center justify-center text-[10px] font-bold">
                            {vote.voterName.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800">{vote.voterName}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-medium">({vote.voterRole})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 ${
                            vote.decision === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {vote.decision === 'Approved' ? '✓ Approved' : '✕ Rejected'}
                          </span>
                          <span className="text-[10px] text-slate-400">{vote.timestamp}</span>
                        </div>
                      </div>

                      {vote.note && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic">
                          "{vote.note}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'implementation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Implementation Plan</h3>
                  <p className="text-slate-500 text-xs">Tasks to be completed during the maintenance window.</p>
                </div>
                <span className="text-xs font-bold text-[#eb6a47]">
                  {changeRequest.subtasks.filter((s) => s.completed).length} / {changeRequest.subtasks.length} Completed
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
                    No subtasks defined.
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
                  <h3 className="font-bold text-sm text-slate-900">Rollback Procedure</h3>
                </div>
                <p className="text-slate-600 text-xs">
                  Contingency steps to execute if the change fails or causes unintended degradation.
                </p>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Trigger:</span>
                    <span className="text-rose-600 font-bold">&gt; 5% Error rate or elevated service latency</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Estimated Duration:</span>
                    <span className="font-mono font-bold text-slate-800">45 Minutes</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-700 mb-2">Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
                    <li>Revert DNS / load balancer target weight to previous stable replica.</li>
                    <li>Restore database snapshot if schema migrations were applied.</li>
                    <li>Verify application health check returns 200 OK across all instances.</li>
                    <li>Notify incident commander and escalate to on-call engineering.</li>
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
                  <h3 className="font-bold text-sm text-slate-900">Post-Implementation Review</h3>
                </div>
                <p className="text-slate-600 text-xs">
                  Review conducted after execution to capture findings and verify outcomes.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase mb-1">Status</span>
                    <span className="font-bold text-emerald-700">
                      {changeRequest.status === 'Completed' ? 'Completed successfully' : 'Pending change completion'}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase mb-1">Review Date</span>
                    <span className="font-semibold text-slate-800">{changeRequest.scheduledEnd}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Lessons Learned:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Document implementation findings or follow-up action items..."
                    className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#eb6a47] bg-white"
                  />
                </div>
              </div>
            </div>
          )}

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
