import React, { useState, useRef } from 'react';
import { ProblemItem, ProblemLogEntry, ProblemStage } from './types/problem.types';

interface ProblemDetailViewProps {
  problem: ProblemItem;
  onBack: () => void;
  onUpdateProblem: (updated: ProblemItem) => void;
  onAddLog: (author: string, content: string, type?: ProblemLogEntry['type']) => void;
}

const STAGES: ProblemStage[] = ['Investigation', 'Workaround', 'Known Error Review', 'Resolved'];

export const ProblemDetailView: React.FC<ProblemDetailViewProps> = ({
  problem,
  onBack,
  onUpdateProblem,
  onAddLog,
}) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'cis' | 'viewLog' | 'notifLog'>('progress');
  const [newNote, setNewNote] = useState('');
  const [showReassignDropdown, setShowReassignDropdown] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState(`Update on Problem [${problem.prefixId}]: ${problem.summary}`);
  const [emailBody, setEmailBody] = useState('');
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  const handleStageClick = (stage: ProblemStage) => {
    const updated: ProblemItem = {
      ...problem,
      currentStage: stage,
      status: stage === 'Resolved' ? 'Resolved' : stage === 'Workaround' ? 'Workaround' : stage === 'Known Error Review' ? 'Known Error' : 'Investigation',
    };
    onUpdateProblem(updated);
    onAddLog('Ken Yang', `Problem lifecycle stage advanced to: ${stage}`, 'stage_change');
  };

  const handleCauseIdentified = () => {
    const updated: ProblemItem = {
      ...problem,
      causeStatus: 'Identified',
    };
    onUpdateProblem(updated);
    onAddLog('Ken Yang', 'Root Cause Identified: Technical RCA confirmed and documented.', 'cause_update');
  };

  const handleCauseUnknown = () => {
    const updated: ProblemItem = {
      ...problem,
      causeStatus: 'Unknown',
    };
    onUpdateProblem(updated);
    onAddLog('Ken Yang', 'Cause Unknown: Ongoing telemetry diagnostics and packet capture in progress.', 'cause_update');
  };

  const handleReassign = (newAgent: string, newTeam: string) => {
    const initials = newAgent.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    const updated: ProblemItem = {
      ...problem,
      agent: newAgent,
      agentInitials: initials,
      team: newTeam,
    };
    onUpdateProblem(updated);
    onAddLog('Ken Yang', `Problem reassigned to ${newAgent} (${newTeam})`, 'reassign');
    setShowReassignDropdown(false);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddLog('Ken Yang', newNote.trim(), 'note');
    setNewNote('');
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailBody.trim()) return;
    onAddLog('Ken Yang', `Email sent to ${problem.endUser.name} (${problem.endUser.organisation}): "${emailSubject}" - ${emailBody}`, 'note');
    setEmailBody('');
    setShowEmailModal(false);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-slate-50 overflow-y-auto font-sans select-text">
      {/* ── Top Bar: Breadcrumb & Quick Actions ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Back to Problems list"
          >
            ←
          </button>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="hover:text-slate-800 cursor-pointer" onClick={onBack}>
              Problems
            </span>
            <span>›</span>
            <span className="hover:text-slate-800 cursor-pointer" onClick={onBack}>
              Problem
            </span>
            <span>›</span>
            <span className="text-slate-900 font-bold">{problem.id}</span>
          </div>
        </div>

        {/* Action Button Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCauseIdentified}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              problem.causeStatus === 'Identified'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-200'
            }`}
          >
            <span>✔</span>
            <span>Cause Identified</span>
          </button>

          <button
            type="button"
            onClick={handleCauseUnknown}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              problem.causeStatus === 'Unknown'
                ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-200'
            }`}
          >
            <span>⊘</span>
            <span>Cause Unknown</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#eb6a47] transition-all cursor-pointer"
          >
            <span>✉</span>
            <span>Email User</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('progress');
              setTimeout(() => noteInputRef.current?.focus(), 50);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#eb6a47] transition-all cursor-pointer"
          >
            <span>📝</span>
            <span>Add Note</span>
          </button>

          {/* Re-Assign Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowReassignDropdown(!showReassignDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span>👥</span>
              <span>Re-Assign</span>
            </button>
            {showReassignDropdown && (
              <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-40 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Team / Agent
                </div>
                {[
                  { name: 'Ken Yang', team: 'Infrastructure' },
                  { name: 'Alex Rivera', team: 'Cloud Ops' },
                  { name: 'Marcus Vance', team: 'Security & Identity' },
                  { name: 'Sarah Jenkins', team: '2nd Line Support' },
                ].map((member) => (
                  <button
                    key={member.name}
                    type="button"
                    onClick={() => handleReassign(member.name, member.team)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700"
                  >
                    <span className="font-semibold">{member.name}</span>
                    <span className="text-[10px] text-slate-400">{member.team}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Detail Console ── */}
      <div className="p-6 space-y-5 flex-1 max-w-[1600px] w-full mx-auto">
        {/* Ticket Header & Title */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold shrink-0 mt-0.5">
              !
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                [{problem.prefixId}]
              </span>
              <h1 className="text-lg font-bold text-slate-900 leading-snug">{problem.summary}</h1>
            </div>
          </div>

          {/* ITIL Lifecycle Chevron Pipeline */}
          <div className="flex items-center overflow-x-auto gap-1 py-1">
            {STAGES.map((stg, idx) => {
              const currentIdx = STAGES.indexOf(problem.currentStage);
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={stg}
                  type="button"
                  onClick={() => handleStageClick(stg)}
                  className={`flex-1 min-w-[130px] flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isCurrent
                      ? 'bg-[#eb6a47] text-white border-[#d65736] shadow-sm'
                      : isPast
                      ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
                      : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                  title={`Set stage to ${stg}`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{idx + 1}.</span>
                    <span>{stg}</span>
                  </span>
                  {isCurrent && <span className="text-[10px] bg-white/30 px-1.5 py-0.5 rounded-full">Active</span>}
                  {isPast && <span className="text-emerald-600 text-sm">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3-Column Ticket Information Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Column 1: Tabs & Activity / Notes Console (6 Cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            {/* Console Tab Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 pt-3 bg-slate-50/50">
              <div className="flex items-center gap-6 text-xs font-bold">
                {[
                  { id: 'progress', label: 'Progress' },
                  { id: 'cis', label: `Child Ticket CIs (${problem.childCis.length})` },
                  { id: 'viewLog', label: `View Log (${problem.logs.length})` },
                  { id: 'notifLog', label: 'Notification Log' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-3 border-b-2 transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-[#eb6a47] text-[#eb6a47]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Body */}
            <div className="p-5 space-y-4">
              {activeTab === 'progress' && (
                <>
                  {/* Activity Feed Items */}
                  <div className="space-y-3">
                    {problem.logs.map((log) => (
                      <div key={log.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#13273e] text-white flex items-center justify-center font-bold text-[10px]">
                              {log.author[0]}
                            </span>
                            <span className="font-bold text-slate-800">{log.author}</span>
                            {log.badge && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {log.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">{log.timestamp}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{log.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Note / Workaround Composer */}
                  <form onSubmit={handleAddNoteSubmit} className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Add Problem Note / Workaround Update</label>
                    <textarea
                      ref={noteInputRef}
                      rows={3}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Post a diagnostic update, root cause insight, or permanent fix notes..."
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#eb6a47] focus:ring-1 focus:ring-[#eb6a47]/20 resize-none text-slate-800"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newNote.trim()}
                        className="px-4 py-2 bg-[#13273e] hover:bg-[#0c1a2b] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        Post Note
                      </button>
                    </div>
                  </form>
                </>
              )}

              {activeTab === 'cis' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 mb-3">Linked Configuration Items from CMDB affected by this problem:</p>
                  {problem.childCis.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No specific CIs linked yet.</p>
                  ) : (
                    problem.childCis.map((ci) => (
                      <div key={ci.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{ci.name}</span>
                          <span className="text-[11px] text-slate-400 block">{ci.type} ({ci.id})</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ci.status === 'Operational'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {ci.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'viewLog' && (
                <div className="space-y-2 text-xs">
                  {problem.logs.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="text-slate-700">{log.content}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'notifLog' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-600">
                  <p className="font-semibold text-slate-800">Stakeholder Broadcasts & Escalation Alerts</p>
                  <p>• Automated alert sent to Infrastructure On-Call roster via email & webhook.</p>
                  <p>• Daily summary digest published to Service Operations workspace.</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Ticket Information (3 Cols) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              Ticket Information
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Date Reported</span>
                <span className="font-semibold text-slate-800">{problem.dateReported}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Ticket Type</span>
                <span className="font-semibold text-[#eb6a47]">{problem.type}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Workflow</span>
                <span className="font-semibold text-[#eb6a47]">{problem.workflow}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block mb-1">Status</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#14532d] text-white">
                  {problem.status}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block mb-1">Team / Assigned Agent</span>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1e3a2f] text-white text-[10px] font-bold flex items-center justify-center">
                    {problem.agentInitials}
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 block leading-tight">{problem.agent}</span>
                    <span className="text-[10px] text-slate-400">{problem.team}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Additional Agents</span>
                <span className="text-slate-600">Not set</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Time Recorded</span>
                <span className="font-semibold text-slate-800">{problem.timeRecorded}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Impact</span>
                <span className="font-semibold text-rose-600">{problem.impact}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Root Cause Status</span>
                <span
                  className={`font-bold inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] ${
                    problem.causeStatus === 'Identified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : problem.causeStatus === 'Unknown'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {problem.causeStatus || 'Under Investigation'}
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: End-User & AI Insights (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* End-User Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                End-User Details
              </h3>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                  {problem.endUser.initials}
                </span>
                <div>
                  <span className="font-bold text-slate-900 block">{problem.endUser.name}</span>
                  <span className="text-[10px] text-slate-400">{problem.endUser.organisation}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Site: </span>
                  <span className="font-semibold text-slate-700">{problem.endUser.site}</span>
                </div>
                <div>
                  <span className="text-slate-400">Phone: </span>
                  <span className="font-semibold text-slate-700">{problem.endUser.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400">Preferred: </span>
                  <span className="font-semibold text-slate-700">{problem.endUser.preferredNumber}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                  Monitored Services
                </span>
                <div className="flex flex-wrap gap-1">
                  {problem.monitoredServices.map((svc) => (
                    <span
                      key={svc}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Suggested Articles Panel */}
            <div className="bg-[#13273e] rounded-2xl p-4 text-white shadow-lg space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✨</span>
                  <span className="font-bold">AI Suggested Articles</span>
                </div>
                <span className="text-[10px] text-slate-400">Knowledge Base</span>
              </div>

              <div className="space-y-2">
                {[
                  { title: 'Emails not Sending', tag: 'SMTP' },
                  { title: 'Troubleshooting: Laptop Slowness & Audio', tag: 'Teams' },
                  { title: 'Resolving Leave Request Issues', tag: 'HR' },
                  { title: 'Team Assignment Rules & Roster', tag: 'Workflow' },
                ].map((art) => (
                  <div
                    key={art.title}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer flex items-center justify-between group"
                    onClick={() => {
                      onAddLog('Ken Yang', `Attached knowledge base reference article: "${art.title}"`, 'note');
                    }}
                    title="Click to reference in problem logs"
                  >
                    <span className="text-[11px] text-slate-200 group-hover:text-white font-medium truncate mr-2">
                      {art.title}
                    </span>
                    <span className="text-[9px] bg-[#eb6a47] text-white px-1.5 py-0.5 rounded font-bold">
                      {art.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email User Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Email User / Stakeholders</h3>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="space-y-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">To</label>
                <input
                  type="text"
                  disabled
                  value={`${problem.endUser.name} <${problem.endUser.organisation}>`}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Message</label>
                <textarea
                  rows={4}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Provide status update on the problem investigation..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!emailBody.trim()}
                  className="px-4 py-2 bg-[#eb6a47] text-white font-bold rounded-xl hover:bg-[#d65736] disabled:opacity-50"
                >
                  Send Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
