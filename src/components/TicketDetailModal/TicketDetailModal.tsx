import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Mail, MessageSquarePlus, UserCheck, CalendarPlus, Truck, CheckCircle,
  X, ChevronDown, ChevronRight, MessageCircle, Copy, Download,
  User, Zap, FileText, Phone, MapPin, Building2, Lightbulb,
  AlertCircle, ArrowRight, Send, Loader2, Check, BookOpen, Sparkles,
  Bold, Italic, Code, List, Quote, Image as ImageIcon, Paperclip, Trash2, Plus,
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
  const bg = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb';
  return (
    <div style={{
      position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100005,
      background: bg, color: '#fff', padding: '10px 20px',
      borderRadius: 9999, fontSize: 13, fontWeight: 700,
      boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      display: 'flex', alignItems: 'center', gap: 8,
      animation: 'haloSlideIn 0.15s ease-out',
    }}>
      {type === 'success' && <Check style={{ width: 16, height: 16 }} />}
      {type === 'error' && <AlertCircle style={{ width: 16, height: 16 }} />}
      <span>{msg}</span>
    </div>
  );
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
  const rawSla = (ticket as any).slaTime || ticket.targetSla || '';
  let initSecs = 3 * 3600;
  const hm = rawSla.match(/(\d+)\s*h\s*(\d+)?\s*m?/i);
  if (hm) initSecs = parseInt(hm[1]) * 3600 + (hm[2] ? parseInt(hm[2]) * 60 : 0);
  const overdue = rawSla.toLowerCase().includes('overdue') || rawSla.toLowerCase().includes('breach') || initSecs < 0;
  if (overdue) initSecs = -1920;

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
      <div style={{ background: '#16a34a', padding: '8px 12px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Incident SLA
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#d1fae5', marginTop: 1 }}>{priority}</div>
      </div>
      <div style={{ background: '#dc2626', padding: '8px 12px', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
          <SlaClock seconds={initSecs} />
        </div>
      </div>
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
          background: note.author.includes('Email') ? '#2563eb' : note.author.includes('Supplier') ? '#16a34a' : '#dc2626',
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
                      style={{ fontSize: 10, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
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

  useEffect(() => {
    api.get('/api/users?limit=40')
      .then(res => {
        const raw = res.data?.data?.users || res.data?.data || res.data?.users || res.data || [];
        const list = Array.isArray(raw) ? raw : [];
        setAgents(list.filter((u: any) => u.role !== 'End-User'));
      })
      .catch(() => {
        setAgents([
          { id: '1', fullName: 'Alex Rivera', availability: 'Available' },
          { id: '2', fullName: 'Sarah Jenkins', availability: 'In a call' },
          { id: '3', fullName: 'Marcus Vance', availability: 'Available' },
          { id: '4', fullName: 'David Kim', availability: 'Available' },
          { id: '5', fullName: 'Elena Rostova', availability: 'Away' },
        ]);
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
    try {
      await api.patch(`/api/tickets/${ticketId}/assign`, { agentId: agent.id });
    } catch {
      // offline/fallback
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
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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
                {!isSelected && isCurrent && <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 600 }}>Current</span>}
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
      });
      onCreated();
    } catch {
      onCreated();
    }
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100001,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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
    } catch {
      // Backend handles fallback
    }
    onSent({ to, subject, body, postAsNote });
    setSending(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100001,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail style={{ width: 16, height: 16, color: '#2563eb' }} />
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
                background: '#2563eb', color: '#fff', cursor: sending ? 'not-allowed' : 'pointer',
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
    } catch {
      // Backend handles fallback
    }
    onLogged({ supplier, externalRef, vendorSla, reason });
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100001,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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
                color: '#0284c7',
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
                background: '#2563eb',
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
  const overlayRef = useRef<HTMLDivElement>(null);

  // MOD-1: Additional Agents multi-selector state
  const [additionalAgents, setAdditionalAgents] = useState<string[]>([]);
  const [availableAgents, setAvailableAgents] = useState<string[]>([
    'Ken Yang', 'Alex Rivera', 'Sarah Jenkins', 'Marcus Vance', 'Priya Patel', 'David Kim', 'Emma Watson'
  ]);
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  // MOD-2: Rich-Text & Clipboard Paste State
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pastedAttachments, setPastedAttachments] = useState<Array<{ id: string; name: string; url: string; size: string }>>([]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (ticket) {
      const stored = localStorage.getItem(`servigen_ticket_notes_${ticket.id}`);
      let parsedStored: TicketNote[] = [];
      try {
        if (stored) parsedStored = JSON.parse(stored);
      } catch {}

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
      setLocalStatus(ticket.status || 'New');
      setLocalAgent(ticket.agent || '');
      setIsResolved(ticket.status === 'Resolved' || ticket.status === 'Closed');

      // Initialize additional agents
      const rawAdd = (ticket as any).additionalAgents;
      if (Array.isArray(rawAdd)) {
        setAdditionalAgents(rawAdd);
      } else if (typeof rawAdd === 'string' && rawAdd && rawAdd !== 'Not set') {
        setAdditionalAgents(rawAdd.split(',').map((s: string) => s.trim()).filter(Boolean));
      } else {
        setAdditionalAgents([]);
      }
    }
  }, [ticket]);

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
            setAvailableAgents(Array.from(new Set([...names, 'Ken Yang', 'Alex Rivera', 'Sarah Jenkins', 'Marcus Vance'])));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleAdditionalAgent = async (agentName: string) => {
    if (!ticket?.id) return;
    const updated = additionalAgents.includes(agentName)
      ? additionalAgents.filter(a => a !== agentName)
      : [...additionalAgents, agentName];
    setAdditionalAgents(updated);
    try {
      await api.patch(`/api/tickets/${ticket.id}`, { additionalAgents: updated.join(', ') });
    } catch {}
    ticketEvents.emit({ type: 'TICKET_UPDATED', ticket: { id: ticket.id, additionalAgents: updated.join(', ') } });
    showToast(additionalAgents.includes(agentName) ? `Removed ${agentName}` : `Tagged ${agentName}`);
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
    api.get(`/api/tickets/${ticket.id}/related`)
      .then(r => setRelatedTickets(r.data?.data || []))
      .catch(() => setRelatedTickets([]));
  }, [ticket?.id]);

  // Load KB articles dynamically relevant to this ticket
  useEffect(() => {
    if (!ticket) return;
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

  const handleAddNote = () => {
    if (!noteText.trim() && pastedAttachments.length === 0) return;
    const newNote: TicketNote = {
      id: `n-${Date.now()}`,
      author: currentUser,
      time: new Date().toLocaleString(),
      text: noteText.trim() || 'Attached screenshot / note update.',
      attachments: pastedAttachments.length > 0 ? [...pastedAttachments] : undefined,
    };
    setLocalNotes(prev => {
      const updated = [newNote, ...prev];
      if (ticket?.id) {
        try { localStorage.setItem(`servigen_ticket_notes_${ticket.id}`, JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    setNoteText('');
    setPastedAttachments([]);
    setShowAddNote(false);
    showToast('Work note posted successfully');
  };

  const handleResolve = async () => {
    setSavingResolve(true);
    try {
      await api.patch(`/api/tickets/${ticket.id}/status`, { status: 'Resolved' });
      setLocalStatus('Resolved');
      setIsResolved(true);
      if (onUpdateTicket) onUpdateTicket({ ...(ticket as FullTicket), status: 'Resolved' });
      ticketEvents.emit({ type: 'TICKET_UPDATED', ticket: { id: ticket.id, status: 'Resolved' } });
      showToast('Ticket resolved successfully');
    } catch {
      setLocalStatus('Resolved');
      setIsResolved(true);
      if (onUpdateTicket) onUpdateTicket({ ...(ticket as FullTicket), status: 'Resolved' });
      ticketEvents.emit({ type: 'TICKET_UPDATED', ticket: { id: ticket.id, status: 'Resolved' } });
      showToast('Ticket resolved (offline)', 'info');
    }
    setSavingResolve(false);
  };

  const handleCopy = () => {
    const text = `Ticket: ${ticket.id}\nSummary: ${ticket.summary}\nStatus: ${localStatus}\nPriority: ${ticket.priority}\nAgent: ${localAgent || 'Unassigned'}\nURL: ${window.location.href}`;
    navigator.clipboard.writeText(text).then(() => showToast('Ticket details copied to clipboard'));
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

  const aiSummary = `User reports issue with ${ticket.category || 'their request'}. ${ticket.description ? ticket.description.slice(0, 120) + (ticket.description.length > 120 ? '...' : '') : 'No additional details provided.'}`;

  const auditEntries = [
    { actor: ticket.requester || 'End User', action: 'Ticket created', time: ticket.createdAt || 'Earlier' },
    { actor: localAgent || ticket.agent || 'System', action: 'Assigned to agent', time: 'Recently' },
    ...(supplierInfo ? [{ actor: currentUser, action: `Logged to ${supplierInfo.supplier} (Ref: ${supplierInfo.externalRef})`, time: 'Recently' }] : []),
    ...(isEscalated ? [{ actor: currentUser, action: 'Escalated to Tier 2', time: 'Just now' }] : []),
    ...(isResolved ? [{ actor: currentUser, action: 'Ticket resolved', time: 'Just now' }] : []),
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
    .halo-kb-item { display:flex; align-items:center; gap:8px; padding:5px 7px; margin-bottom:4px; background:#fff; border:1px solid #e5e7eb; border-radius:6px; cursor:pointer; transition:background 0.12s; }
    .halo-kb-item:hover { background:#eff6ff; }
    @media (max-width: 1366px) {
      .ticket-detail-sidebar { width: 270px !important; }
    }
    @media (max-width: 1024px) {
      .ticket-detail-sidebar { display: none !important; }
    }
  `;

  return (
    <Dialog.Root open={true} onOpenChange={open => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          ref={overlayRef}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(10,20,40,0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <style>{css}</style>

          {/* Toast */}
          {toast && <Toast msg={toast.msg} type={toast.type} />}

          {/* Re-Assign Modal */}
          {showReAssign && (
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
          )}

          {/* Create Appointment Modal */}
          {showAppointment && (
            <CreateAppointmentModal
              ticketId={ticket.id}
              ticketSummary={ticket.summary}
              onCreated={() => {
                setShowAppointment(false);
                showToast('Appointment created and added to calendar');
              }}
              onClose={() => setShowAppointment(false)}
            />
          )}

          {/* In-App Email User Modal */}
          {showEmailModal && (
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
          )}

          {/* Log to Supplier Modal */}
          {showSupplierModal && (
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
          )}

          {/* Article Preview Modal */}
          {selectedArticlePreview && (
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
          )}

          {/* ── Modal Shell (Dialog.Content) ── */}
          <Dialog.Content asChild>
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
              <Dialog.Title className="sr-only">Incident Details - {ticket.id}</Dialog.Title>
              <Dialog.Description className="sr-only">{ticket.summary || 'Ticket details, notes, and activity timeline'}</Dialog.Description>

              {/* ════════════════════════════════════════
                  TOP ACTION BAR
                  ════════════════════════════════════════ */}
              <div style={{
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
                  Create Appointme…
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
                  disabled={isResolved || savingResolve}
                  style={{ opacity: (isResolved || savingResolve) ? 0.7 : 1 }}
                >
                  {savingResolve ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <CheckCircle style={{ width: 14, height: 14 }} />}
                  {isResolved ? 'Resolved ✓' : savingResolve ? 'Resolving…' : 'Resolve Ticket'}
                </button>

                {/* AI Escalation badge */}
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

                {/* Right toolbar actions */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  marginLeft: (aiRisk === 'High Risk' && onEscalateToTier2 && !isEscalated) || isEscalated ? 0 : 'auto',
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
                          {localAgent && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 8px', borderRadius: 9999,
                              background: '#eff6ff', color: '#1d4ed8',
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
                            <ImageIcon style={{ width: 12, height: 12, color: '#2563eb' }} />
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
                              background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600,
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
                      <div style={{ maxWidth: 640 }}>
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
                          <div className="halo-ai-value">{ticket.type || 'Request'}</div>
                        </div>
                        <div className="halo-ai-row">
                          <div className="halo-ai-label">AI Tonality</div>
                          <div className="halo-ai-value">Neutral</div>
                        </div>
                        <div className="halo-ai-row">
                          <div className="halo-ai-label">AI Suggested Resolution &amp; Recommended Actions</div>
                          <div className="halo-ai-value" style={{ lineHeight: 1.6 }}>
                            {ticket.category?.includes('Network')
                              ? 'Inspect local switch port negotiation and verify DHCP reservation table. Run traceroute to gateway and verify 802.1x supplicant authentication logs.'
                              : ticket.category?.includes('Software')
                              ? 'Review active application session tokens. If MFA loop persists, clear browser credential manager cache and re-issue Azure AD Kerberos ticket.'
                              : 'Review extension mapping in IP-PBX admin portal. Update softphone profile to target new workstation IP address and restart desktop telephony client.'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab: Additional Fields */}
                    {activeTab === 'additional-fields' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Preferred Contact Number</div>
                          <div className="halo-sidebar-field-value">{ticket.preferredNumber || ticket.phoneNumber || 'Not provided'}</div>
                        </div>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Budget Type</div>
                          <div className="halo-sidebar-field-value">{(ticket as any).budgetType || 'Operational (OpEx)'}</div>
                        </div>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Site / Campus Location</div>
                          <div className="halo-sidebar-field-value">{ticket.site || 'Corporate HQ – Main Campus'}</div>
                        </div>
                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Assigned Team</div>
                          <div className="halo-sidebar-field-value">{(ticket as any).assignedTeam || '1st Line Support'}</div>
                        </div>
                      </div>
                    )}

                    {/* Tab: Audit Log */}
                    {activeTab === 'audit-log' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {auditEntries.map((e, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f9fafb', borderRadius: 6, fontSize: 12.5 }}>
                            <span style={{ color: '#111827', fontWeight: 500 }}>{e.actor} — {e.action}</span>
                            <span style={{ color: '#9ca3af', fontSize: 11 }}>{e.time}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab: View Log */}
                    {activeTab === 'view-log' && (
                      <div style={{ fontSize: 12.5, color: '#6b7280' }}>
                        <p style={{ margin: 0 }}>Viewed by <strong>{currentUser}</strong> at {new Date().toLocaleTimeString()} (active session).</p>
                        <p style={{ marginTop: 6 }}>Previous viewer: <em>System Manager</em> (yesterday 17:42).</p>
                      </div>
                    )}

                    {/* Tab: Notification Log */}
                    {activeTab === 'notification-log' && (
                      <div style={{ fontSize: 12.5, color: '#6b7280' }}>
                        <div style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: 6, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: '#111827' }}>Ticket Intake Email:</span> Sent confirmation receipt to {ticket.email || 'requester'} ({ticket.createdAt || 'on open'}).
                        </div>
                        {isEscalated && (
                          <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 6, marginBottom: 6, color: '#991b1b' }}>
                            <span style={{ fontWeight: 600 }}>Tier 2 Escalation Notification:</span> Dispatched to 2nd Line Support lead queue.
                          </div>
                        )}
                        {supplierInfo && (
                          <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, color: '#166534' }}>
                            <span style={{ fontWeight: 600 }}>Supplier Dispatch:</span> External ticket created with {supplierInfo.supplier} (Ref: {supplierInfo.externalRef}).
                          </div>
                        )}
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
                            background: '#0284c7', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, flexShrink: 0,
                          }}>
                            {getInitials(ticket.requester || 'User')}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{ticket.requester || 'Unknown Requester'}</div>
                            <div style={{ fontSize: 11, color: '#0284c7' }}>{ticket.email || '—'}</div>
                          </div>
                        </div>

                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Organisation</div>
                          <div className="halo-sidebar-field-value" style={{ color: '#2563eb' }}>{ticket.organisationName || '—'}</div>
                        </div>

                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Site</div>
                          <div className="halo-sidebar-field-value">{ticket.site || '—'}</div>
                        </div>

                        <div className="halo-sidebar-field">
                          <div className="halo-sidebar-field-label">Email Address</div>
                          <div className="halo-sidebar-field-value" style={{ color: '#2563eb', wordBreak: 'break-all' }}>{ticket.email || '—'}</div>
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
                              padding: '7px 12px', background: '#0284c7', color: '#fff',
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
                                <span style={{ color: '#2563eb', cursor: 'pointer' }}>{titleStr}</span>
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
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{localAgent || ticket.agent || 'Unassigned'}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{(ticket as any).assignedTeam || '1st Line Support'}</div>
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
                            fontSize: 11, fontWeight: 700, color: '#eb6a47',
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
                                background: '#0284c7', color: '#fff',
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
                                  border: 'none', background: 'none', color: '#0284c7',
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
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div className="halo-sidebar-field-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Sparkles style={{ width: 12, height: 12, color: '#f59e0b' }} /> AI Suggested Articles
                          </div>
                          {kbArticles.length > 0 && (
                            <span style={{ fontSize: 10, color: '#0284c7', fontWeight: 600 }}>{kbArticles.length} found</span>
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
                                <BookOpen style={{ width: 12, height: 12, color: '#0284c7' }} />
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
                                  color: '#0284c7', background: '#e0f2fe', border: '1px solid #bae6fd',
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
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default TicketDetailModal;
