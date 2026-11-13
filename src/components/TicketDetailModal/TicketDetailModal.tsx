import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Mail, MessageSquarePlus, UserCheck, CalendarPlus, Truck, CheckCircle,
  X, ChevronDown, ChevronRight, MessageCircle, Copy, Download,
  User, Zap, FileText, Phone, MapPin, Building2, Lightbulb,
  AlertCircle, ArrowRight,
} from 'lucide-react';
import { type FullTicket, type TicketPriority, type TicketNote } from './ticketDetails.data';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TicketDetailModalProps {
  ticket: {
    id: string;
    type?: string;
    summary?: string;
    agent?: string;
    priority?: TicketPriority;
    status?: string;
    description?: string;
    requester?: string;
    department?: string;
    category?: string;
    createdAt?: string;
    targetSla?: string;
    notes?: TicketNote[];
    site?: string;
    organisationName?: string;
    email?: string;
    phoneNumber?: string;
    preferredNumber?: string;
    isAgent?: boolean;
    timeTaken?: string;
    fromTicketId?: string;
    actionTitle?: string;
    contactAddress?: string[];
    assets?: Array<{ id: string; type: string; icon: 'workstation' | 'phone' | 'monitor' | 'laptop' }>;
    projectId?: string;
    projectName?: string;
    workflowName?: string;
    createdBy?: string;
    executionDate?: string;
    slaTime?: string;
    assignedTeam?: string;
    responseTarget?: string;
    resolutionTarget?: string;
    responseTargetMet?: boolean;
    resolutionTargetMet?: boolean;
    pipelineStage?: string;
    pipelineDate?: string;
    additionalAgents?: string;
    timeRecorded?: string;
    budgetType?: string;
  } | null;
  currentUser?: string;
  variant?: 'incident' | 'sla';
  aiRisk?: 'High Risk' | 'At Risk' | 'Normal';
  aiRiskScore?: number;
  onEscalateToTier2?: () => void;
  isEscalating?: boolean;
  isEscalated?: boolean;
  onClose: () => void;
  onUpdateTicket?: (updated: FullTicket) => void;
}

// ─── Status badge colour map ──────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  New:               { bg: '#14532d', color: '#fff' },
  'In Progress':     { bg: '#1e3a8a', color: '#fff' },
  'On Hold':         { bg: '#6b7280', color: '#fff' },
  'Pending Approval':{ bg: '#7c3aed', color: '#fff' },
  Resolved:          { bg: '#15803d', color: '#fff' },
  Closed:            { bg: '#374151', color: '#fff' },
  Draft:             { bg: '#1e3a8a', color: '#fff' },
  Approved:          { bg: '#14532d', color: '#fff' },
  Scheduled:         { bg: '#0369a1', color: '#fff' },
  Rejected:          { bg: '#b91c1c', color: '#fff' },
  'Change Overdue':  { bg: '#b45309', color: '#fff' },
};

function getStatusBadge(s?: string) {
  return STATUS_BADGE[s ?? ''] ?? { bg: '#374151', color: '#fff' };
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ─── Halo-style SLA Card ─────────────────────────────────────────────────────

function SlaClock({ seconds }: { seconds: number }) {
  const [secs, setSecs] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setSecs(s => s - 1), 1000);
    return () => clearInterval(id);
  }, []);
  const abs = Math.abs(secs);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const neg = secs < 0 ? '-' : '';
  if (h > 0) return <>{neg}{h}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</>;
  return <>{neg}{m}:{String(s).padStart(2,'0')}</>;
}

function SlaCard({ ticket }: { ticket: NonNullable<TicketDetailModalProps['ticket']> }) {
  // Parse a rough seconds-remaining from targetSla / slaTime strings
  const rawSla = (ticket as any).slaTime || ticket.targetSla || '';
  let initSecs = 3 * 3600; // default 3h
  const hm = rawSla.match(/(\d+)\s*h\s*(\d+)?\s*m?/i);
  if (hm) initSecs = parseInt(hm[1]) * 3600 + (hm[2] ? parseInt(hm[2]) * 60 : 0);
  const overdue = rawSla.toLowerCase().includes('overdue') || rawSla.toLowerCase().includes('breach') || initSecs < 0;
  if (overdue) initSecs = -1920; // -32 min display

  const priority = ticket.priority || 'Medium';
  const responseDate = ticket.responseTarget || ticket.createdAt || 'Target not set';
  const resolutionDate = ticket.resolutionTarget || ticket.targetSla || 'Target not set';
  const responseMet = (ticket as any).responseTargetMet !== false;
  const resolutionMet = (ticket as any).resolutionTargetMet === true;

  return (
    <div style={{
      width: 240, flexShrink: 0,
      borderRadius: 8, overflow: 'hidden',
      border: '1px solid #d1fae5',
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    }}>
      {/* Green header */}
      <div style={{ background: '#16a34a', padding: '8px 12px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Incident SLA
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#d1fae5', marginTop: 1 }}>{priority}</div>
      </div>
      {/* Red countdown */}
      <div style={{ background: '#dc2626', padding: '8px 12px', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
          <SlaClock seconds={initSecs} />
        </div>
      </div>
      {/* Targets */}
      <div style={{ background: '#f9fafb', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#374151' }}>
          <span>Response Target: <span style={{ fontWeight: 600 }}>{responseDate}</span></span>
          <span style={{
            width: 18, height: 18, borderRadius: '50%',
            background: responseMet ? '#16a34a' : '#dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 10, flexShrink: 0,
          }}>{responseMet ? '✓' : '✗'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#374151' }}>
          <span>Resolution Target: <span style={{ fontWeight: 600 }}>{resolutionDate}</span></span>
          <span style={{
            width: 18, height: 18, borderRadius: '50%',
            background: resolutionMet ? '#16a34a' : '#dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 10, flexShrink: 0,
          }}>{resolutionMet ? '✓' : '✗'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Lifecycle Chevron Row ────────────────────────────────────────────────────

function PipelineChevrons({ stage, date, status }: { stage?: string; date?: string; status?: string }) {
  const activeLabel = stage || 'Request Fulfilment';
  const activeDate = date || '';
  const isClosed = (status || '').toLowerCase() === 'closed' || (status || '').toLowerCase() === 'resolved';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 0 }}>
      {/* Active stage — blue filled chevron */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#3b82f6', color: '#fff',
        padding: '8px 20px 8px 14px',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)',
        fontSize: 12, fontWeight: 700, minWidth: 160,
        lineHeight: 1.3,
      }}>
        <div>
          <div>{activeLabel}</div>
          {activeDate && <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.85 }}>{activeDate}</div>}
        </div>
      </div>
      {/* Closed stage — grey chevron */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: isClosed ? '#9ca3af' : '#e5e7eb',
        color: isClosed ? '#fff' : '#9ca3af',
        padding: '8px 20px 8px 20px',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)',
        fontSize: 12, fontWeight: 600, marginLeft: -2,
        lineHeight: 1.3,
      }}>
        Closed
      </div>
    </div>
  );
}

// ─── Activity Feed Entry ──────────────────────────────────────────────────────

function ActivityEntry({ note, ticketStatus }: { note: TicketNote; ticketStatus?: string }) {
  const badge = getStatusBadge(ticketStatus || 'New');
  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 8,
      padding: '14px 16px', marginBottom: 10,
      background: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#dc2626', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          {getInitials(note.author)}
        </div>
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{note.author}</span>
              <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 6 }}>Opened</span>
            </div>
            <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 12 }}>{note.time}</span>
          </div>
          {/* Status badge */}
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700,
            padding: '1px 8px', borderRadius: 4,
            background: badge.bg, color: badge.color,
            marginBottom: 8,
          }}>
            {ticketStatus || 'New'}
          </span>
          <p style={{
            margin: 0, fontSize: 13, color: '#1d4ed8', lineHeight: 1.6,
            fontStyle: 'normal',
          }}>
            {note.text}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type TabId = 'progress' | 'ai-insights' | 'additional-fields' | 'audit-log' | 'view-log' | 'notification-log';

const TABS: { id: TabId; label: string }[] = [
  { id: 'progress',           label: 'Progress' },
  { id: 'ai-insights',        label: 'AI Insights' },
  { id: 'additional-fields',  label: 'Additional Fields' },
  { id: 'audit-log',          label: 'Audit Log' },
  { id: 'view-log',           label: 'View Log' },
  { id: 'notification-log',   label: 'Notification Log' },
];

// Mocked "other open tickets" to show in sidebar
const OTHER_TICKETS = [
  { date: '01/09/2026', id: '3995', title: 'Emails not Sending', status: 'Draft' },
  { date: '29/08/2026', id: '2183', title: 'Firewall Change', status: 'Approved' },
  { date: '29/08/2026', id: '2184', title: 'Printer Installation', status: 'Scheduled' },
  { date: '29/08/2026', id: '2186', title: 'Addition of a New Server', status: 'Rejected' },
  { date: '28/08/2026', id: '2193', title: 'Security Concern – Possible Virus', status: 'Change Overdue' },
];

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  onUpdateTicket,
  aiRisk,
  aiRiskScore,
  onEscalateToTier2,
  isEscalating,
  isEscalated,
  currentUser = 'Adam Admin',
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('progress');
  const [noteText, setNoteText] = useState('');
  const [localNotes, setLocalNotes] = useState<TicketNote[]>([]);
  const [localStatus, setLocalStatus] = useState(ticket?.status || 'New');
  const [isResolved, setIsResolved] = useState(false);
  const [endUserOpen, setEndUserOpen] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticket) {
      setLocalNotes(ticket.notes?.length ? [...ticket.notes] : [{
        id: 'seed-1',
        author: ticket.requester || 'End User',
        time: ticket.createdAt || new Date().toLocaleString(),
        text: ticket.description || 'No description provided.',
      }]);
      setLocalStatus(ticket.status || 'New');
      setIsResolved(ticket.status === 'Resolved' || ticket.status === 'Closed');
    }
  }, [ticket]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  if (!ticket) return null;

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    setLocalNotes(prev => [
      { id: `n-${Date.now()}`, author: currentUser, time: new Date().toLocaleString(), text: noteText.trim() },
      ...prev,
    ]);
    setNoteText('');
    setShowAddNote(false);
  };

  const handleResolve = () => {
    setLocalStatus('Resolved');
    setIsResolved(true);
    if (onUpdateTicket) onUpdateTicket({ ...(ticket as FullTicket), status: 'Resolved' });
  };

  const priorityNum = ticket.priority === 'Critical' ? 1 : ticket.priority === 'High' ? 2 : ticket.priority === 'Medium' ? 3 : ticket.priority === 'Low' ? 4 : 3;

  // ── AI Insights content ──────────────────────────────────────────────────
  const aiSummary = `User reports issue with ${ticket.category || 'their request'}. ${ticket.description ? ticket.description.slice(0, 120) + (ticket.description.length > 120 ? '...' : '') : 'No additional details provided.'}`;

  // ── Audit log entries ────────────────────────────────────────────────────
  const auditEntries = [
    { actor: ticket.requester || 'End User', action: 'Ticket created', time: ticket.createdAt || 'Earlier' },
    { actor: ticket.agent || 'System', action: 'Assigned to agent', time: 'Recently' },
    ...(isEscalated ? [{ actor: currentUser, action: 'Escalated to Tier 2', time: 'Just now' }] : []),
    ...(isResolved ? [{ actor: currentUser, action: 'Ticket resolved', time: 'Just now' }] : []),
  ];

  // ── Styles ───────────────────────────────────────────────────────────────
  const css = `
    @keyframes haloSlideIn { from { opacity:0; transform:translateY(-6px) scale(0.98); } to { opacity:1; transform:none; } }
    .halo-action-btn {
      display:inline-flex; align-items:center; gap:5px;
      padding:7px 13px; font-size:12.5px; font-weight:600;
      border:none; cursor:pointer; white-space:nowrap;
      background:#f0f4f8; color:#1e293b;
      border-right:1px solid #dee5ef;
      transition:background 0.12s;
    }
    .halo-action-btn:hover { background:#dde5f0; }
    .halo-action-btn.resolve { background:#16a34a; color:#fff; border-right:none; }
    .halo-action-btn.resolve:hover { background:#15803d; }
    .halo-tab {
      padding:9px 14px; font-size:13px; font-weight:500;
      border:none; background:none; cursor:pointer; color:#6b7280;
      border-bottom:2px solid transparent; transition:all 0.13s;
    }
    .halo-tab.active { color:#111827; border-bottom-color:#2563eb; font-weight:600; }
    .halo-tab:hover:not(.active) { color:#374151; }
    .halo-ai-row { margin-bottom:16px; }
    .halo-ai-label { font-size:11px; color:#9ca3af; margin-bottom:3px; }
    .halo-ai-value { font-size:13.5px; color:#111827; font-weight:400; }
    .halo-sidebar-field { margin-bottom:14px; }
    .halo-sidebar-field-label { font-size:11px; color:#9ca3af; margin-bottom:4px; }
    .halo-sidebar-field-value { font-size:13px; color:#111827; font-weight:400; }
    .halo-other-ticket { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; padding:7px 0; border-bottom:1px solid #f0f0f0; cursor:pointer; }
    .halo-other-ticket:last-child { border-bottom:none; }
    .halo-textarea { width:100%; min-height:80px; padding:9px 11px; font-size:13px; border:1px solid #d1d5db; border-radius:6px; resize:vertical; outline:none; font-family:inherit; color:#1e293b; box-sizing:border-box; }
    .halo-textarea:focus { border-color:#3b82f6; }
  `;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(10,20,40,0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <style>{css}</style>

      {/* ── Modal Shell ── */}
      <div style={{
        background: '#fff',
        borderRadius: 10,
        width: '100%', maxWidth: 1120,
        height: 'calc(100vh - 48px)', maxHeight: 820,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        animation: 'haloSlideIn 0.18s ease-out',
      }}>

        {/* ════════════════════════════════════════
            TOP ACTION BAR (Email User, Add Note…)
            ════════════════════════════════════════ */}
        <div style={{
          display: 'flex', alignItems: 'stretch',
          borderBottom: '1px solid #dee5ef',
          background: '#f8fafc', flexShrink: 0,
        }}>
          <button className="halo-action-btn" onClick={() => {}}>
            <Mail style={{ width: 14, height: 14, color: '#3b82f6' }} />
            Email User
          </button>
          <button className="halo-action-btn" onClick={() => setShowAddNote(a => !a)}>
            <MessageSquarePlus style={{ width: 14, height: 14, color: '#f59e0b' }} />
            Add Note
          </button>
          <button className="halo-action-btn" onClick={() => {}}>
            <UserCheck style={{ width: 14, height: 14, color: '#8b5cf6' }} />
            Re-Assign
          </button>
          <button className="halo-action-btn" onClick={() => {}}>
            <CalendarPlus style={{ width: 14, height: 14, color: '#10b981' }} />
            Create Appointme…
          </button>
          <button className="halo-action-btn" onClick={() => {}}>
            <Truck style={{ width: 14, height: 14, color: '#6b7280' }} />
            Log to Supplier
          </button>
          <button
            className="halo-action-btn resolve"
            onClick={handleResolve}
            disabled={isResolved}
            style={{ opacity: isResolved ? 0.7 : 1 }}
          >
            <CheckCircle style={{ width: 14, height: 14 }} />
            {isResolved ? 'Resolved ✓' : 'Resolve Ticket'}
          </button>

          {/* AI Escalation quick-badge (if present) */}
          {aiRisk === 'High Risk' && onEscalateToTier2 && !isEscalated && (
            <button
              className="halo-action-btn"
              onClick={onEscalateToTier2}
              disabled={isEscalating}
              style={{ background: '#fef2f2', color: '#dc2626', marginLeft: 'auto', borderRight: 'none', borderLeft: '1px solid #dee5ef' }}
            >
              <Zap style={{ width: 13, height: 13 }} />
              {isEscalating ? 'Escalating…' : '⚡ Escalate Tier 2'}
            </button>
          )}
          {isEscalated && (
            <span style={{ marginLeft: 'auto', padding: '0 14px', fontSize: 12, fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 5, borderLeft: '1px solid #dee5ef' }}>
              <CheckCircle style={{ width: 13, height: 13 }} /> Escalated to Tier 2
            </span>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', padding: '0 14px', border: 'none', background: 'none',
              cursor: 'pointer', color: '#9ca3af', fontSize: 18,
              borderLeft: '1px solid #dee5ef', display: 'flex', alignItems: 'center',
            }}
            title="Close (Esc)"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* ════════════════════════════════════════
            MAIN BODY — Left content + Right sidebar
            ════════════════════════════════════════ */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* ─── LEFT / MAIN CONTENT ─────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

            {/* Ticket header row (ID + summary + SLA card) */}
            <div style={{ padding: '16px 20px 12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                {/* Left: priority circle + ID + summary */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      border: '2px solid #22c55e', background: '#f0fdf4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#16a34a', flexShrink: 0,
                    }}>
                      {priorityNum}
                    </div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                      [{ticket.id}]
                    </h2>
                  </div>
                  <p style={{ margin: '0 0 0 40px', fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
                    {ticket.summary || `Ticket ${ticket.id}`}
                  </p>
                </div>
                {/* Right: SLA Card */}
                <SlaCard ticket={ticket} />
              </div>
            </div>

            {/* Pipeline Chevrons */}
            <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
              <PipelineChevrons
                stage={(ticket as any).pipelineStage || ticket.type || 'Request Fulfilment'}
                date={(ticket as any).pipelineDate || ticket.createdAt || ''}
                status={localStatus}
              />
            </div>

            {/* Add Note inline composer */}
            {showAddNote && (
              <div style={{ margin: '0 20px 10px', padding: '12px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7 }}>Add Work Note</div>
                <textarea
                  className="halo-textarea"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Type your note… (Ctrl+Enter to submit)"
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNote(); }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowAddNote(false)}
                    style={{ padding: '6px 14px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#374151' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    style={{ padding: '6px 14px', fontSize: 12, border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Post Note
                  </button>
                </div>
              </div>
            )}

            {/* Tab bar */}
            <div style={{
              display: 'flex', borderBottom: '1px solid #e5e7eb',
              padding: '0 16px', flexShrink: 0,
              overflowX: 'auto',
            }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`halo-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
              {/* Right-side icon buttons */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px' }}>
                <button title="New reply" onClick={() => setShowAddNote(true)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: 5, cursor: 'pointer', display: 'flex', color: '#6b7280' }}>
                  <MessageCircle style={{ width: 14, height: 14 }} />
                </button>
                <button title="Copy" style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: 5, cursor: 'pointer', display: 'flex', color: '#6b7280' }}>
                  <Copy style={{ width: 14, height: 14 }} />
                </button>
                <button title="Download" style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: 5, cursor: 'pointer', display: 'flex', color: '#6b7280' }}>
                  <Download style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            {/* Tab content — scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>

              {/* ── PROGRESS TAB ── */}
              {activeTab === 'progress' && (
                <div>
                  {localNotes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 13 }}>
                      No activity yet. Click "Add Note" to start the conversation.
                    </div>
                  ) : (
                    localNotes.map(note => (
                      <ActivityEntry key={note.id} note={note} ticketStatus={localStatus} />
                    ))
                  )}
                </div>
              )}

              {/* ── AI INSIGHTS TAB ── */}
              {activeTab === 'ai-insights' && (
                <div style={{ maxWidth: 680 }}>
                  <div className="halo-ai-row">
                    <div className="halo-ai-label">AI Generated Summary</div>
                    <div className="halo-ai-value">{aiSummary}</div>
                  </div>
                  <div className="halo-ai-row">
                    <div className="halo-ai-label">AI Suggested Priority</div>
                    <div className="halo-ai-value">{priorityNum}</div>
                  </div>
                  <div className="halo-ai-row">
                    <div className="halo-ai-label">AI Suggested Type</div>
                    <div className="halo-ai-value">{ticket.type || 'Service Request'}</div>
                  </div>
                  <div className="halo-ai-row">
                    <div className="halo-ai-label">AI Tonality</div>
                    <div className="halo-ai-value">Neutral</div>
                  </div>
                  <div className="halo-ai-row">
                    <div className="halo-ai-label">AI Suggested Resolution</div>
                    <div className="halo-ai-value" style={{ fontWeight: 700, marginBottom: 6 }}>Suggested Resolution &amp; Recommended Actions</div>
                    <div className="halo-ai-value" style={{ color: '#374151', fontSize: 13 }}>
                      Review the ticket description and verify with the requester. Check relevant KB articles and apply the standard resolution workflow for {ticket.category || 'this category'}. Escalate if SLA is approaching breach.
                    </div>
                  </div>
                  {aiRisk && (
                    <div className="halo-ai-row">
                      <div className="halo-ai-label">AI Escalation Risk</div>
                      <span style={{
                        display: 'inline-block', fontSize: 11, fontWeight: 700,
                        padding: '2px 10px', borderRadius: 20,
                        background: aiRisk === 'High Risk' ? '#fee2e2' : aiRisk === 'At Risk' ? '#fef3c7' : '#dcfce7',
                        color: aiRisk === 'High Risk' ? '#b91c1c' : aiRisk === 'At Risk' ? '#b45309' : '#15803d',
                      }}>
                        {aiRisk} {aiRiskScore !== undefined ? `(${aiRiskScore}/100)` : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── ADDITIONAL FIELDS TAB ── */}
              {activeTab === 'additional-fields' && (
                <div style={{ maxWidth: 500 }}>
                  {[
                    ['Reporter / Requester', ticket.requester],
                    ['Department', ticket.department],
                    ['Organisation', ticket.organisationName],
                    ['Site', ticket.site],
                    ['Phone', ticket.phoneNumber],
                    ['Email', ticket.email],
                    ['Priority', ticket.priority],
                    ['Created At', ticket.createdAt],
                    ['SLA Target', ticket.targetSla],
                    ['Project', (ticket as any).projectName],
                    ['Workflow', (ticket as any).workflowName],
                  ].filter(([, v]) => !!v).map(([label, value]) => (
                    <div key={String(label)} style={{ display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', width: 140, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: 13, color: '#111827' }}>{value as string}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── AUDIT LOG TAB ── */}
              {activeTab === 'audit-log' && (
                <div>
                  {auditEntries.map((entry, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: '#f3f4f6', border: '1px solid #e5e7eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 14 }}>
                          {i === 0 ? '🎫' : i === 1 ? '👤' : i === 2 ? '⚡' : '✅'}
                        </span>
                      </div>
                      <div style={{ paddingTop: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{entry.action}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{entry.actor} · {entry.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── VIEW LOG TAB ── */}
              {activeTab === 'view-log' && (
                <div style={{ color: '#6b7280', fontSize: 13, padding: '12px 0' }}>
                  <div style={{ marginBottom: 10, fontWeight: 600, color: '#374151' }}>View History</div>
                  <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#13273e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {getInitials(currentUser)}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{currentUser}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>Viewed just now</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── NOTIFICATION LOG TAB ── */}
              {activeTab === 'notification-log' && (
                <div style={{ color: '#6b7280', fontSize: 13, padding: '12px 0' }}>
                  <div style={{ marginBottom: 10, fontWeight: 600, color: '#374151' }}>Notifications sent for this ticket</div>
                  <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: '#374151' }}>Ticket Created — Email sent</div>
                    <div style={{ color: '#9ca3af', marginTop: 2 }}>Recipient: {ticket.requester || 'Requester'} · {ticket.createdAt || 'Earlier'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT SIDEBAR ─────────────────────────────────────── */}
          <div style={{
            width: 280, flexShrink: 0,
            borderLeft: '1px solid #e5e7eb',
            background: '#f9fafb',
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
          }}>

            {/* End-User Details (collapsible) */}
            <div style={{ borderBottom: '1px solid #e5e7eb' }}>
              <button
                onClick={() => setEndUserOpen(o => !o)}
                style={{
                  width: '100%', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, color: '#111827',
                }}
              >
                End-User details
                <ChevronDown style={{ width: 15, height: 15, color: '#9ca3af', transform: endUserOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {endUserOpen && ticket.requester && (
                <div style={{ padding: '0 16px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: '#eb6a47', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>
                      {getInitials(ticket.requester)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{ticket.requester}</div>
                      {ticket.organisationName && <div style={{ fontSize: 11, color: '#9ca3af' }}>{ticket.organisationName}</div>}
                    </div>
                  </div>
                  {ticket.site && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 5, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} /> {ticket.site}
                    </div>
                  )}
                  {ticket.email && (
                    <div style={{ fontSize: 12, color: '#2563eb', marginBottom: 5 }}>{ticket.email}</div>
                  )}
                  {ticket.phoneNumber && (
                    <div style={{ fontSize: 12, color: '#2563eb', marginBottom: 5 }}>{ticket.phoneNumber}</div>
                  )}
                  {ticket.preferredNumber && (
                    <div style={{ fontSize: 12, color: '#2563eb', marginBottom: 5 }}>{ticket.preferredNumber}</div>
                  )}
                  {/* Contact action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
                    <button style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      padding: '7px 12px', borderRadius: 20, border: 'none',
                      background: '#0ea5e9', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                      <Phone style={{ width: 12, height: 12 }} /> Call on Microsoft Teams
                    </button>
                    <button style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      padding: '7px 12px', borderRadius: 20, border: 'none',
                      background: '#0ea5e9', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                      <MessageCircle style={{ width: 12, height: 12 }} /> Message on Microsoft Teams
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Other Open Tickets */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Other Open Tickets</div>
              {OTHER_TICKETS.map(t => {
                const badge = getStatusBadge(t.status);
                return (
                  <div key={t.id} className="halo-other-ticket">
                    <div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{t.date}</div>
                      <div style={{ fontSize: 12, color: '#374151' }}>
                        <span style={{ color: '#9ca3af' }}>{t.id}</span>
                        {' – '}
                        <span style={{ color: '#2563eb', cursor: 'pointer' }}>{t.title}</span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                      background: badge.bg, color: badge.color, flexShrink: 0,
                    }}>
                      {t.status}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Ticket Information */}
            <div style={{ padding: '12px 16px', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Ticket information</div>

              <div className="halo-sidebar-field">
                <div className="halo-sidebar-field-label">Ticket Type</div>
                <div className="halo-sidebar-field-value" style={{ color: '#2563eb' }}>{ticket.type || 'Service Request'}</div>
              </div>

              {(ticket as any).workflowName && (
                <div className="halo-sidebar-field">
                  <div className="halo-sidebar-field-label">Workflow</div>
                  <div className="halo-sidebar-field-value" style={{ color: '#2563eb' }}>{(ticket as any).workflowName}</div>
                </div>
              )}

              <div className="halo-sidebar-field">
                <div className="halo-sidebar-field-label">Status</div>
                <span style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 700,
                  padding: '2px 10px', borderRadius: 4,
                  background: getStatusBadge(localStatus).bg,
                  color: getStatusBadge(localStatus).color,
                }}>
                  {localStatus}
                </span>
              </div>

              <div className="halo-sidebar-field">
                <div className="halo-sidebar-field-label">Team / Assigned Agent</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                  <User style={{ width: 18, height: 18, color: '#374151' }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{ticket.agent || 'Unassigned'}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{(ticket as any).assignedTeam || '1st Line Support'}</div>
                  </div>
                </div>
              </div>

              <div className="halo-sidebar-field">
                <div className="halo-sidebar-field-label">Additional Agents</div>
                <div className="halo-sidebar-field-value">{(ticket as any).additionalAgents || 'Not set'}</div>
              </div>

              <div className="halo-sidebar-field">
                <div className="halo-sidebar-field-label">Time Recorded</div>
                <div className="halo-sidebar-field-value">{(ticket as any).timeRecorded || (ticket as any).timeTaken || '00:00'}</div>
              </div>

              <div className="halo-sidebar-field">
                <div className="halo-sidebar-field-label">Category</div>
                <div className="halo-sidebar-field-value">{ticket.category || 'General Support'}</div>
              </div>

              {/* AI Insights sub-section in sidebar */}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Lightbulb style={{ width: 13, height: 13, color: '#f59e0b' }} /> AI Insights
                </div>
                <div className="halo-sidebar-field">
                  <div className="halo-sidebar-field-label">AI Auto Resolution</div>
                  <div className="halo-sidebar-field-value">No</div>
                </div>
                {aiRisk && (
                  <div className="halo-sidebar-field">
                    <div className="halo-sidebar-field-label">AI Risk Assessment</div>
                    <span style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 20,
                      background: aiRisk === 'High Risk' ? '#fee2e2' : aiRisk === 'At Risk' ? '#fef3c7' : '#dcfce7',
                      color: aiRisk === 'High Risk' ? '#b91c1c' : aiRisk === 'At Risk' ? '#b45309' : '#15803d',
                    }}>
                      {aiRisk}
                    </span>
                  </div>
                )}
                {/* AI Suggested Articles */}
                <div style={{ marginTop: 10 }}>
                  <div className="halo-sidebar-field-label" style={{ marginBottom: 6 }}>AI Suggested Articles</div>
                  {[
                    'Upgrading Desktop Hardware Components',
                    'Setting Up a New Desktop for Employee',
                    'Upgrading to Latest Application Version',
                    'Increasing Email Storage Quota',
                  ].map((article, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 7px', marginBottom: 4,
                      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6,
                      cursor: 'pointer',
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 4,
                        background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <FileText style={{ width: 10, height: 10, color: '#2563eb' }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#1e293b', flex: 1 }}>{article}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TicketDetailModal;
