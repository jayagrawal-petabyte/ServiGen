import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProblemItem, ProblemLogEntry, ProblemStage } from './types/problem.types';
import { api } from '../../services/apiClient';

interface ProblemDetailViewProps {
  problem: ProblemItem;
  onBack: () => void;
  onUpdateProblem: (updated: ProblemItem) => void;
  onAddLog: (author: string, content: string, type?: ProblemLogEntry['type']) => void;
}

const STAGES: ProblemStage[] = ['Investigation', 'Workaround', 'Known Error Review', 'Resolved'];

const FALLBACK_INCIDENTS = [
  { id: '1024', summary: 'VPN Authentication Failures across EMEA', priority: 'High', status: 'In Progress', dateLogged: '17/05/2026' },
  { id: '1031', summary: 'Teams call drops during screen share', priority: 'Medium', status: 'Open', dateLogged: '17/05/2026' },
  { id: '1042', summary: 'Outlook SMTP timeout when sending attachments > 10MB', priority: 'High', status: 'In Progress', dateLogged: '16/05/2026' },
  { id: '1055', summary: 'Audio device disconnected during active conference call', priority: 'Low', status: 'Open', dateLogged: '16/05/2026' },
  { id: '1068', summary: 'Single Sign-On loop on enterprise intranet portal', priority: 'Critical', status: 'Open', dateLogged: '17/05/2026' },
  { id: '1072', summary: 'Database latency spike on payroll query execution', priority: 'Critical', status: 'In Progress', dateLogged: '15/05/2026' },
  { id: '1085', summary: 'Active Directory token expiration during mid-session SSO', priority: 'High', status: 'Open', dateLogged: '16/05/2026' },
];

export const ProblemDetailView: React.FC<ProblemDetailViewProps> = ({
  problem,
  onBack,
  onUpdateProblem,
  onAddLog,
}) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'linkedIncidents' | 'cis' | 'viewLog' | 'notifLog'>('progress');
  const [newNote, setNewNote] = useState('');
  const [showReassignDropdown, setShowReassignDropdown] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState(`Update on Problem [${problem.prefixId}]: ${problem.summary}`);
  const [emailBody, setEmailBody] = useState('');
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  // Link Incident Modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [incidentSearch, setIncidentSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Critical' | 'High' | 'Medium' | 'Low'>('All');
  const [availableIncidents, setAvailableIncidents] = useState<Array<{ id: string; summary: string; priority: string; status: string; dateLogged?: string }>>(FALLBACK_INCIDENTS);
  const [loadingIncidents, setLoadingIncidents] = useState(false);

  const fetchIncidents = async () => {
    setLoadingIncidents(true);
    try {
      const res = await api.get('/api/tickets');
      const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      if (raw.length > 0) {
        const mapped = raw.map((t: any) => ({
          id: String(t.id || ''),
          summary: t.summary || t.title || 'Incident ticket',
          priority: t.priority || 'Medium',
          status: t.status || 'Open',
          dateLogged: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recent',
        }));
        setAvailableIncidents(mapped);
      } else {
        setAvailableIncidents(FALLBACK_INCIDENTS);
      }
    } catch {
      setAvailableIncidents(FALLBACK_INCIDENTS);
    } finally {
      setLoadingIncidents(false);
    }
  };

  const handleOpenLinkModal = () => {
    setShowLinkModal(true);
    void fetchIncidents();
  };

  const handleLinkIncident = async (inc: { id: string; summary: string; priority: string; status: string; dateLogged?: string }) => {
    const current = problem.linkedIncidents || [];
    if (current.some((i) => i.id === inc.id)) return;
    try {
      await api.post(`/api/problems/${problem.id}/incidents`, { incidentId: inc.id });
    } catch {
      // offline fallback
    }
    const updated = {
      ...problem,
      linkedIncidents: [...current, inc],
    };
    onUpdateProblem(updated);
    onAddLog('Ken Yang', `Linked Incident #${inc.id} ("${inc.summary}") to problem investigation`, 'note');
  };

  const handleUnlinkIncident = async (incId: string) => {
    const current = problem.linkedIncidents || [];
    const target = current.find((i) => i.id === incId);
    try {
      await api.delete(`/api/problems/${problem.id}/incidents/${incId}`);
    } catch {
      // offline fallback
    }
    const updated = {
      ...problem,
      linkedIncidents: current.filter((i) => i.id !== incId),
    };
    onUpdateProblem(updated);
    onAddLog('Ken Yang', `Unlinked Incident #${incId} ${target ? `("${target.summary}")` : ''} from problem investigation`, 'note');
  };

  const filteredAvailableIncidents = useMemo(() => {
    const q = incidentSearch.trim().toLowerCase();
    return availableIncidents.filter((inc) => {
      const matchesQuery = !q || inc.id.toLowerCase().includes(q) || inc.summary.toLowerCase().includes(q);
      const matchesPriority = priorityFilter === 'All' || inc.priority.toLowerCase() === priorityFilter.toLowerCase();
      return matchesQuery && matchesPriority;
    });
  }, [availableIncidents, incidentSearch, priorityFilter]);

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
            <span className="text-slate-900 font-bold">{problem.prefixId || problem.id}</span>
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
            onClick={handleOpenLinkModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#eb6a47] text-white hover:bg-[#d65736] transition-all cursor-pointer shadow-2xs"
            title="Link Incident to this Problem investigation"
          >
            <span>🔗</span>
            <span>+ Link Incident</span>
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
              <div className="flex items-center gap-6 text-xs font-bold overflow-x-auto">
                {[
                  { id: 'progress', label: 'Progress' },
                  { id: 'linkedIncidents', label: `Linked Incidents (${problem.linkedIncidents?.length ?? 0})` },
                  { id: 'cis', label: `Child Ticket CIs (${problem.childCis.length})` },
                  { id: 'viewLog', label: `View Log (${problem.logs.length})` },
                  { id: 'notifLog', label: 'Notification Log' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
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
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
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
                        className="px-4 py-2 bg-[#eb6a47] hover:bg-[#d65736] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        Post Note
                      </button>
                    </div>
                  </form>
                </>
              )}

              {activeTab === 'linkedIncidents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Linked Incident Tickets ({problem.linkedIncidents?.length ?? 0})</h4>
                      <p className="text-[11px] text-slate-500">
                        Incidents associated with this root cause investigation. Resolving this problem can cascade workarounds or resolutions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenLinkModal}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#eb6a47] text-white hover:bg-[#d65736] transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <span>+ Link Incident</span>
                    </button>
                  </div>

                  {!problem.linkedIncidents || problem.linkedIncidents.length === 0 ? (
                    <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                      <p className="text-xs font-semibold text-slate-600">No Incidents Linked Yet</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Link related incidents experiencing this failure pattern to track blast radius and coordinate communication.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenLinkModal}
                        className="mt-2 px-3 py-1.5 text-xs font-bold text-[#eb6a47] bg-white border border-[#eb6a47]/30 rounded-lg hover:bg-orange-50 cursor-pointer"
                      >
                        + Search &amp; Link Incidents
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {problem.linkedIncidents.map((inc) => (
                        <div
                          key={inc.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex items-center justify-between text-xs gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-[11px] shrink-0">
                              #{inc.id}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-slate-900 block truncate leading-snug">
                                {inc.summary}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span>Logged: {inc.dateLogged || 'Recent'}</span>
                                <span>•</span>
                                <span>Status: {inc.status}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inc.priority === 'Critical'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : inc.priority === 'High'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : inc.priority === 'Medium'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {inc.priority}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUnlinkIncident(inc.id)}
                              className="px-2 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                              title="Unlink this incident"
                            >
                              ✕ Unlink
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-amber-500 font-bold">✨</span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI Suggested Articles</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Knowledge Base</span>
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
                    className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100 transition-colors border border-slate-200/60 cursor-pointer flex items-center justify-between group"
                    onClick={() => {
                      onAddLog('Ken Yang', `Attached knowledge base reference article: "${art.title}"`, 'note');
                    }}
                    title="Click to reference in problem logs"
                  >
                    <span className="text-[11px] text-slate-700 group-hover:text-slate-900 font-semibold truncate mr-2">
                      {art.title}
                    </span>
                    <span className="text-[9px] bg-[#eb6a47]/10 text-[#eb6a47] border border-[#eb6a47]/20 px-1.5 py-0.5 rounded font-bold">
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

      {/* ── Link Incident Search Modal (ITSM-2) ── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#eb6a47] flex items-center justify-center font-bold text-sm">
                  🔗
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Link Incident to Problem</h3>
                  <p className="text-[11px] text-slate-500">
                    Associate related incidents with investigation <span className="font-semibold text-slate-700">[{problem.prefixId}]</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search and Filters Bar */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
                <input
                  type="text"
                  value={incidentSearch}
                  onChange={(e) => setIncidentSearch(e.target.value)}
                  placeholder="Search incidents by ID (#1024) or summary keyword..."
                  className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#eb6a47] focus:ring-1 focus:ring-[#eb6a47]/30 text-slate-800 placeholder-slate-400"
                  autoFocus
                />
                {incidentSearch && (
                  <button
                    type="button"
                    onClick={() => setIncidentSearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs w-4 h-4 rounded-full flex items-center justify-center"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Priority Badges Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">Priority:</span>
                {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      priorityFilter === p
                        ? 'bg-[#eb6a47] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {loadingIncidents && (
                  <span className="ml-auto text-[11px] text-slate-400 animate-pulse">Loading incidents...</span>
                )}
              </div>
            </div>

            {/* Incident List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100">
              {filteredAvailableIncidents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <p className="font-semibold text-slate-600">No matching incidents found</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try refining your search keyword or clearing the priority filter.</p>
                </div>
              ) : (
                filteredAvailableIncidents.map((inc) => {
                  const isLinked = (problem.linkedIncidents || []).some((i) => i.id === inc.id);
                  return (
                    <div
                      key={inc.id}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70 p-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-[11px] shrink-0">
                          #{inc.id}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate leading-snug">{inc.summary}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>Logged: {inc.dateLogged || 'Recent'}</span>
                            <span>•</span>
                            <span>Status: {inc.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inc.priority === 'Critical'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : inc.priority === 'High'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : inc.priority === 'Medium'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {inc.priority}
                        </span>

                        {isLinked ? (
                          <span className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span>✓</span>
                            <span>Linked</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleLinkIncident(inc)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#eb6a47] hover:bg-[#d65736] text-white transition-all cursor-pointer shadow-2xs"
                          >
                            + Link
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>{filteredAvailableIncidents.length} incidents found</span>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
