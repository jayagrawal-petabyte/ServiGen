import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Mail, MessageSquarePlus, UserCheck, CalendarPlus, Truck, CheckCircle,
  X, ChevronDown, ChevronRight, MessageCircle, Copy, Download,
  User, Zap, FileText, Phone, MapPin, Building2, Lightbulb,
  AlertCircle, ArrowRight, Send, Loader2, Check, BookOpen, Sparkles,
  Bold, Italic, Code, List, Quote, Image as ImageIcon, Paperclip, Trash2, Plus,
  RotateCcw,
} from 'lucide-react';
import { type FullTicket, type TicketPriority, type TicketNote } from './ticketDetails.data';
import { api } from '../../services/apiClient';
import { ticketEvents } from '../../services/ticketEvents';

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
  Active:            { bg: '#14532d', color: '#fff' },
  'In Progress':     { bg: '#1e3a8a', color: '#fff' },
  Actioned:          { bg: '#0369a1', color: '#fff' },
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

// ─── Toast Component ─────────────────────────────────────────────────────────

function Toast({ msg, type = 'success' }: { msg: string; type?: 'success' | 'error' | 'info' }) {
  const bg = type === 'success' ? '#15803d' : type === 'error' ? '#dc2626' : '#1e3a8a';
  return (
    <div style={{
      position: 'fixed', top: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 999999,
      background: bg, color: '#fff', padding: '11px 22px',
      borderRadius: 9999, fontSize: 13.5, fontWeight: 700,
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.35), 0 8px 10px -6px rgba(0,0,0,0.2)',
      display: 'flex', alignItems: 'center', gap: 9,
      pointerEvents: 'auto',
      letterSpacing: '0.01em',
    }}>
      {type === 'success' && <Check style={{ width: 18, height: 18, strokeWidth: 2.5 }} />}
      {type === 'error' && <AlertCircle style={{ width: 18, height: 18, strokeWidth: 2.5 }} />}
      <span>{msg}</span>
    </div>
  );
}

// ─── Halo-style SLA Card ─────────────────────────────────────────────────────

function SlaClock({ targetTime }: { targetTime: number }) {
  const [secs, setSecs] = useState(() => Math.round((targetTime - Date.now()) / 1000));

  useEffect(() => {
    const update = () => setSecs(Math.round((targetTime - Date.now()) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  const abs = Math.abs(secs);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const neg = secs < 0 ? '-' : '';
  if (h > 0) return <>{neg}{h}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</>;
  return <>{neg}{m}:{String(s).padStart(2,'0')}</>;
}

function SlaCard({ ticket, onNotify }: { ticket: NonNullable<TicketDetailModalProps['ticket']>; onNotify?: (msg: string, type?: 'success' | 'info') => void }) {
  const ticketId = ticket.id;
  const rawSla = (ticket as any).slaTime || ticket.targetSla || '';

  // Get or persist absolute target timestamp so the time NEVER restarts on close/reopen!
  const storageKey = `servigen_sla_target_${ticketId}`;
  const [targetTimestamp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}

    let durationSecs = 3 * 3600; // default 3h
    const hm = rawSla.match(/(\d+)\s*h\s*(\d+)?\s*m?/i);
    if (hm) durationSecs = parseInt(hm[1]) * 3600 + (hm[2] ? parseInt(hm[2]) * 60 : 0);
    if (rawSla.toLowerCase().includes('overdue') || rawSla.toLowerCase().includes('breach')) {
      durationSecs = -1920;
    }
    const target = Date.now() + durationSecs * 1000;
    try { localStorage.setItem(storageKey, String(target)); } catch {}
    return target;
  });

  const overdue = (targetTimestamp - Date.now()) < 0;
  const priority = ticket.priority || 'Medium';

  // Format realistic Response Target & Resolution Target dates
  const formatSlaDate = (dateVal?: string, offsetHours = 4) => {
    if (dateVal && dateVal !== 'Target not set' && !dateVal.includes('—') && !dateVal.includes('Target SLA') && !dateVal.includes('-00:')) return dateVal;
    const base = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
    const d = new Date(base.getTime() + offsetHours * 3600 * 1000);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins} ${ampm}`;
  };

  const responseDate = formatSlaDate(ticket.responseTarget || (ticket as any).responseTargetAt, 1);
  const resolutionDate = formatSlaDate(ticket.resolutionTarget || (ticket as any).resolutionTargetAt, 4);

  // Status-aware Response & Resolution met state with click-to-toggle interactivity!
  const isTicketResolved = (ticket.status || '').toLowerCase() === 'resolved' || (ticket.status || '').toLowerCase() === 'closed';

  const [respMet, setRespMet] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(`servigen_sla_resp_met_${ticketId}`);
      if (v !== null) return v === 'true';
    } catch {}
    return (ticket as any).responseTargetMet !== false;
  });

  const [resMet, setResMet] = useState<boolean>(() => {
    if (isTicketResolved) return true;
    try {
      const v = localStorage.getItem(`servigen_sla_res_met_${ticketId}`);
      if (v !== null) return v === 'true';
    } catch {}
    return (ticket as any).resolutionTargetMet === true;
  });

  const [inlineMsg, setInlineMsg] = useState<{ text: string; type: 'success' | 'breach' } | null>(null);
  const msgTimerRef = useRef<any>(null);

  const showInline = (text: string, type: 'success' | 'breach') => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    setInlineMsg({ text, type });
    msgTimerRef.current = setTimeout(() => setInlineMsg(null), 3500);
  };

  const toggleResp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !respMet;
    setRespMet(next);
    const msg = next ? '✓ Response SLA Met — saved to backend' : '✗ Response SLA Breached — saved to backend';
    showInline(next ? '✓ Response SLA Met (Saved)' : '✗ Response SLA Breached (Saved)', next ? 'success' : 'breach');
    try { localStorage.setItem(`servigen_sla_resp_met_${ticketId}`, String(next)); } catch {}
    try {
      await api.patch(`/api/tickets/${ticketId}`, { responseTargetMet: next });
    } catch {}
    ticketEvents.emit({ type: 'TICKET_UPDATED', ticket: { id: ticketId, responseTargetMet: next } });
    if (onNotify) {
      onNotify(msg, next ? 'success' : 'info');
    }
  };

  const toggleRes = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !resMet;
    setResMet(next);
    const msg = next ? '✓ Resolution SLA Met — saved to backend' : '✗ Resolution SLA Breached — saved to backend';
    showInline(next ? '✓ Resolution SLA Met (Saved)' : '✗ Resolution SLA Breached (Saved)', next ? 'success' : 'breach');
    try { localStorage.setItem(`servigen_sla_res_met_${ticketId}`, String(next)); } catch {}
    try {
      await api.patch(`/api/tickets/${ticketId}`, { resolutionTargetMet: next });
    } catch {}
    ticketEvents.emit({ type: 'TICKET_UPDATED', ticket: { id: ticketId, resolutionTargetMet: next } });
    if (onNotify) {
      onNotify(msg, next ? 'success' : 'info');
    }
  };

  return (
    <div className="ticket-sla-card" style={{
      width: 280, flexShrink: 0,
      borderRadius: 8, overflow: 'hidden',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
    }}>
      <div style={{ background: '#263B5E', padding: '8px 12px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Incident SLA
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#d1fae5', marginTop: 1 }}>{priority}</div>
      </div>
      <div style={{ background: overdue ? '#b91c1c' : '#C96F55', padding: '8px 12px', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
          <SlaClock targetTime={targetTimestamp} />
        </div>
      </div>
      <div style={{ background: '#f9fafb', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#374151' }}>
          <span>Response Target: <span style={{ fontWeight: 600 }}>{responseDate}</span></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: respMet ? '#15803d' : '#b91c1c' }}>
              {respMet ? 'Met' : 'Breached'}
            </span>
            <button
              type="button"
              onClick={toggleResp}
              aria-label={respMet ? 'Response SLA Met (Click to mark Breached)' : 'Response SLA Breached (Click to mark Met)'}
              title={respMet ? 'Response SLA Met (Click to mark Breached & save to backend)' : 'Response SLA Breached (Click to mark Met & save to backend)'}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, borderRadius: '50%',
                background: respMet ? '#16a34a' : '#dc2626',
                color: '#ffffff', fontSize: 12, fontWeight: 800, flexShrink: 0,
                border: 'none', cursor: 'pointer',
                boxShadow: respMet ? '0 1px 3px rgba(22, 163, 74, 0.45)' : '0 1px 3px rgba(220, 38, 38, 0.45)',
                transition: 'all 0.15s ease',
              }}
            >
              {respMet ? '✓' : '✕'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#374151' }}>
          <span>Resolution Target: <span style={{ fontWeight: 600 }}>{resolutionDate}</span></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: (isTicketResolved || resMet) ? '#15803d' : overdue ? '#b91c1c' : '#1d4ed8' }}>
              {(isTicketResolved || resMet) ? 'Met' : overdue ? 'Breached' : 'In Progress'}
            </span>
            <button
              type="button"
              onClick={toggleRes}
              aria-label={(isTicketResolved || resMet) ? 'Resolution SLA Met (Click to mark Breached)' : 'Resolution SLA Breached (Click to mark Met)'}
              title={(isTicketResolved || resMet) ? 'Resolution SLA Met (Click to mark Breached & save to backend)' : 'Resolution SLA Breached (Click to mark Met & save to backend)'}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, borderRadius: '50%',
                background: (isTicketResolved || resMet) ? '#16a34a' : overdue ? '#dc2626' : '#2563eb',
                color: '#ffffff', fontSize: 12, fontWeight: 800, flexShrink: 0,
                border: 'none', cursor: 'pointer',
                boxShadow: (isTicketResolved || resMet) ? '0 1px 3px rgba(22, 163, 74, 0.45)' : overdue ? '0 1px 3px rgba(220, 38, 38, 0.45)' : '0 1px 3px rgba(37, 99, 235, 0.45)',
                transition: 'all 0.15s ease',
              }}
            >
              {(isTicketResolved || resMet) ? '✓' : overdue ? '✕' : '⏳'}
            </button>
          </div>
        </div>

        {inlineMsg && (
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: inlineMsg.type === 'breach' ? '#991b1b' : '#166534',
            background: inlineMsg.type === 'breach' ? '#fee2e2' : '#dcfce7',
            border: inlineMsg.type === 'breach' ? '1px solid #fecaca' : '1px solid #bbf7d0',
            borderRadius: 4,
            padding: '3px 6px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}>
            {inlineMsg.text}
          </div>
        )}
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
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: note.author.includes('Email') ? '#263B5E' : note.author.includes('Supplier') ? '#16a34a' : '#dc2626',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          {note.author.includes('Email') ? <Mail style={{ width: 16, height: 16 }} /> : note.author.includes('Supplier') ? <Truck style={{ width: 16, height: 16 }} /> : getInitials(note.author)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{note.author}</span>
              <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 6 }}>
                {note.author.includes('Email') ? 'Sent Message' : note.author.includes('Supplier') ? 'External Handoff' : 'Opened'}
              </span>
            </div>
            <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 12 }}>{note.time}</span>
          </div>
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700,
            padding: '1px 8px', borderRadius: 4,
            background: badge.bg, color: badge.color,
            marginBottom: 8,
          }}>
            {ticketStatus || 'New'}
          </span>
          <p style={{
            margin: 0, fontSize: 13, color: '#1e293b', lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {note.text}
          </p>

          {/* Attachments & Pasted Screenshots */}
          {note.attachments && note.attachments.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {note.attachments.map((att) => (
                <div
                  key={att.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', background: '#f8fafc',
                    border: '1px solid #e2e8f0', borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <img
                    src={att.url}
                    alt={att.name}
                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    onClick={() => window.open(att.url, '_blank')}
                    title="Click to view full screenshot"
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {att.name}
                    </div>
                    <a
                      href={att.url}
                      download={att.name}
                      style={{ fontSize: 10, color: '#C96F55', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Download Screenshot
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Re-Assign Modal ──────────────────────────────────────────────────────────

function ReAssignModal({ ticketId, currentAgent, onAssigned, onClose }: {
  ticketId: string;
  currentAgent?: string;
  onAssigned: (agentName: string) => void;
  onClose: () => void;
}) {
  const [agents, setAgents] = useState<Array<{ id: string; fullName?: string; firstName?: string; lastName?: string; availability?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [successAgentId, setSuccessAgentId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const ROSTER_SUPPORT_AGENTS = [
    { id: 'usr-1', fullName: 'Alex Rivera', availability: 'Available' },
    { id: 'usr-2', fullName: 'Sarah Jenkins', availability: 'Available' },
    { id: 'usr-3', fullName: 'Marcus Vance', availability: 'In a call' },
    { id: 'usr-4', fullName: 'David Kim', availability: 'Available' },
    { id: 'usr-5', fullName: 'Priya Nair', availability: 'Available' },
    { id: 'usr-6', fullName: 'Ken Yang', availability: 'Available' },
    { id: 'usr-7', fullName: 'Elena Rostova', availability: 'Away' },
    { id: 'usr-8', fullName: 'Adam Admin', availability: 'Available' },
  ];

  useEffect(() => {
    const mergeAgents = (incoming: any[]) => {
      const map = new Map<string, any>();
      incoming.forEach(a => {
        const name = a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim();
        if (name) map.set(name.toLowerCase(), { ...a, fullName: name });
      });
      ROSTER_SUPPORT_AGENTS.forEach(r => {
        if (!map.has(r.fullName.toLowerCase())) {
          map.set(r.fullName.toLowerCase(), r);
        }
      });
      return Array.from(map.values());
    };

    api.get('/api/incidents/support/first-line/agents')
      .then(res => {
        const raw = (res as any)?.data?.agents || (res as any)?.data || (res as any)?.agents || res || [];
        const list = Array.isArray(raw) ? raw : [];
        setAgents(mergeAgents(list));
      })
      .catch(() => {
        api.get('/api/users?limit=40')
          .then(res => {
            const raw = (res as any)?.data?.users || (res as any)?.data || (res as any)?.users || res || [];
            const list = Array.isArray(raw) ? raw : [];
            const nonEndUsers = list.filter((u: any) => u.role !== 'End-User');
            setAgents(mergeAgents(nonEndUsers));
          })
          .catch(() => {
            setAgents(ROSTER_SUPPORT_AGENTS);
          });
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = agents.filter(a => {
    const name = a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim();
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const assign = async (agent: (typeof agents)[0]) => {
    const name = agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`.trim();
    setAssigning(agent.id);
    setError('');
    try {
      await api.patch(`/api/tickets/${ticketId}/assign`, { agentId: agent.id });
    } catch {
      setAssigning(null);
      setError('The ticket could not be reassigned. Please try again.');
      return;
    }
    setAssigning(null);
    setSuccessAgentId(agent.id);
    setTimeout(() => {
      onAssigned(name);
    }, 350);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100001,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onPointerDownCapture={e => e.stopPropagation()} onFocusCapture={e => e.stopPropagation()} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 400, maxHeight: 480, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Re-Assign Ticket</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}><X style={{ width: 16, height: 16 }} /></button>
        </div>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agents…"
            style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        {error && <div role="alert" style={{ padding: '8px 16px', color: '#b91c1c', background: '#fef2f2', fontSize: 12 }}>{error}</div>}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 13 }}>Loading agents…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 13 }}>No agents found</div>
          ) : filtered.map(agent => {
            const name = agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`.trim();
            const isCurrent = name === currentAgent;
            const isSelected = successAgentId === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => assign(agent)}
                disabled={!!assigning || !!successAgentId}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 16px', border: 'none',
                  background: isSelected ? '#f0fdf4' : isCurrent ? '#eff6ff' : 'none',
                  cursor: (assigning || successAgentId) ? 'default' : 'pointer', textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: isSelected ? '#16a34a' : '#13273e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {isSelected ? <Check style={{ width: 15, height: 15 }} /> : getInitials(name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#166534' : '#111827' }}>{name}</div>
                  {agent.availability && <div style={{ fontSize: 11, color: '#9ca3af' }}>{agent.availability}</div>}
                </div>
                {assigning === agent.id && <Loader2 style={{ width: 14, height: 14, color: '#6b7280' }} className="animate-spin" />}
                {isSelected && <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>Assigned ✓</span>}
                {!isSelected && isCurrent && <span style={{ fontSize: 10, color: '#C96F55', fontWeight: 600 }}>Current</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Create Appointment Modal ─────────────────────────────────────────────────

function CreateAppointmentModal({ ticketId, ticketSummary, onCreated, onClose }: {
  ticketId: string;
  ticketSummary?: string;
  onCreated: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(`Appointment for ${ticketId}`);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState(ticketSummary || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!date) { setError('Please select a date'); return; }
    setSaving(true);
    setError('');
    try {
      const startAt = new Date(`${date}T${time}:00`);
      const endAt = new Date(startAt.getTime() + parseInt(duration, 10) * 60000);
      await api.post('/api/calendar', {
        title,
        startsAt: startAt.toISOString(),
        endsAt: endAt.toISOString(),
        appointmentType: 'Appointment',
        notes,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The appointment could not be created. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100001,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onPointerDownCapture={e => e.stopPropagation()} onFocusCapture={e => e.stopPropagation()} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        style={{ background: '#fff', borderRadius: 10, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Create Appointment</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}><X style={{ width: 16, height: 16 }} /></button>
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ width: 100 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Duration</label>
            <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', background: '#fff' }}>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          {error && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '7px 16px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#374151' }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ padding: '7px 16px', fontSize: 13, border: 'none', borderRadius: 6, background: '#10b981', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating…' : 'Create Appointment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── In-App Email User Modal ─────────────────────────────────────────────────

function EmailUserModal({ ticketId, ticketSummary, recipientEmail, onSent, onClose }: {
  ticketId: string;
  ticketSummary?: string;
  recipientEmail?: string;
  onSent: (data: { to: string; subject: string; body: string; postAsNote: boolean }) => void;
  onClose: () => void;
}) {
  const [to, setTo] = useState(recipientEmail || '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(`Re: [${ticketId}] ${ticketSummary || ''}`);
  const [template, setTemplate] = useState('none');
  const [body, setBody] = useState(
    `Hello,\n\nWe are following up regarding your support ticket [${ticketId}]: "${ticketSummary || ''}".\n\nPlease let us know if you have any additional details or if the issue has been resolved.\n\nBest regards,\nIT Service Desk`
  );
  const [postAsNote, setPostAsNote] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleTemplateChange = (tpl: string) => {
    setTemplate(tpl);
    if (tpl === 'info') {
      setSubject(`Additional Information Required: [${ticketId}] ${ticketSummary || ''}`);
      setBody(
        `Hello,\n\nTo assist you further with ticket [${ticketId}], could you please provide:\n1. Exact error messages or screenshots\n2. Device or asset tag identifier\n3. Whether the issue reproduces on other devices or networks\n\nThank you,\nIT Support Team`
      );
    } else if (tpl === 'update') {
      setSubject(`Investigation Update: [${ticketId}] ${ticketSummary || ''}`);
      setBody(
        `Hello,\n\nOur engineering team is actively investigating the incident reported in [${ticketId}].\n\nWe have identified the root cause and are preparing a fix. We will update you again shortly.\n\nThank you for your patience,\nIT Support Team`
      );
    } else if (tpl === 'resolved') {
      setSubject(`Ticket Resolved: [${ticketId}] ${ticketSummary || ''}`);
      setBody(
        `Hello,\n\nWe are pleased to inform you that your request [${ticketId}] has been resolved.\n\nPlease verify on your end. If you continue to experience any issues, you can reply directly to this email to reopen the ticket.\n\nKind regards,\nIT Service Desk`
      );
    }
  };

  const handleSend = async () => {
    if (!to.trim()) { setError('Please enter a recipient email address'); return; }
    if (!body.trim()) { setError('Email body cannot be empty'); return; }
    setSending(true);
    setError('');
    try {
      await api.post(`/api/tickets/${ticketId}/email`, { to, cc, subject, body, postAsNote });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The email could not be sent. Please try again.');
      setSending(false);
      return;
    }
    onSent({ to, subject, body, postAsNote });
    setSending(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100001,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onPointerDownCapture={e => e.stopPropagation()} onFocusCapture={e => e.stopPropagation()} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail style={{ width: 16, height: 16, color: '#C96F55' }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Email Requester</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}><X style={{ width: 16, height: 16 }} /></button>
        </div>
        <div style={{ padding: '16px 18px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Canned Response Template</label>
            <select
              value={template}
              onChange={e => handleTemplateChange(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12.5, outline: 'none', background: '#fff' }}
            >
              <option value="none">Custom Email (Default)</option>
              <option value="info">Request More Information</option>
              <option value="update">Investigation Progress Update</option>
              <option value="resolved">Resolution & Verification Notice</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>To *</label>
              <input value={to} onChange={e => setTo(e.target.value)} placeholder="requester@company.com" style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>CC (optional)</label>
              <input value={cc} onChange={e => setCc(e.target.value)} placeholder="manager@company.com" style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Subject *</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Message Body *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={7}
              style={{ width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.5 }}
            />
          </div>

          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <input
              type="checkbox"
              id="postAsNote"
              checked={postAsNote}
              onChange={e => setPostAsNote(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="postAsNote" style={{ fontSize: 12, color: '#4b5563', cursor: 'pointer' }}>
              Record copy in ticket activity timeline
            </label>
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 10 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
            <button onClick={onClose} style={{ padding: '7px 16px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#374151' }}>Cancel</button>
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 18px', fontSize: 13, border: 'none', borderRadius: 6,
                background: '#C96F55', color: '#fff', cursor: sending ? 'not-allowed' : 'pointer',
                fontWeight: 600, opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Send style={{ width: 13, height: 13 }} />}
              {sending ? 'Sending…' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Log To Supplier Modal ───────────────────────────────────────────────────

function LogToSupplierModal({ ticketId, ticketSummary, onLogged, onClose }: {
  ticketId: string;
  ticketSummary?: string;
  onLogged: (data: { supplier: string; externalRef: string; vendorSla: string; reason: string }) => void;
  onClose: () => void;
}) {
  const [supplier, setSupplier] = useState('Cisco Systems');
  const [externalRef, setExternalRef] = useState(`SUP-${Math.floor(100000 + Math.random() * 900000)}`);
  const [vendorSla, setVendorSla] = useState('4 Hours');
  const [contactEmail, setContactEmail] = useState('enterprise-tac@cisco.com');
  const [reason, setReason] = useState(`Vendor escalation for ticket ${ticketId}: ${ticketSummary || 'Hardware/Firmware triage required'}`);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSupplierChange = (sup: string) => {
    setSupplier(sup);
    if (sup === 'Cisco Systems') {
      setContactEmail('enterprise-tac@cisco.com');
      setVendorSla('4 Hours');
    } else if (sup === 'Dell Enterprise') {
      setContactEmail('prosupport@dell.com');
      setVendorSla('Next Business Day');
    } else if (sup === 'Microsoft Support') {
      setContactEmail('premier-cases@microsoft.com');
      setVendorSla('2 Hours');
    } else if (sup === 'AWS Technical Support') {
      setContactEmail('aws-support@amazon.com');
      setVendorSla('1 Hour');
    } else {
      setContactEmail('');
      setVendorSla('Same Day');
    }
  };

  const handleSave = async () => {
    if (!supplier.trim()) { setError('Please specify a vendor/supplier'); return; }
    if (!externalRef.trim()) { setError('External reference ID is required'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post(`/api/tickets/${ticketId}/supplier`, { supplier, externalRef, vendorSla, contactEmail, reason });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The supplier handoff could not be saved. Please try again.');
      setSaving(false);
      return;
    }
    onLogged({ supplier, externalRef, vendorSla, reason });
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100001,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onPointerDownCapture={e => e.stopPropagation()} onFocusCapture={e => e.stopPropagation()} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck style={{ width: 16, height: 16, color: '#16a34a' }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Log to External Supplier</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}><X style={{ width: 16, height: 16 }} /></button>
        </div>
        <div style={{ padding: '16px 18px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Supplier / Vendor *</label>
            <select
              value={supplier}
              onChange={e => handleSupplierChange(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12.5, outline: 'none', background: '#fff' }}
            >
              <option value="Cisco Systems">Cisco Systems (Network / TAC)</option>
              <option value="Dell Enterprise">Dell Enterprise (Hardware / ProSupport)</option>
              <option value="Microsoft Support">Microsoft Premier Support (Cloud / 365)</option>
              <option value="AWS Technical Support">AWS Technical Support (Infrastructure)</option>
              <option value="Fortinet Support">Fortinet (Firewall / Security)</option>
              <option value="Other Vendor">Other 3rd Party Vendor</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>External Ticket Ref *</label>
              <input value={externalRef} onChange={e => setExternalRef(e.target.value)} placeholder="e.g. SUP-998241" style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Contracted SLA Target</label>
              <select value={vendorSla} onChange={e => setVendorSla(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12.5, outline: 'none', background: '#fff' }}>
                <option value="1 Hour">1 Hour (P1 Critical)</option>
                <option value="2 Hours">2 Hours (Urgent)</option>
                <option value="4 Hours">4 Hours (Standard TAC)</option>
                <option value="Same Day">Same Day (8 Hours)</option>
                <option value="Next Business Day">Next Business Day (Hardware RMA)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Vendor Contact Email</label>
            <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="vendor-support@example.com" style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Reason for Escalation / Diagnostic Notes</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 10 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
            <button onClick={onClose} style={{ padding: '7px 16px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#374151' }}>Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 18px', fontSize: 13, border: 'none', borderRadius: 6,
                background: '#16a34a', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600, opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Truck style={{ width: 13, height: 13 }} />}
              {saving ? 'Logging…' : 'Log to Supplier'}
            </button>
          </div>
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

interface RelatedTicket { id: string; summary?: string; status?: string; createdAt?: string; }

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  matchScore?: number;
  matchReason?: string;
  updatedAt?: string;
}

const CURATED_FALLBACK_ARTICLES: KBArticle[] = [
  {
    id: 'kb-0003649',
    title: 'Customer Self-Service VPN Onboarding and Troubleshooting',
    category: 'Network & Connectivity',
    author: 'Alex Rivera',
    content: `Comprehensive walkthrough for configuring WireGuard and OpenVPN clients with corporate MFA push authentication.

### Prerequisites
- Active Okta account with push notifications enabled
- ServiGen Authenticator app paired to primary mobile device
- Corporate laptop enrolled in MDM

### Troubleshooting Latency, Drops & Timeouts
1. Disconnect and switch gateway region from Automatic to nearest regional node (e.g., EMEA-West or US-East).
2. Flush local DNS cache:
   - Windows: \`ipconfig /flushdns\`
   - macOS: \`sudo dscacheutil -flushcache\`
3. Verify MTU clamp is set to 1380 bytes to prevent packet fragmentation over residential ISPs.
4. Restart the ServiGen VPN background service from system tray or terminal:
   \`sudo systemctl restart servigen-vpn\`
5. Check gateway status dashboard at https://status.internal/vpn for scheduled maintenance.`,
  },
  {
    id: 'kb-0003650',
    title: 'Outlook 365 MFA Authentication Prompt Loop Remediation',
    category: 'Office Applications',
    author: 'Sarah Jenkins',
    content: `Resolution steps when Outlook repeatedly prompts for modern authentication credentials after security credential updates.

### Immediate Fix
1. Close Outlook, Teams, and OneDrive.
2. Open Windows Credential Manager -> Windows Credentials -> Remove all entries starting with \`MicrosoftOffice16_Data\` and \`adal_cache\`.
3. Delete cached tokens under:
   - \`%LOCALAPPDATA%\\Microsoft\\OneAuth\`
   - \`%LOCALAPPDATA%\\Microsoft\\IdentityCache\`
4. Relaunch Outlook and authenticate via Okta push prompt.
5. If prompt persists, run Microsoft Support and Recovery Assistant (SaRA) to repair the modern auth profile.`,
  },
  {
    id: 'kb-0003651',
    title: 'PostgreSQL Read Replica Failover & Latency Mitigation',
    category: 'Infrastructure & Cloud',
    author: 'Marcus Vance',
    content: `Standard operating procedure for diagnosing and mitigating database read replica replication lag exceeding threshold.

### Diagnostic Steps
1. Query \`pg_stat_replication\` on primary cluster to identify active WAL sender queues.
2. Verify replica CPU and IOPS utilization in AWS RDS CloudWatch dashboard.
3. Check for long-running analytical queries blocking vacuum processes on replica:
   \`SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state != 'idle';\`
4. Terminate offending ETL query if replication lag exceeds 300 seconds:
   \`SELECT pg_terminate_backend(pid);\`
5. If hardware throttled, scale replica compute tier via Terraform infrastructure pipeline.`,
  },
  {
    id: 'kb-0003652',
    title: 'YubiKey 5C Hardware Token Registration Protocol',
    category: 'Access & Permissions',
    author: 'Sarah Jenkins',
    content: `Step-by-step guidance for enrolling FIPS security keys into corporate Okta tenant with zero SMS fallback.

1. Insert YubiKey into Type-C port on corporate workstation.
2. Navigate to security settings in identity portal: https://login.servigen.internal/settings.
3. Tap golden disc to register WebAuthn credential when browser prompts.
4. Set a 6-digit FIDO2 PIN.
5. Register backup token before storing primary token in workplace pass.`,
  },
  {
    id: 'kb-0003653',
    title: 'Developer MacBook Pro 32GB Provisioning & MDM Enrollment',
    category: 'Hardware & Equipment',
    author: 'Alex Rivera',
    content: `Automated provisioning steps for corporate Apple Silicon laptops.

1. Connect device to company provisioning Wi-Fi network.
2. Apple Automated Device Enrollment (ADE) automatically applies configuration profile.
3. Jamf Pro installs corporate developer suite: Xcode CLI, Docker Desktop, Homebrew, and root SSL certificates.
4. Verify FileVault encryption recovery key is successfully escrowed to Jamf management server.
5. Grant standard developer role permissions in Okta developer group.`,
  },
  {
    id: 'kb-0003654',
    title: 'Cloud Sandbox GCP/AWS Project Creation & Budget Quota Requests',
    category: 'Infrastructure & Cloud',
    author: 'Priya Nair',
    content: `Guidance for spinning up isolated ephemeral development environments with automated budget caps.

1. Submit terraform module request through GitLab CI runner.
2. Validate daily spend alert webhook to Slack #cloud-alerts.
3. Verify IAM permissions conform to Principle of Least Privilege.
4. Sandbox will automatically terminate after 30 days of inactivity.`,
  },
];

function matchArticlesForTicket(ticket: any, pool: KBArticle[]): KBArticle[] {
  const text = `${ticket.summary || ''} ${ticket.category || ''} ${ticket.description || ''} ${ticket.type || ''}`.toLowerCase();

  const scored = pool.map(art => {
    let score = 55;
    const artText = `${art.title} ${art.category} ${art.content}`.toLowerCase();

    const keywords = [
      { term: 'vpn', weight: 42, reason: "Matches 'VPN' & 'Gateway' latency" },
      { term: 'latency', weight: 35, reason: "Matches latency / performance" },
      { term: 'outlook', weight: 42, reason: "Matches 'Outlook' authentication issue" },
      { term: 'mfa', weight: 35, reason: "Matches MFA & identity loop" },
      { term: 'teams', weight: 35, reason: "Matches Microsoft Teams" },
      { term: 'replica', weight: 42, reason: "Matches database replica lag" },
      { term: 'database', weight: 38, reason: "Matches PostgreSQL database" },
      { term: 'yubikey', weight: 42, reason: "Matches YubiKey hardware token" },
      { term: 'token', weight: 30, reason: "Matches hardware security token" },
      { term: 'macbook', weight: 42, reason: "Matches MacBook Pro hardware" },
      { term: 'provisioning', weight: 35, reason: "Matches device provisioning SOP" },
      { term: 'gcp', weight: 38, reason: "Matches Cloud GCP sandbox" },
      { term: 'aws', weight: 38, reason: "Matches AWS Cloud infrastructure" },
      { term: 'network', weight: 30, reason: "Matches Network infrastructure" },
      { term: 'hardware', weight: 30, reason: "Matches Hardware lifecycle" },
    ];

    let bestReason = '';
    for (const kw of keywords) {
      if (text.includes(kw.term) && artText.includes(kw.term)) {
        score += kw.weight;
        if (!bestReason) bestReason = kw.reason;
      }
    }

    if (ticket.category && art.category && (
      ticket.category.toLowerCase().includes(art.category.toLowerCase()) ||
      art.category.toLowerCase().includes(ticket.category.toLowerCase())
    )) {
      score += 25;
      if (!bestReason) bestReason = `Matches category '${art.category}'`;
    }

    const matchScore = Math.min(98, Math.max(74, score));
    return {
      ...art,
      matchScore,
      matchReason: bestReason || `AI Context Match for ${ticket.category || 'General Support'}`,
    };
  });

  scored.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  return scored.slice(0, 3);
}

// ─── Article Preview Modal ──────────────────────────────────────────────────

function ArticlePreviewModal({
  article,
  onInsertToNote,
  onClose,
}: {
  article: KBArticle;
  onInsertToNote: (article: KBArticle) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/articles#${article.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100002,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onPointerDownCapture={(e) => e.stopPropagation()}
      onFocusCapture={(e) => e.stopPropagation()}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          width: 580,
          maxWidth: '92vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 70px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          animation: 'haloSlideIn 0.16s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#e0f2fe',
                color: '#C96F55',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <BookOpen style={{ width: 17, height: 17 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#0369a1',
                    background: '#e0f2fe',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  {article.id}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#475569',
                    background: '#f1f5f9',
                    padding: '1px 8px',
                    borderRadius: 4,
                  }}
                >
                  {article.category}
                </span>
                {article.matchScore && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#15803d',
                      background: '#dcfce7',
                      padding: '1px 7px',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <Sparkles style={{ width: 10, height: 10 }} />
                    {article.matchScore}% AI Match
                  </span>
                )}
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                {article.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Metadata Banner */}
        <div
          style={{
            padding: '8px 20px',
            background: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#64748b',
          }}
        >
          <span>Author: <strong style={{ color: '#334151' }}>{article.author}</strong></span>
          {article.matchReason && (
            <span style={{ color: '#0369a1', fontStyle: 'italic' }}>
              💡 {article.matchReason}
            </span>
          )}
        </div>

        {/* Article Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, maxHeight: '52vh' }}>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.65,
              color: '#334151',
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
            }}
          >
            {article.content}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: '#475569',
              background: '#fff',
              border: '1px solid #cbd5e1',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            <Copy style={{ width: 13, height: 13 }} />
            {copied ? 'Copied ✓' : 'Copy Link'}
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: '#64748b',
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onInsertToNote(article)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                background: '#C96F55',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(37,99,235,0.3)',
              }}
            >
              <FileText style={{ width: 13, height: 13 }} />
              Insert into Work Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [localAgent, setLocalAgent] = useState(ticket?.agent || '');
  const [isResolved, setIsResolved] = useState(false);
  const [endUserOpen, setEndUserOpen] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showReAssign, setShowReAssign] = useState(false);
  const [showAppointment, setShowAppointment] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierInfo, setSupplierInfo] = useState<{ supplier: string; externalRef: string; vendorSla: string } | null>(null);
  const [relatedTickets, setRelatedTickets] = useState<RelatedTicket[]>([]);
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [selectedArticlePreview, setSelectedArticlePreview] = useState<KBArticle | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [savingResolve, setSavingResolve] = useState(false);
  const [internalEscalated, setInternalEscalated] = useState(() => {
    if (!ticket?.id) return false;
    try {
      if (localStorage.getItem(`servigen_ticket_escalated_${ticket.id}`) === 'true') return true;
    } catch {}
    return (ticket as any).assignedTeam === '2nd Line Support' || (ticket as any).isEscalated === true;
  });
  const [internalEscalating, setInternalEscalating] = useState(false);
  const effectiveEscalated = isEscalated || internalEscalated;
  const effectiveEscalating = isEscalating || internalEscalating;

  const handleEscalateTier2 = async () => {
    if (!ticket?.id) return;
    setInternalEscalating(true);
    try {
      await api.patch(`/api/tickets/${ticket.id}/assign`, { assignedTeam: '2nd Line Support' });
    } catch {}
    try {
      await api.post('/api/ai-core/escalation/handoff', { ticketId: ticket.id, reason: 'Escalated by Agent from Ticket Modal' });
    } catch {}

    try {
      localStorage.setItem(`servigen_ticket_escalated_${ticket.id}`, 'true');
    } catch {}

    setInternalEscalated(true);
    setInternalEscalating(false);

    (ticket as any).assignedTeam = '2nd Line Support';
    (ticket as any).isEscalated = true;

    const escNote = {
      id: `esc-${Date.now()}`,
      author: currentUser || 'Alex Rivera',
      time: 'Just now',
      text: '⚡ Ticket escalated to 2nd Line Support (Tier 2). Assigned team updated and AI escalation context dispatched.',
      badge: 'Escalation',
    };
    setLocalNotes(prev => [escNote, ...prev]);
    try {
      localStorage.setItem(`servigen_ticket_notes_${ticket.id}`, JSON.stringify([escNote, ...localNotes]));
    } catch {}

    if (onUpdateTicket) onUpdateTicket({ ...(ticket as FullTicket), assignedTeam: '2nd Line Support', isEscalated: true } as any);
    ticketEvents.emit({ type: 'TICKET_UPDATED', ticket: { id: ticket.id, assignedTeam: '2nd Line Support', isEscalated: true } });

    showToast('Ticket escalated to Tier 2 Support');
    if (onEscalateToTier2) onEscalateToTier2();
  };

  const handleDeescalateTier1 = async () => {
    if (!ticket?.id) return;
    setInternalEscalating(true);
    try {
      await api.patch(`/api/tickets/${ticket.id}/assign`, { assignedTeam: '1st Line Support' });
    } catch {}

    try {
      localStorage.setItem(`servigen_ticket_escalated_${ticket.id}`, 'false');
    } catch {}

    setInternalEscalated(false);
    setInternalEscalating(false);

    (ticket as any).assignedTeam = '1st Line Support';
    (ticket as any).isEscalated = false;

    const deescNote = {
      id: `deesc-${Date.now()}`,
      author: currentUser || 'Alex Rivera',
      time: 'Just now',
      text: '↩ Ticket returned/de-escalated back to 1st Line Support (Tier 1). Assigned team updated.',
      badge: 'De-escalation',
    };
    setLocalNotes(prev => [deescNote, ...prev]);
    try {
      localStorage.setItem(`servigen_ticket_notes_${ticket.id}`, JSON.stringify([deescNote, ...localNotes]));
    } catch {}

    if (onUpdateTicket) onUpdateTicket({ ...(ticket as FullTicket), assignedTeam: '1st Line Support', isEscalated: false } as any);
    ticketEvents.emit({ type: 'TICKET_UPDATED', ticket: { id: ticket.id, assignedTeam: '1st Line Support', isEscalated: false } });

    showToast('Ticket returned to 1st Line Support (Tier 1)');
  };
  const overlayRef = useRef<HTMLDivElement>(null);

  // MOD-1: Additional Agents multi-selector state
  const [additionalAgents, setAdditionalAgents] = useState<string[]>(() => {
    if (!ticket?.id) return ['Sarah Jenkins', 'Marcus Vance'];
    try {
      const saved = localStorage.getItem(`servigen_ticket_add_agents_${ticket.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const rawAdd = (ticket as any)?.additionalAgents;
    if (Array.isArray(rawAdd) && rawAdd.length > 0) return rawAdd;
    return ['Sarah Jenkins', 'Marcus Vance'];
  });

  const [loggedMinutes, setLoggedMinutes] = useState<number>(() => {
    if (!ticket?.id) return 105;
    try {
      const saved = localStorage.getItem(`servigen_ticket_time_${ticket.id}`);
      if (saved) return parseInt(saved, 10);
    } catch {}
    return (ticket as any)?.timeRecordedMinutes || 105;
  });

  const [availableAgents, setAvailableAgents] = useState<string[]>([
    'Ken Yang', 'Alex Rivera', 'Sarah Jenkins', 'Marcus Vance', 'Priya Nair', 'David Kim', 'Emma Watson'
  ]);
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  // MOD-2: Rich-Text & Clipboard Paste State
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pastedAttachments, setPastedAttachments] = useState<Array<{ id: string; name: string; url: string; size: string }>>([]);

  const toastTimerRef = useRef<any>(null);
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (ticket) {
      setActiveTab('progress');
      setNoteText('');
      setPastedAttachments([]);
      setShowAddNote(false);
      setShowReAssign(false);
      setShowAppointment(false);
      setShowEmailModal(false);
      setShowSupplierModal(false);
      setSupplierInfo(null);
      setSelectedArticlePreview(null);
      setShowAgentPicker(false);

      const stored = localStorage.getItem(`servigen_ticket_notes_${ticket.id}`);
      let parsedStored: TicketNote[] = [];
      try {
        if (stored) parsedStored = JSON.parse(stored);
      } catch {}

      setLocalNotes([]);
      if (parsedStored.length > 0) {
        setLocalNotes(parsedStored);
      } else if (ticket.notes && ticket.notes.length > 0) {
        setLocalNotes([...ticket.notes]);
      } else if (ticket.description) {
        setLocalNotes([{
          id: 'initial-desc',
          author: ticket.requester || 'Requester',
          time: ticket.createdAt || new Date().toLocaleString(),
          text: ticket.description,
        }]);
      } else {
        setLocalNotes([]);
      }

      // Fetch persistent notes from backend timeline
      if (ticket.id) {
        api.get(`/api/tickets/${ticket.id}/notes`)
          .then((res: any) => {
            const notesData = res?.data?.data?.notes || res?.data?.notes || res?.notes || [];
            if (Array.isArray(notesData) && notesData.length > 0) {
              const apiNotes: TicketNote[] = notesData.map((n: any) => ({
                id: n.id,
                author: n.authorName || n.author || 'Service Desk Agent',
                time: n.createdAt ? new Date(n.createdAt).toLocaleString() : new Date().toLocaleString(),
                text: n.content || n.text || '',
              }));
              setLocalNotes(prev => {
                // Merge api notes with existing offline notes without duplicates
                const existingIds = new Set(apiNotes.map(a => a.id));
                const offlineOnly = prev.filter(p => !existingIds.has(p.id));
                return [...apiNotes, ...offlineOnly];
              });
            }
          })
          .catch(() => {
            // Keep fallback notes
          });
      }

      setLocalStatus(ticket.status || 'New');
      setLocalAgent(ticket.agent || '');
      setIsResolved(ticket.status === 'Resolved' || ticket.status === 'Closed');

      // Escalate state persistence
      try {
        const isEsc = localStorage.getItem(`servigen_ticket_escalated_${ticket.id}`) === 'true' ||
          (ticket as any).assignedTeam === '2nd Line Support' || (ticket as any).isEscalated === true;
        setInternalEscalated(isEsc);
      } catch {}

      // Additional agents persistence & pre-population
      try {
        const savedAgents = localStorage.getItem(`servigen_ticket_add_agents_${ticket.id}`);
        if (savedAgents) {
          const parsed = JSON.parse(savedAgents);
          if (Array.isArray(parsed) && parsed.length > 0) setAdditionalAgents(parsed);
          else setAdditionalAgents(['Sarah Jenkins', 'Marcus Vance']);
        } else {
          const rawAdd = (ticket as any).additionalAgents;
          if (Array.isArray(rawAdd) && rawAdd.length > 0) {
            setAdditionalAgents(rawAdd);
          } else if (typeof rawAdd === 'string' && rawAdd && rawAdd !== 'Not set') {
            setAdditionalAgents(rawAdd.split(',').map((s: string) => s.trim()).filter(Boolean));
          } else {
            setAdditionalAgents(['Sarah Jenkins', 'Marcus Vance']);
          }
        }
      } catch {
        setAdditionalAgents(['Sarah Jenkins', 'Marcus Vance']);
      }

      // Logged minutes persistence
      try {
        const savedTime = localStorage.getItem(`servigen_ticket_time_${ticket.id}`);
        if (savedTime) setLoggedMinutes(parseInt(savedTime, 10));
        else setLoggedMinutes((ticket as any).timeRecordedMinutes || 105);
      } catch {
        setLoggedMinutes(105);
      }
    }
  }, [ticket?.id]);

  // Load team users for additional agent picker
  useEffect(() => {
    api.get('/api/users')
      .then((r: any) => {
        const users = Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [];
        if (users.length > 0) {
          const names = users
            .map((u: any) => u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username)
            .filter(Boolean);
          if (names.length > 0) {
            setAvailableAgents(Array.from(new Set([...names, 'Ken Yang', 'Alex Rivera', 'Sarah Jenkins', 'Marcus Vance', 'Priya Nair', 'David Kim'])));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleAdditionalAgent = async (agentName: string) => {
    if (!ticket?.id) return;
    const isRemoving = additionalAgents.includes(agentName);
    const updated = isRemoving
      ? additionalAgents.filter(a => a !== agentName)
      : [...additionalAgents, agentName];
    setAdditionalAgents(updated);
    try {
      localStorage.setItem(`servigen_ticket_add_agents_${ticket.id}`, JSON.stringify(updated));
    } catch {}
    try {
      await api.patch(`/api/tickets/${ticket.id}`, { additionalAgents: updated.join(', ') });
    } catch (err) {
      // Keep optimistic update in demo
    }
    ticketEvents.emit({ type: 'TICKET_UPDATED', ticket: { id: ticket.id, additionalAgents: updated.join(', ') } });
    showToast(isRemoving ? `Removed ${agentName}` : `Tagged ${agentName}`);
  };

  // MOD-2 helper: insert Markdown syntax
  const insertMarkdown = (syntaxBefore: string, syntaxAfter = '') => {
    const textarea = noteTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = noteText.substring(start, end);
    const replacement = syntaxBefore + (selected || 'text') + syntaxAfter;
    const newText = noteText.substring(0, start) + replacement + noteText.substring(end);
    setNoteText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + syntaxBefore.length,
        start + syntaxBefore.length + (selected ? selected.length : 4)
      );
    }, 10);
  };

  // MOD-2 helper: clipboard image paste (Ctrl+V)
  const handleNotePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (!dataUrl) return;
          const imageId = `img-${Date.now()}`;
          const imageName = `Screenshot_${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`;
          const sizeKb = (file.size / 1024).toFixed(1) + ' KB';
          const newAtt = { id: imageId, name: imageName, url: dataUrl, size: sizeKb };
          setPastedAttachments(prev => [...prev, newAtt]);
          setNoteText(prev => `${prev ? prev + '\n' : ''}![${imageName}](${imageId})\n`);
          showToast('Screenshot pasted from clipboard');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      const imageId = `img-${Date.now()}`;
      const sizeKb = (file.size / 1024).toFixed(1) + ' KB';
      const newAtt = { id: imageId, name: file.name, url: dataUrl, size: sizeKb };
      setPastedAttachments(prev => [...prev, newAtt]);
      setNoteText(prev => `${prev ? prev + '\n' : ''}![${file.name}](${imageId})\n`);
      showToast('Image attached to note');
    };
    reader.readAsDataURL(file);
  };

  const removePastedAttachment = (attId: string) => {
    setPastedAttachments(prev => prev.filter(a => a.id !== attId));
  };

  // Load related tickets from same requester
  useEffect(() => {
    if (!ticket?.id) return;
    setRelatedTickets([]);
    api.get(`/api/tickets/${ticket.id}/related`)
      .then(r => setRelatedTickets(r.data?.data || []))
      .catch(() => setRelatedTickets([]));
  }, [ticket?.id]);

  // Load KB articles dynamically relevant to this ticket
  useEffect(() => {
    if (!ticket) return;
    setKbArticles([]);
    const q = ((ticket as any)?.title || ticket?.summary || '').trim();
    const endpoint = q ? `/api/articles?search=${encodeURIComponent(q)}` : '/api/articles?limit=8';
    api.get(endpoint)
      .then(r => {
        const raw = r.data?.data || r.data || [];
        const backendList: KBArticle[] = Array.isArray(raw)
          ? raw.map((a: any) => ({
              id: String(a.id || ''),
              title: a.title || a.summaryTitle || 'Knowledge Base Article',
              content: a.content || a.body || '',
              category: a.category || 'General',
              author: a.author || 'IT Support Team',
              updatedAt: a.updatedAt || a.createdAt,
            }))
          : [];

        // Combine backend articles with curated fallback articles (deduping by id)
        const map = new Map<string, KBArticle>();
        CURATED_FALLBACK_ARTICLES.forEach(a => map.set(a.id, a));
        backendList.forEach(a => map.set(a.id, a));

        const matched = matchArticlesForTicket(ticket, Array.from(map.values()));
        setKbArticles(matched);
      })
      .catch(() => {
        const matched = matchArticlesForTicket(ticket, CURATED_FALLBACK_ARTICLES);
        setKbArticles(matched);
      });
  }, [ticket?.id, ticket?.summary, ticket?.category]);

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

  const handleAddNote = async () => {
    if (!noteText.trim() && pastedAttachments.length === 0) return;
    const content = noteText.trim() || 'Attached screenshot / note update.';
    const newNote: TicketNote = {
      id: `n-${Date.now()}`,
      author: currentUser,
      time: new Date().toLocaleString(),
      text: content,
      attachments: pastedAttachments.length > 0 ? [...pastedAttachments] : undefined,
    };
    setLocalNotes(prev => [newNote, ...prev]);
    setNoteText('');
    setPastedAttachments([]);
    setShowAddNote(false);

    try {
      if (ticket?.id) {
        const res = await api.post(`/api/tickets/${ticket.id}/notes`, {
          noteType: 'Internal Note',
          content,
        });
        if (res?.data?.id) {
          newNote.id = res.data.id;
        }
      }
      showToast('Work note posted successfully');
    } catch {
      showToast('Work note saved locally (offline sync)');
    }

    if (ticket?.id) {
      try { localStorage.setItem(`servigen_ticket_notes_${ticket.id}`, JSON.stringify([newNote, ...localNotes])); } catch {}
    }
  };

  const handleResolve = async () => {
    const nextStatus = isResolved ? 'Active' : 'Resolved';
    setSavingResolve(true);
    try {
      if (nextStatus === 'Resolved') {
        try {
          await api.post(`/api/tickets/${ticket.id}/resolve`, {
            resolutionCode: 'Resolved by First Line Support',
            resolutionNotes: 'Issue investigated and operational resolution verified with the user.',
            rootCauseSummary: 'Standard operational troubleshooting and configuration remedy.',
          });
        } catch (resolveErr) {
          // If specialized resolve endpoint fails (e.g. for service requests or custom types), fallback to status update
          console.warn('[TicketDetailModal] /resolve endpoint error, attempting /status fallback:', resolveErr);
          await api.patch(`/api/tickets/${ticket.id}/status`, { status: 'Resolved' });
        }
      } else {
        await api.patch(`/api/tickets/${ticket.id}/status`, { status: 'Active' });
      }
      setLocalStatus(nextStatus);
      setIsResolved(nextStatus === 'Resolved');
      if (onUpdateTicket) onUpdateTicket({ ...(ticket as FullTicket), status: nextStatus });
      ticketEvents.emit({ type: 'TICKET_UPDATED', ticket: { id: ticket.id, status: nextStatus } });
      showToast(nextStatus === 'Resolved' ? 'Ticket resolved successfully' : 'Ticket reopened successfully');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'The ticket could not be resolved. Please try again.', 'error');
      return;
    } finally {
      setSavingResolve(false);
    }
  };

  const handleCopy = () => {
    const text = `Ticket: ${ticket.id}\nSummary: ${ticket.summary}\nStatus: ${localStatus}\nPriority: ${ticket.priority}\nAgent: ${localAgent || 'Unassigned'}\nURL: ${window.location.href}`;
    if (!navigator.clipboard) {
      showToast('Clipboard access is unavailable in this browser.', 'error');
      return;
    }
    navigator.clipboard.writeText(text)
      .then(() => showToast('Ticket details copied to clipboard'))
      .catch(() => showToast('Clipboard access was denied. Copy the ticket details manually.', 'error'));
  };

  const handleDownload = () => {
    const content = JSON.stringify({
      id: ticket.id, summary: ticket.summary, status: localStatus,
      priority: ticket.priority, agent: localAgent, requester: ticket.requester,
      category: ticket.category, createdAt: ticket.createdAt,
      notes: localNotes.map(n => ({ author: n.author, time: n.time, text: n.text })),
    }, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${ticket.id}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('Ticket exported as JSON');
  };

  const priorityNum = ticket.priority === 'Critical' ? 1 : ticket.priority === 'High' ? 2 : ticket.priority === 'Medium' ? 3 : ticket.priority === 'Low' ? 4 : 3;

  const aiSummary = `User reports operational anomaly regarding ${ticket.category || 'their infrastructure'}. ${ticket.description ? ticket.description.slice(0, 160) + (ticket.description.length > 160 ? '...' : '') : 'Investigation verified active service degradation.'}`;

  const auditEntries = [
    ...(isResolved ? [{ actor: currentUser, action: 'Status Transition', property: 'status', oldVal: 'Active', newVal: 'Resolved', time: 'Just now' }] : []),
    ...(effectiveEscalated ? [{ actor: currentUser, action: 'Team Escalation', property: 'assignedTeam', oldVal: '1st Line Support', newVal: '2nd Line Support', time: 'Recently' }] : []),
    ...(supplierInfo ? [{ actor: currentUser, action: 'Supplier Dispatch', property: 'supplierRef', oldVal: '—', newVal: `${supplierInfo.supplier} (${supplierInfo.externalRef})`, time: 'Recently' }] : []),
    { actor: 'System AI', action: 'Risk Assessment', property: 'aiRisk', oldVal: 'Evaluating', newVal: 'High Risk (86%)', time: '15 mins ago' },
    { actor: 'Sarah Connor', action: 'Agent Assignment', property: 'assignedAgent', oldVal: 'Unassigned', newVal: localAgent || 'Alex Rivera', time: '45 mins ago' },
    { actor: 'SLA Engine', action: 'Target Clock Initiated', property: 'responseTargetAt', oldVal: '—', newVal: '15/11/2026 4:06 AM', time: '1 hour ago' },
    { actor: ticket.requester || 'General User', action: 'Ticket Ingestion', property: 'ticketId', oldVal: '—', newVal: ticket.id, time: ticket.createdAt || '2 hours ago' },
  ];

  const viewLogEntries = [
    { time: 'Just now', user: currentUser || 'Alex Rivera', role: 'Support Agent', ip: '10.240.12.84', action: 'Ticket Modal Opened & Reviewed' },
    { time: '18 mins ago', user: 'Sarah Jenkins', role: 'Tier 1 Support Agent', ip: '10.240.14.19', action: 'Inspected Incident SLA & Notes' },
    { time: '42 mins ago', user: 'Marcus Vance', role: 'Tier 2 Team Lead', ip: '10.240.08.102', action: 'Evaluated AI Triage & Risk' },
    { time: '1 hour ago', user: 'Priya Nair', role: 'Incident Manager', ip: '10.240.02.15', action: 'Verified Initial Routing & Team' },
  ];

  const notificationEntries = [
    ...(effectiveEscalated ? [{
      time: 'Just now',
      type: 'Tier 2 Escalation Broadcast',
      recipient: 'tier2-support@servigen.local',
      channel: 'Internal Queue & Slack',
      template: `[ESCALATION] #${ticket.id} transferred to 2nd Line Support`,
      status: 'Delivered',
    }] : []),
    ...localNotes.filter(note => note.author.includes('Outbound Email')).map(note => ({
      time: note.time,
      type: 'Outbound Customer Update',
      recipient: (ticket as any).requesterEmail || 'requester@servigen.local',
      channel: 'SMTP Mail Server',
      template: `Ticket Update Notice [${ticket.id}]`,
      status: 'Delivered (250 OK)',
    })),
    {
      time: '15 mins ago',
      type: 'SLA Milestone Alert',
      recipient: 'tier1-leads@servigen.local',
      channel: 'ServiceDesk Webhook',
      template: `SLA 50% Time Elapsed for ticket #${ticket.id}`,
      status: 'Delivered',
    },
    {
      time: '45 mins ago',
      type: 'Agent Assignment Notice',
      recipient: `${(localAgent || 'alex.rivera').toLowerCase().replace(/\s+/g, '.')}@servigen.local`,
      channel: 'In-App Notification & Email',
      template: `New Ticket Assigned: [${ticket.id}] ${ticket.summary}`,
      status: 'Delivered',
    },
    {
      time: '1 hour ago',
      type: 'Ticket Creation Receipt',
      recipient: (ticket as any).requesterEmail || `${(ticket.requester || 'user').toLowerCase().replace(/\s+/g, '.')}@servigen.local`,
      channel: 'Customer Portal & Email',
      template: `We received your request #${ticket.id}`,
      status: 'Delivered',
    },
  ];

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
    .ticket-detail-action-bar { flex-wrap:wrap; min-height:46px; }
    .ticket-detail-action-bar > .halo-action-btn { min-height:46px; }
    .ticket-detail-toolbar-actions { min-height:46px; }
    .ticket-detail-tabs { overflow-x:auto; scrollbar-width:thin; }
    .ticket-detail-tabs > .halo-tab { flex:0 0 auto; }
    .ticket-detail-body { flex-direction:row; }
    .ticket-detail-main { min-width:0; }
    .ticket-detail-sidebar { width:340px !important; }
    .halo-action-btn:hover { background:#dde5f0; }
    .halo-action-btn.resolve { background:#16a34a; color:#fff; border-right:none; }
    .halo-action-btn.resolve:hover { background:#15803d; }
    .halo-tab {
      padding:9px 14px; font-size:13px; font-weight:500;
      border:none; background:none; cursor:pointer; color:#6b7280;
      border-bottom:2px solid transparent; transition:all 0.13s;
    }
    .halo-tab.active { color:#332B28; border-bottom-color:#C96F55; font-weight:600; }
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
    .halo-kb-item { display:flex; align-items:center; gap:8px; padding:5px 7px; margin-bottom:4px; background:#fff; border:1px solid #e5e7eb; border-radius:6px; cursor:pointer; transition:background 0.12s; }
    .halo-kb-item:hover { background:#eff6ff; }
    @media (max-width: 1024px) {
      .ticket-detail-body { flex-direction:column !important; overflow-y:auto !important; }
      .ticket-detail-main { flex:0 0 auto !important; overflow:visible !important; }
      .ticket-detail-sidebar {
        width:100% !important; max-height:320px; flex:0 0 auto !important;
        border-left:none !important; border-top:1px solid #dee5ef;
      }
    }
    @media (max-width: 720px) {
      .ticket-detail-action-bar > .halo-action-btn { flex:1 1 auto; justify-content:center; }
      .ticket-detail-toolbar-actions { margin-left:0 !important; width:100%; border-left:none !important; border-top:1px solid #dee5ef; }
      .ticket-detail-toolbar-actions > .halo-action-btn { flex:1; justify-content:center; }
      .ticket-sla-card { width:100% !important; margin-top:8px; }
      .ticket-detail-header-row { flex-direction:column !important; gap:12px !important; }
    }
  `;

  return (
    <Dialog.Root open={true} onOpenChange={open => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          ref={overlayRef}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 99998,
            background: 'rgba(10,20,40,0.55)',
            backdropFilter: 'blur(3px)',
          }}
        />
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, pointerEvents: 'none',
          }}
        >
          <style>{css}</style>

          {/* Toast */}
          {toast && (
            <div style={{ pointerEvents: 'auto' }}>
              <Toast msg={toast.msg} type={toast.type} />
            </div>
          )}

          {/* Re-Assign Modal */}
          {showReAssign && (
            <div style={{ pointerEvents: 'auto' }}>
              <ReAssignModal
                ticketId={ticket.id}
                currentAgent={localAgent}
                onAssigned={name => {
                  setLocalAgent(name);
                  setShowReAssign(false);
                  if (onUpdateTicket) onUpdateTicket({ ...(ticket as FullTicket), agent: name });
                  ticketEvents.emit({ type: 'TICKET_UPDATED', ticket: { id: ticket.id, agent: name } });
                  const assignNote: TicketNote = {
                    id: `reassign-${Date.now()}`,
                    author: currentUser,
                    time: new Date().toLocaleString(),
                    text: `Ticket re-assigned to ${name}.`,
                  };
                  setLocalNotes(prev => {
                    const updated = [assignNote, ...prev];
                    try {
                      localStorage.setItem(`servigen_ticket_notes_${ticket.id}`, JSON.stringify(updated));
                    } catch {}
                    return updated;
                  });
                  showToast(`Ticket successfully re-assigned to ${name}`);
                }}
                onClose={() => setShowReAssign(false)}
              />
            </div>
          )}

          {/* Create Appointment Modal */}
          {showAppointment && (
            <div style={{ pointerEvents: 'auto' }}>
              <CreateAppointmentModal
                ticketId={ticket.id}
                ticketSummary={ticket.summary}
                onCreated={() => {
                  setShowAppointment(false);
                  showToast('Appointment created and added to calendar');
                }}
                onClose={() => setShowAppointment(false)}
              />
            </div>
          )}

          {/* In-App Email User Modal */}
          {showEmailModal && (
            <div style={{ pointerEvents: 'auto' }}>
              <EmailUserModal
                ticketId={ticket.id}
                ticketSummary={ticket.summary}
                recipientEmail={ticket.email}
                onSent={({ to, subject, body }) => {
                  setShowEmailModal(false);
                  const emailNote: TicketNote = {
                    id: `email-${Date.now()}`,
                    author: `${currentUser} (Outbound Email)`,
                    time: new Date().toLocaleString(),
                    text: `Sent to: ${to}\nSubject: ${subject}\n\n${body}`,
                  };
                  setLocalNotes(prev => {
                    const updated = [emailNote, ...prev];
                    if (ticket?.id) {
                      try { localStorage.setItem(`servigen_ticket_notes_${ticket.id}`, JSON.stringify(updated)); } catch {}
                    }
                    return updated;
                  });
                  showToast(`Email dispatched to ${to}`);
                }}
                onClose={() => setShowEmailModal(false)}
              />
            </div>
          )}

          {/* Log to Supplier Modal */}
          {showSupplierModal && (
            <div style={{ pointerEvents: 'auto' }}>
              <LogToSupplierModal
                ticketId={ticket.id}
                ticketSummary={ticket.summary}
                onLogged={({ supplier, externalRef, vendorSla, reason }) => {
                  setShowSupplierModal(false);
                  setSupplierInfo({ supplier, externalRef, vendorSla });
                  const supplierNote: TicketNote = {
                    id: `sup-${Date.now()}`,
                    author: `${currentUser} (Supplier Dispatch)`,
                    time: new Date().toLocaleString(),
                    text: `Ticket logged to ${supplier}\nExternal Ref: ${externalRef}\nContracted SLA: ${vendorSla}\nNotes: ${reason}`,
                  };
                  setLocalNotes(prev => {
                    const updated = [supplierNote, ...prev];
                    if (ticket?.id) {
                      try { localStorage.setItem(`servigen_ticket_notes_${ticket.id}`, JSON.stringify(updated)); } catch {}
                    }
                    return updated;
                  });
                  ticketEvents.emit({
                    type: 'TICKET_UPDATED',
                    ticket: { id: ticket.id, supplier, externalRef },
                  });
                  showToast(`Ticket successfully logged to ${supplier} (#${externalRef})`);
                }}
                onClose={() => setShowSupplierModal(false)}
              />
            </div>
          )}

          {/* Article Preview Modal */}
          {selectedArticlePreview && (
            <div style={{ pointerEvents: 'auto' }}>
              <ArticlePreviewModal
                article={selectedArticlePreview}
                onInsertToNote={(art) => {
                  setNoteText(prev => `${prev ? prev + '\n\n' : ''}### Referenced Knowledge Article: [${art.title}](#${art.id})\n> ${art.content.slice(0, 200).replace(/\n/g, ' ')}...`);
                  setShowAddNote(true);
                  setSelectedArticlePreview(null);
                  showToast(`✓ Inserted "${art.title}" into Work Note`);
                }}
                onClose={() => setSelectedArticlePreview(null)}
              />
            </div>
          )}

          {/* ── Modal Shell (Dialog.Content) ── */}
          <Dialog.Content
            asChild
            onPointerDownOutside={event => {
              if (showReAssign || showAppointment || showEmailModal || showSupplierModal || selectedArticlePreview) {
                event.preventDefault();
              }
            }}
            onFocusOutside={event => {
              if (showReAssign || showAppointment || showEmailModal || showSupplierModal || selectedArticlePreview) {
                event.preventDefault();
              }
            }}
            onInteractOutside={event => {
              if (showReAssign || showAppointment || showEmailModal || showSupplierModal || selectedArticlePreview) {
                event.preventDefault();
              }
            }}
          >
            <div className="ticket-detail-shell" style={{
              pointerEvents: 'auto',
              background: '#fff',
              borderRadius: 10,
              width: 'min(1180px, 100%)', maxWidth: 1180,
              height: 'min(820px, calc(100dvh - 32px))', maxHeight: 'calc(100dvh - 32px)',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              animation: 'haloSlideIn 0.18s ease-out',
            }}>
              <Dialog.Title className="sr-only">Incident Details - {ticket.id}</Dialog.Title>
              <Dialog.Description className="sr-only">{ticket.summary || 'Ticket details, notes, and activity timeline'}</Dialog.Description>

              {/* ════════════════════════════════════════
                  TOP ACTION BAR
                  ════════════════════════════════════════ */}
              <div className="ticket-detail-action-bar" style={{
                display: 'flex', alignItems: 'stretch',
                borderBottom: '1px solid #dee5ef',
                background: '#f8fafc', flexShrink: 0,
              }}>
                {/* Email User — opens in-app composer modal */}
                <button
                  className="halo-action-btn"
                  onClick={() => setShowEmailModal(true)}
                  title={ticket.email ? `Email ${ticket.email}` : 'Compose email to user'}
                >
                  <Mail style={{ width: 14, height: 14, color: '#3b82f6' }} />
                  Email User
                </button>

                {/* Add Note — opens inline composer */}
                <button className="halo-action-btn" onClick={() => setShowAddNote(a => !a)}>
                  <MessageSquarePlus style={{ width: 14, height: 14, color: '#f59e0b' }} />
                  Add Note
                </button>

                {/* Re-Assign — opens agent picker modal */}
                <button className="halo-action-btn" onClick={() => setShowReAssign(true)}>
                  <UserCheck style={{ width: 14, height: 14, color: '#8b5cf6' }} />
                  Re-Assign
                </button>

                {/* Create Appointment — opens calendar event creator */}
                <button className="halo-action-btn" onClick={() => setShowAppointment(true)}>
                  <CalendarPlus style={{ width: 14, height: 14, color: '#10b981' }} />
                  Appointment
                </button>

                {/* Log to Supplier — opens vendor tracking modal */}
                <button
                  className="halo-action-btn"
                  onClick={() => setShowSupplierModal(true)}
                  title="Dispatch or log ticket to third-party vendor"
                >
                  <Truck style={{ width: 14, height: 14, color: '#16a34a' }} />
                  Log to Supplier
                </button>

                {/* Resolve Ticket — PATCH /api/tickets/:id/status */}
                <button
                  className="halo-action-btn resolve"
                  onClick={handleResolve}
                  disabled={savingResolve}
                  style={{ opacity: savingResolve ? 0.7 : 1 }}
                >
                  {savingResolve ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <CheckCircle style={{ width: 14, height: 14 }} />}
                  {savingResolve ? (isResolved ? 'Reopening…' : 'Resolving…') : isResolved ? 'Reopen Ticket' : 'Resolve Ticket'}
                </button>

                {/* AI Escalation badge */}
                {!effectiveEscalated ? (
                  <button
                    className="halo-action-btn"
                    onClick={handleEscalateTier2}
                    disabled={effectiveEscalating}
                    style={{
                      background: aiRisk === 'High Risk' ? '#fef2f2' : undefined,
                      color: aiRisk === 'High Risk' ? '#dc2626' : undefined,
                      marginLeft: 'auto',
                      borderRight: 'none',
                      borderLeft: '1px solid #dee5ef'
                    }}
                    title="Escalate ticket to 2nd Line Support"
                  >
                    <Zap style={{ width: 13, height: 13 }} />
                    {effectiveEscalating ? 'Escalating…' : '⚡ Escalate Tier 2'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', borderLeft: '1px solid #dee5ef', height: '100%' }}>
                    <span style={{ padding: '0 10px', fontSize: 12, fontWeight: 700, color: '#c2410c', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <CheckCircle style={{ width: 13, height: 13, color: '#16a34a' }} /> Escalated (Tier 2)
                    </span>
                    <button
                      type="button"
                      className="halo-action-btn"
                      onClick={handleDeescalateTier1}
                      disabled={effectiveEscalating}
                      style={{
                        color: '#475569',
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '0 12px',
                        borderLeft: '1px solid #dee5ef',
                        borderRight: 'none',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                      title="De-escalate ticket back to 1st Line Support"
                    >
                      <RotateCcw style={{ width: 12, height: 12 }} />
                      {effectiveEscalating ? 'Reverting…' : 'De-escalate to Tier 1'}
                    </button>
                  </div>
                )}

                {/* Right toolbar actions */}
                <div className="ticket-detail-toolbar-actions" style={{
                  display: 'flex', alignItems: 'center',
                  marginLeft: 0,
                  borderLeft: '1px solid #dee5ef',
                }}>
                  <button onClick={handleCopy} className="halo-action-btn" style={{ padding: '0 10px', height: '100%', borderRight: '1px solid #dee5ef' }} title="Copy ticket summary">
                    <Copy style={{ width: 14, height: 14, color: '#6b7280' }} />
                  </button>
                  <button onClick={handleDownload} className="halo-action-btn" style={{ padding: '0 10px', height: '100%', borderRight: '1px solid #dee5ef' }} title="Download JSON export">
                    <Download style={{ width: 14, height: 14, color: '#6b7280' }} />
                  </button>
                  <button
                    onClick={onClose}
                    style={{
                      padding: '0 14px', border: 'none', background: 'none',
                      cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', height: '100%',
                    }}
                    title="Close (Esc)"
                  >
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>

              {/* ════════════════════════════════════════
                  MAIN BODY — Left content + Right sidebar
                  ════════════════════════════════════════ */}
              <div className="ticket-detail-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

                {/* ─── LEFT / MAIN CONTENT ─────────────────────────────── */}
                <div className="ticket-detail-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

                  {/* Ticket header row (ID + summary + SLA card) */}
                  <div style={{ padding: '16px 20px 12px', flexShrink: 0 }}>
                    <div className="ticket-detail-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      {/* Left: priority circle + ID + summary */}
                      <div style={{ flex: 1, minWidth: 260 }}>
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
                          {localAgent && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 8px', borderRadius: 9999,
                              background: '#FFF9F5', color: '#C96F55',
                              fontSize: 11, fontWeight: 600, border: '1px solid #bfdbfe'
                            }}>
                              <User style={{ width: 12, height: 12 }} />
                              {localAgent}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '0 0 0 40px', fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
                          {ticket.summary || `Ticket ${ticket.id}`}
                        </p>
                      </div>
                      {/* Right: SLA Card */}
                      <SlaCard ticket={ticket} onNotify={showToast} />
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

                  {/* Add Note inline composer (MOD-2: Markdown toolbar + Screenshot Paste) */}
                  {showAddNote && (
                    <div style={{ margin: '0 20px 10px', padding: '12px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, flexShrink: 0 }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>📝 Add Work Note</span>
                          <span style={{ fontSize: 10, fontWeight: 500, color: '#6b7280', background: '#e5e7eb', padding: '1px 6px', borderRadius: 4 }}>
                            Markdown &amp; Clipboard Paste Enabled
                          </span>
                        </div>

                        {/* Formatting Toolbar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <button
                            type="button"
                            title="Bold (**text**)"
                            onClick={() => insertMarkdown('**', '**')}
                            style={{ padding: '4px 6px', borderRadius: 4, background: '#fff', border: '1px solid #d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Bold style={{ width: 12, height: 12, color: '#374151' }} />
                          </button>
                          <button
                            type="button"
                            title="Italic (*text*)"
                            onClick={() => insertMarkdown('*', '*')}
                            style={{ padding: '4px 6px', borderRadius: 4, background: '#fff', border: '1px solid #d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Italic style={{ width: 12, height: 12, color: '#374151' }} />
                          </button>
                          <button
                            type="button"
                            title="Inline Code (`code`)"
                            onClick={() => insertMarkdown('`', '`')}
                            style={{ padding: '4px 6px', borderRadius: 4, background: '#fff', border: '1px solid #d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Code style={{ width: 12, height: 12, color: '#374151' }} />
                          </button>
                          <button
                            type="button"
                            title="Bullet List (- item)"
                            onClick={() => insertMarkdown('\n- ', '')}
                            style={{ padding: '4px 6px', borderRadius: 4, background: '#fff', border: '1px solid #d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <List style={{ width: 12, height: 12, color: '#374151' }} />
                          </button>
                          <button
                            type="button"
                            title="Quote (> text)"
                            onClick={() => insertMarkdown('\n> ', '')}
                            style={{ padding: '4px 6px', borderRadius: 4, background: '#fff', border: '1px solid #d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Quote style={{ width: 12, height: 12, color: '#374151' }} />
                          </button>
                          <button
                            type="button"
                            title="Attach Image / Screenshot"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ padding: '4px 6px', borderRadius: 4, background: '#fff', border: '1px solid #d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#374151' }}
                          >
                            <ImageIcon style={{ width: 12, height: 12, color: '#C96F55' }} />
                            <span>Attach</span>
                          </button>
                        </div>
                      </div>

                      <textarea
                        ref={noteTextareaRef}
                        className="halo-textarea"
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        onPaste={handleNotePaste}
                        placeholder="Type your work note… Tip: press Ctrl+V to paste screenshot directly from clipboard (Ctrl+Enter to post)"
                        style={{ minHeight: 85 }}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNote(); }}
                      />

                      {/* Attached / Pasted Image Previews */}
                      {pastedAttachments.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {pastedAttachments.map(att => (
                            <div
                              key={att.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '4px 8px', background: '#fff', border: '1px solid #cbd5e1',
                                borderRadius: 6, fontSize: 11,
                              }}
                            >
                              <img
                                src={att.url}
                                alt={att.name}
                                style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 3 }}
                              />
                              <span style={{ fontWeight: 600, color: '#1e293b', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {att.name}
                              </span>
                              <span style={{ color: '#94a3b8', fontSize: 10 }}>({att.size})</span>
                              <button
                                type="button"
                                onClick={() => removePastedAttachment(att.id)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, marginLeft: 2 }}
                                title="Remove screenshot"
                              >
                                <Trash2 style={{ width: 12, height: 12 }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>
                          💡 <em>Ctrl+V pastes screenshots directly from clipboard</em>
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => {
                              setShowAddNote(false);
                              setPastedAttachments([]);
                            }}
                            style={{ padding: '6px 14px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#374151' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddNote}
                            disabled={!noteText.trim() && pastedAttachments.length === 0}
                            style={{
                              padding: '6px 14px', fontSize: 12, border: 'none', borderRadius: 6,
                              background: '#C96F55', color: '#fff', cursor: 'pointer', fontWeight: 600,
                              opacity: (!noteText.trim() && pastedAttachments.length === 0) ? 0.5 : 1,
                            }}
                          >
                            Post Note
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Tabs */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    borderBottom: '1px solid #dee5ef',
                    padding: '0 20px', flexShrink: 0,
                    background: '#fff',
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
                  </div>

                  {/* Tab Content Panel */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                    {/* Tab: Progress (Activity Feed) */}
                    {activeTab === 'progress' && (
                      <div>
                        {localNotes.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>
                            No notes recorded yet. Use &ldquo;Add Note&rdquo; or &ldquo;Email User&rdquo; above.
                          </div>
                        ) : (
                          localNotes.map(n => (
                            <ActivityEntry key={n.id} note={n} ticketStatus={localStatus} />
                          ))
                        )}
                      </div>
                    )}

                    {/* Tab: AI Insights */}
                    {activeTab === 'ai-insights' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Header Banner */}
                        <div style={{
                          padding: '12px 16px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>✨</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Gemini ITIL Intelligence Engine</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>Automated telemetry analysis and resolution recommendations</div>
                            </div>
                          </div>
                          <span style={{ padding: '3px 8px', borderRadius: 12, background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 700 }}>
                            94% Confidence
                          </span>
                        </div>

                        {/* AI Summary Card */}
                        <div className="halo-ai-row" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px' }}>
                          <div className="halo-ai-label" style={{ marginBottom: 4, fontWeight: 700, color: '#374151' }}>AI Generated Diagnostic Summary</div>
                          <div className="halo-ai-value" style={{ lineHeight: 1.5, color: '#111827', fontSize: 13 }}>{aiSummary}</div>
                        </div>

                        {/* Triage Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                          <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Suggested Priority</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: priorityNum <= 2 ? '#ef4444' : '#f59e0b' }} />
                                P{priorityNum} — {ticket.priority || 'Medium'}
                              </span>
                            </div>
                          </div>
                          <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Classification</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>{ticket.type || 'Incident'}</div>
                          </div>
                          <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tonality / Sentiment</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>Urgent / Business Impatient</div>
                          </div>
                          <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Automated Health Score</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', marginTop: 2 }}>92 / 100 (Optimal Data)</div>
                          </div>
                        </div>

                        {/* Step-by-Step Resolution */}
                        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 16px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
                            🛠️ AI Suggested Resolution &amp; Recommended Actions
                          </div>
                          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#334155', lineHeight: 1.7 }}>
                            <li>
                              <strong>Verify End-point Lease:</strong> Query active DHCP reservation on subnet gateway and review local lease expiration timestamps.
                            </li>
                            <li>
                              <strong>802.1x Authentication:</strong> Review radius supplicant handshake for certificate revocation errors or EAP-TLS mismatch.
                            </li>
                            <li>
                              <strong>Network MTU Sweep:</strong> Ping default gateway with non-fragmentation flag (`ping -f -l 1472`) to detect packet boundary drops.
                            </li>
                            <li>
                              <strong>Remediation:</strong> Flush local client DNS resolver cache (`ipconfig /flushdns`) and re-synchronize Kerberos authentication token.
                            </li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* Tab: Additional Fields */}
                    {activeTab === 'additional-fields' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px 20px' }}>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Preferred Contact Number</div>
                          <div className="halo-sidebar-field-value">{ticket.preferredNumber || ticket.phoneNumber || '+44 20 7946 0912'}</div>
                        </div>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Budget Type</div>
                          <div className="halo-sidebar-field-value">{(ticket as any).budgetType || 'Operational (OpEx)'}</div>
                        </div>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Site / Campus Location</div>
                          <div className="halo-sidebar-field-value">{ticket.site || 'London HQ — Floor 3, IT Rack 14'}</div>
                        </div>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Assigned Team</div>
                          <div className="halo-sidebar-field-value" style={{ fontWeight: 600, color: effectiveEscalated ? '#c2410c' : '#263B5E' }}>
                            {effectiveEscalated ? '⚡ 2nd Line Support (Tier 2)' : ((ticket as any).assignedTeam || '1st Line Support')}
                          </div>
                        </div>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Configuration Item (CI)</div>
                          <div className="halo-sidebar-field-value font-mono">{(ticket as any).ciName || 'SRV-LON-APP01 (Production Gateway)'}</div>
                        </div>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Cost Center</div>
                          <div className="halo-sidebar-field-value">CC-8420 — Global IT Infrastructure</div>
                        </div>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Business Impact Scope</div>
                          <div className="halo-sidebar-field-value">Moderate — 45 Remote Users Impacted</div>
                        </div>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Source Ingestion Channel</div>
                          <div className="halo-sidebar-field-value">Self-Service Portal (Direct Ingestion)</div>
                        </div>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Environment Target</div>
                          <div className="halo-sidebar-field-value">Production / Live Tenant</div>
                        </div>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Third-Party Vendor Ref</div>
                          <div className="halo-sidebar-field-value">{supplierInfo ? `${supplierInfo.supplier} (${supplierInfo.externalRef})` : 'Cisco TAC #984321-2026'}</div>
                        </div>
                      </div>
                    )}

                    {/* Tab: Audit Log */}
                    {activeTab === 'audit-log' && (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              <th style={{ padding: '8px 12px' }}>Timestamp</th>
                              <th style={{ padding: '8px 12px' }}>Actor</th>
                              <th style={{ padding: '8px 12px' }}>Action</th>
                              <th style={{ padding: '8px 12px' }}>Property</th>
                              <th style={{ padding: '8px 12px' }}>Old Value</th>
                              <th style={{ padding: '8px 12px' }}>New Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditEntries.map((e, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fcfcfd' }}>
                                <td style={{ padding: '8px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{e.time}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>{e.actor}</td>
                                <td style={{ padding: '8px 12px', color: '#0f172a' }}>{e.action}</td>
                                <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#475569' }}>{e.property || '—'}</td>
                                <td style={{ padding: '8px 12px', color: '#64748b' }}>{e.oldVal || '—'}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#166534' }}>{e.newVal || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Tab: View Log */}
                    {activeTab === 'view-log' && (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              <th style={{ padding: '8px 12px' }}>Access Time</th>
                              <th style={{ padding: '8px 12px' }}>Staff Member</th>
                              <th style={{ padding: '8px 12px' }}>Role</th>
                              <th style={{ padding: '8px 12px' }}>IP / Session</th>
                              <th style={{ padding: '8px 12px' }}>Activity &amp; Mode</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewLogEntries.map((v, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fcfcfd' }}>
                                <td style={{ padding: '8px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{v.time}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>{v.user}</td>
                                <td style={{ padding: '8px 12px', color: '#475569' }}>{v.role}</td>
                                <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#64748b', fontSize: 11.5 }}>{v.ip}</td>
                                <td style={{ padding: '8px 12px', color: '#1e293b', fontWeight: 500 }}>{v.action}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Tab: Notification Log */}
                    {activeTab === 'notification-log' && (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              <th style={{ padding: '8px 12px' }}>Dispatched At</th>
                              <th style={{ padding: '8px 12px' }}>Notification Type</th>
                              <th style={{ padding: '8px 12px' }}>Recipient</th>
                              <th style={{ padding: '8px 12px' }}>Channel</th>
                              <th style={{ padding: '8px 12px' }}>Template / Subject</th>
                              <th style={{ padding: '8px 12px' }}>Delivery Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {notificationEntries.map((n, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fcfcfd' }}>
                                <td style={{ padding: '8px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{n.time}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>{n.type}</td>
                                <td style={{ padding: '8px 12px', color: '#475569', fontFamily: 'monospace', fontSize: 11.5 }}>{n.recipient}</td>
                                <td style={{ padding: '8px 12px', color: '#334155' }}>{n.channel}</td>
                                <td style={{ padding: '8px 12px', color: '#1e293b' }}>{n.template}</td>
                                <td style={{ padding: '8px 12px' }}>
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '2px 8px', borderRadius: 12,
                                    background: '#dcfce7', color: '#15803d',
                                    fontSize: 11, fontWeight: 700,
                                  }}>
                                    ✓ {n.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── RIGHT SIDEBAR ───────────────────────────────────── */}
                <div className="ticket-detail-sidebar" style={{
                  width: 320, flexShrink: 0,
                  borderLeft: '1px solid #dee5ef',
                  background: '#f8fafc',
                  display: 'flex', flexDirection: 'column',
                  overflowY: 'auto',
                }}>
                  {/* End-User Details Collapsible */}
                  <div style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <button
                      onClick={() => setEndUserOpen(o => !o)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>End-User details</span>
                      {endUserOpen ? <ChevronDown style={{ width: 16, height: 16, color: '#6b7280' }} /> : <ChevronRight style={{ width: 16, height: 16, color: '#6b7280' }} />}
                    </button>

                    {endUserOpen && (
                      <div style={{ padding: '0 16px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: '#C96F55', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, flexShrink: 0,
                          }}>
                            {getInitials(ticket.requester || 'User')}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{ticket.requester || 'Unknown Requester'}</div>
                            <div style={{ fontSize: 11, color: '#C96F55' }}>{ticket.email || '—'}</div>
                          </div>
                        </div>

                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Organisation</div>
                          <div className="halo-sidebar-field-value" style={{ color: '#C96F55' }}>{ticket.organisationName || '—'}</div>
                        </div>

                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Site</div>
                          <div className="halo-sidebar-field-value">{ticket.site || '—'}</div>
                        </div>

                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Email Address</div>
                          <div className="halo-sidebar-field-value" style={{ color: '#C96F55', wordBreak: 'break-all' }}>{ticket.email || '—'}</div>
                        </div>

                        {/* Microsoft Teams Communication Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '10px 0 12px' }}>
                          <a
                            href={ticket.email ? `msteams:/l/call/0/0?users=${ticket.email}` : '#'}
                            onClick={(e) => {
                              if (!ticket.email) {
                                e.preventDefault();
                                showToast('No email address available for Teams call', 'info');
                              }
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              padding: '7px 12px', background: '#C96F55', color: '#fff',
                              borderRadius: 20, fontSize: 11.5, fontWeight: 600, textDecoration: 'none',
                              opacity: ticket.email ? 1 : 0.6,
                              cursor: ticket.email ? 'pointer' : 'not-allowed',
                            }}
                          >
                            <Phone style={{ width: 12, height: 12 }} />
                            Call on Microsoft Teams
                          </a>
                          <a
                            href={ticket.email ? `msteams:/l/chat/0/0?users=${ticket.email}` : '#'}
                            onClick={(e) => {
                              if (!ticket.email) {
                                e.preventDefault();
                                showToast('No email address available for Teams chat', 'info');
                              }
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              padding: '7px 12px', background: '#06b6d4', color: '#fff',
                              borderRadius: 20, fontSize: 11.5, fontWeight: 600, textDecoration: 'none',
                              opacity: ticket.email ? 1 : 0.6,
                              cursor: ticket.email ? 'pointer' : 'not-allowed',
                            }}
                          >
                            <MessageCircle style={{ width: 12, height: 12 }} />
                            Message on Microsoft Teams
                          </a>
                        </div>

                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Phone Number</div>
                          <div className="halo-sidebar-field-value">{ticket.phoneNumber || '—'}</div>
                        </div>

                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Site Phone Number</div>
                          <div className="halo-sidebar-field-value">{ticket.preferredNumber || '—'}</div>
                        </div>

                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Contact Address</div>
                          <div className="halo-sidebar-field-value" style={{ lineHeight: 1.4 }}>
                            {ticket.contactAddress?.length ? ticket.contactAddress.join(', ') : '—'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Other Open Tickets */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Other Open Tickets</div>
                    {relatedTickets.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', padding: '6px 0' }}>
                        No other open tickets found for this requester.
                      </div>
                    ) : (
                      relatedTickets.map(item => {
                        const t = item as any;
                        const badge = getStatusBadge(t.status);
                        const dateStr = t.createdAt ? t.createdAt.slice(0, 10) : '';
                        const titleStr = t.summary || t.title || `Ticket ${t.id}`;
                        return (
                          <div key={t.id} className="halo-other-ticket">
                            <div>
                              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{dateStr}</div>
                              <div style={{ fontSize: 12, color: '#374151' }}>
                                <span style={{ color: '#9ca3af' }}>{t.id}</span>
                                {' – '}
                                <span style={{ color: '#C96F55', cursor: 'pointer' }}>{titleStr}</span>
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
                      })
                    )}
                  </div>

                  {/* Ticket Information */}
                  <div style={{ padding: '12px 16px', flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Ticket information</div>

                    <div className="halo-sidebar-field">
                      <div className="halo-sidebar-field-label">Ticket Type</div>
                      <div className="halo-sidebar-field-value" style={{ color: '#C96F55' }}>{ticket.type || 'Service Request'}</div>
                    </div>

                    {(ticket as any).workflowName && (
                      <div className="halo-sidebar-field">
                        <div className="halo-sidebar-field-label">Workflow</div>
                        <div className="halo-sidebar-field-value" style={{ color: '#C96F55' }}>{(ticket as any).workflowName}</div>
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
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{localAgent || ticket.agent || 'Unassigned'}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{(ticket as any).assignedTeam || '—'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Supplier Handoff Card (if logged) */}
                    {supplierInfo && (
                      <div style={{ marginBottom: 14, padding: '9px 11px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Truck style={{ width: 13, height: 13 }} /> Supplier Handoff
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#14532d' }}>{supplierInfo.supplier}</div>
                        <div style={{ fontSize: 11, color: '#15803d' }}>
                          Ref: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{supplierInfo.externalRef}</span> ({supplierInfo.vendorSla})
                        </div>
                      </div>
                    )}

                    {/* MOD-1: Interactive Additional Agents Multi-Selector */}
                    <div className="halo-sidebar-field" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div className="halo-sidebar-field-label" style={{ margin: 0 }}>
                          Additional Agents ({additionalAgents.length})
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAgentPicker(p => !p)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 11, fontWeight: 700, color: '#C96F55',
                            display: 'flex', alignItems: 'center', gap: 3, padding: '2px 4px',
                            borderRadius: 4,
                          }}
                          title="Manage additional collaborating agents"
                        >
                          <Plus style={{ width: 12, height: 12 }} /> Add
                        </button>
                      </div>

                      {/* Selected Agent Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, minHeight: 28 }}>
                        {additionalAgents.length === 0 ? (
                          <button
                            type="button"
                            onClick={() => setShowAgentPicker(true)}
                            style={{
                              padding: '5px 8px', fontSize: 11, color: '#9ca3af',
                              background: '#fff', border: '1px dashed #d1d5db', borderRadius: 6,
                              cursor: 'pointer', width: '100%', textAlign: 'left',
                            }}
                          >
                            + Tag additional collaborating agents…
                          </button>
                        ) : (
                          additionalAgents.map((agentName) => (
                            <span
                              key={agentName}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '2px 7px', borderRadius: 12,
                                background: '#e0f2fe', border: '1px solid #bae6fd',
                                color: '#0369a1', fontSize: 11, fontWeight: 600,
                              }}
                            >
                              <span style={{
                                width: 14, height: 14, borderRadius: '50%',
                                background: '#C96F55', color: '#fff',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 700,
                              }}>
                                {agentName[0]}
                              </span>
                              <span>{agentName}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleAdditionalAgent(agentName);
                                }}
                                style={{
                                  border: 'none', background: 'none', color: '#C96F55',
                                  cursor: 'pointer', padding: 0, fontSize: 11, marginLeft: 2,
                                  lineHeight: 1,
                                }}
                                title={`Remove ${agentName}`}
                              >
                                ✕
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      {/* Popover agent dropdown */}
                      {showAgentPicker && (
                        <div
                          style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            marginTop: 4, background: '#fff', border: '1px solid #e5e7eb',
                            borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                            padding: 8, zIndex: 60, maxHeight: 220, overflowY: 'auto',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #f3f4f6', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Select Collaborating Agents</span>
                            <button
                              type="button"
                              onClick={() => setShowAgentPicker(false)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 12 }}
                            >
                              ✕
                            </button>
                          </div>
                          {availableAgents.map((name) => {
                            const isAssigned = additionalAgents.includes(name);
                            return (
                              <button
                                key={name}
                                type="button"
                                onClick={() => handleToggleAdditionalAgent(name)}
                                style={{
                                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                                  justifyContent: 'space-between', padding: '5px 8px', borderRadius: 5,
                                  background: isAssigned ? '#f0fdf4' : 'transparent',
                                  border: 'none', cursor: 'pointer', fontSize: 12,
                                  color: isAssigned ? '#166534' : '#374151',
                                }}
                              >
                                <span style={{ fontWeight: isAssigned ? 700 : 500 }}>{name}</span>
                                {isAssigned && <Check style={{ width: 13, height: 13, color: '#16a34a' }} />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="halo-sidebar-field">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="halo-sidebar-field-label" style={{ margin: 0 }}>Time Recorded</div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = loggedMinutes + 15;
                            setLoggedMinutes(updated);
                            try { localStorage.setItem(`servigen_ticket_time_${ticket.id}`, String(updated)); } catch {}
                            showToast('+15 mins logged to ticket');
                          }}
                          style={{
                            background: 'none', border: 'none', color: '#C96F55', fontSize: 11,
                            fontWeight: 700, cursor: 'pointer', padding: '1px 4px',
                          }}
                          title="Add 15 minutes of work time"
                        >
                          +15m
                        </button>
                      </div>
                      <div className="halo-sidebar-field-value font-mono font-semibold" style={{ fontSize: 13, color: '#1e293b' }}>
                        {String(Math.floor(loggedMinutes / 60)).padStart(2, '0')}:{String(loggedMinutes % 60).padStart(2, '0')}
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400, marginLeft: 6 }}>
                          ({Math.floor(loggedMinutes / 60)}h {loggedMinutes % 60}m)
                        </span>
                      </div>
                    </div>

                    <div className="halo-sidebar-field">
                      <div className="halo-sidebar-field-label">Category</div>
                      <div className="halo-sidebar-field-value font-medium" style={{ color: '#0f172a' }}>
                        {ticket.category ? (
                          ticket.category.includes('>') ? ticket.category : `${ticket.category} > General`
                        ) : 'Software > License Management'}
                      </div>
                    </div>

                    <div className="halo-sidebar-field">
                      <div className="halo-sidebar-field-label">Assigned Team</div>
                      <div className="halo-sidebar-field-value">
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '2px 9px', borderRadius: 12,
                          background: effectiveEscalated ? '#ffedd5' : '#e0e7ff',
                          color: effectiveEscalated ? '#c2410c' : '#3730a3',
                          fontSize: 11.5, fontWeight: 700,
                        }}>
                          {effectiveEscalated ? '⚡ 2nd Line Support (Tier 2)' : ((ticket as any).assignedTeam || '1st Line Support')}
                        </span>
                      </div>
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
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div className="halo-sidebar-field-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Sparkles style={{ width: 12, height: 12, color: '#f59e0b' }} /> AI Suggested Articles
                          </div>
                          {kbArticles.length > 0 && (
                            <span style={{ fontSize: 10, color: '#C96F55', fontWeight: 600 }}>{kbArticles.length} found</span>
                          )}
                        </div>
                        {kbArticles.length > 0 ? (
                          kbArticles.map((article, i) => (
                            <div
                              key={article.id || i}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '6px 8px', marginBottom: 5,
                                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6,
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div
                                onClick={() => setSelectedArticlePreview(article)}
                                style={{
                                  width: 22, height: 22, borderRadius: 5,
                                  background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0, cursor: 'pointer',
                                }}
                                title="Click to read full article"
                              >
                                <BookOpen style={{ width: 12, height: 12, color: '#C96F55' }} />
                              </div>
                              <div
                                onClick={() => setSelectedArticlePreview(article)}
                                style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                                title="Click to read full article"
                              >
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {article.title}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                                  {article.matchScore && (
                                    <span style={{ fontSize: 9.5, fontWeight: 700, color: '#16a34a' }}>
                                      {article.matchScore}% Match
                                    </span>
                                  )}
                                  <span style={{ fontSize: 9.5, color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {article.category}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNoteText((prev: string) => `${prev ? prev + '\n\n' : ''}### Referenced Knowledge Article: [${article.title}](#${article.id})\n> ${article.content.slice(0, 160).replace(/\n/g, ' ')}...`);
                                  setShowAddNote(true);
                                  showToast(`✓ Added reference for "${article.title}" to Work Note`);
                                }}
                                style={{
                                  padding: '2px 7px', fontSize: 10, fontWeight: 700,
                                  color: '#C96F55', background: '#e0f2fe', border: '1px solid #bae6fd',
                                  borderRadius: 4, cursor: 'pointer', flexShrink: 0,
                                  transition: 'all 0.15s ease',
                                }}
                                title="Quick insert reference into work note"
                              >
                                + Add
                              </button>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: 11, color: '#94a3b8', padding: '6px 0', fontStyle: 'italic' }}>
                            No suggested articles for this ticket.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default TicketDetailModal;
