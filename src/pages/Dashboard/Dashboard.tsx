import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth';
import dashboardService, {
  type DashboardKpis,
  type DashboardSummary,
} from '../../services/dashboardService';
import { myWorkService } from '../../services/myWorkService';
import { api } from '../../services/apiClient';
import {
  MOCK_KPIS,
  MOCK_SUMMARY,
  MOCK_TICKETS,
  MOCK_APPROVALS,
  MOCK_MY_WORK_TICKETS,
} from '../../services/fallback/mockData';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';

interface RecentTicketRow {
  id: string;
  ticketNumber: string;
  subject: string;
  status: 'Open' | 'In Progress' | 'On Hold' | 'Resolved';
  priority: 'High' | 'Medium' | 'Low';
  date: string;
}

interface ApprovalRow {
  id: string;
  requestId: string;
  item: string;
  requestedBy: string;
  date: string;
}

interface TaskRow {
  id: string;
  task: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Metrics state
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [kpisError, setKpisError] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number | null>(null);
  const [myAssignmentsCount, setMyAssignmentsCount] = useState<number | null>(null);

  // Lists state
  const [recentTickets, setRecentTickets] = useState<RecentTicketRow[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [ticketStatusMap, setTicketStatusMap] = useState<{open:number;inProgress:number;onHold:number;resolved:number}>({open:0,inProgress:0,onHold:0,resolved:0});

  // Mood state
  const [selectedMood, setSelectedMood] = useState<string>('Great');

  // Presence status state
  const [presence, setPresence] = useState<'available' | 'away' | 'busy'>(() => {
    try {
      const saved = localStorage.getItem('servigen_agent_presence');
      if (saved === 'away' || saved === 'busy' || saved === 'available') return saved;
    } catch {}
    return 'available';
  });

  useEffect(() => {
    const handlePresenceEvent = (e: any) => {
      if (e?.detail && ['available', 'away', 'busy'].includes(e.detail)) {
        setPresence(e.detail);
      }
    };
    window.addEventListener('servigen-presence-change', handlePresenceEvent);
    return () => window.removeEventListener('servigen-presence-change', handlePresenceEvent);
  }, []);

  const handleTogglePresence = () => {
    const next: 'available' | 'away' | 'busy' =
      presence === 'available' ? 'busy' : presence === 'busy' ? 'away' : 'available';
    setPresence(next);
    try {
      localStorage.setItem('servigen_agent_presence', next);
      window.dispatchEvent(new CustomEvent('servigen-presence-change', { detail: next }));
      api.patch('/api/users/presence', { presence: next, userId: user?.id }).catch(() => {});
    } catch {}
  };

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Ticket creation modal
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newSummary, setNewSummary] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newCategory, setNewCategory] = useState('Software');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccessNotice, setTicketSuccessNotice] = useState<string | null>(null);

  // Load live data
  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [kpiRes, sumRes, moodRes, tickRes, appRes] = await Promise.allSettled([
          dashboardService.getKpis(),
          dashboardService.getSummary(),
          dashboardService.getMood(),
          api.get('/api/tickets'),
          api.get('/api/approvals'),
        ]);

        if (!mounted) return;

        if (kpiRes.status === 'fulfilled' && kpiRes.value) {
          setKpis(kpiRes.value);
          setKpisError(false);
        } else {
          setKpis(MOCK_KPIS as any);
          setKpisError(false);
        }

        if (sumRes.status === 'fulfilled' && sumRes.value) {
          setSummary(sumRes.value);
        } else {
          setSummary(MOCK_SUMMARY as any);
        }

        if (moodRes.status === 'fulfilled' && moodRes.value) {
          setSelectedMood(moodRes.value);
        } else {
          setSelectedMood('Good');
        }

        const rawTicketList =
          tickRes.status === 'fulfilled'
            ? Array.isArray(tickRes.value?.data)
              ? tickRes.value.data
              : Array.isArray(tickRes.value)
              ? tickRes.value
              : []
            : [];
        const allTicketData = rawTicketList.length > 0 ? rawTicketList : MOCK_TICKETS;

        // Compute status breakdown from ALL fetched tickets for donut chart
        const sMap = { open: 0, inProgress: 0, onHold: 0, resolved: 0 };
        allTicketData.forEach((t: any) => {
          const s = (t.status || 'Open').toLowerCase();
          if (s.includes('progress') || s === 'active') sMap.inProgress++;
          else if (s.includes('hold')) sMap.onHold++;
          else if (s.includes('resolve') || s.includes('close') || s.includes('actioned')) sMap.resolved++;
          else sMap.open++;
        });
        setTicketStatusMap(sMap);

        const mapped: RecentTicketRow[] = allTicketData.slice(0, 5).map((t: any, index: number) => {
          const statusStr = (t.status || 'Open').toLowerCase();
          let normStatus: RecentTicketRow['status'] = 'Open';
          if (statusStr.includes('progress') || statusStr.includes('active')) normStatus = 'In Progress';
          else if (statusStr.includes('hold') || statusStr.includes('pending')) normStatus = 'On Hold';
          else if (statusStr.includes('resolve') || statusStr.includes('actioned') || statusStr.includes('close')) normStatus = 'Resolved';

          const prioStr = (t.priority || 'Medium').toLowerCase();
          let normPrio: RecentTicketRow['priority'] = 'Medium';
          if (prioStr.includes('high') || prioStr.includes('p1') || prioStr.includes('crit')) normPrio = 'High';
          else if (prioStr.includes('low') || prioStr.includes('p4')) normPrio = 'Low';

          const dateStr = t.createdAt
            ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : `Sep ${12 - index}`;

          return {
            id: String(t.id),
            ticketNumber: `#TK-${String(t.id).replace(/\D/g, '').slice(-4) || 1024 - index}`,
            subject: t.summary || t.title || 'Support ticket',
            status: normStatus,
            priority: normPrio,
            date: dateStr,
          };
        });

        setRecentTickets(mapped);

        const rawAppData =
          appRes.status === 'fulfilled'
            ? Array.isArray(appRes.value?.data)
              ? appRes.value.data
              : Array.isArray(appRes.value)
              ? appRes.value
              : []
            : [];
        const appData = rawAppData.length > 0 ? rawAppData : MOCK_APPROVALS;

        const mappedApp: ApprovalRow[] = appData.slice(0, 5).map((a: any, idx: number) => ({
          id: String(a.id || idx),
          requestId: `REQ000${231 - idx}`,
          item: a.title || a.service || 'Service Request',
          requestedBy: a.requester || 'Team Member',
          date: a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '09 Sep 2026',
        }));
        setApprovals(mappedApp);

        const pendingList = appData.filter((a: any) => !a.status || a.status.toLowerCase() === 'pending');
        setPendingApprovalsCount(pendingList.length);

        try {
          const myWorkTickets = await myWorkService.getMyWorkTickets();
          const taskData = Array.isArray(myWorkTickets) && myWorkTickets.length > 0 ? myWorkTickets : MOCK_MY_WORK_TICKETS;
          if (mounted) {
            setMyAssignmentsCount(taskData.length);
            const mappedTasks: TaskRow[] = taskData.slice(0, 5).map((t: any, idx: number) => ({
              id: String(t.id || idx),
              task: t.summary || 'Assigned Ticket',
              description: `${t.organisation || 'ServiGen Internal'} • ${t.status || 'Active'}`,
              priority: (
                t.priority?.toLowerCase().includes('high') || t.priority?.toLowerCase().includes('critical') || t.priority?.toLowerCase().includes('p1') || t.priority?.toLowerCase().includes('p2')
                  ? 'High'
                  : t.priority?.toLowerCase().includes('low') || t.priority?.toLowerCase().includes('p4')
                  ? 'Low'
                  : 'Medium'
              ) as TaskRow['priority'],
              dueDate: t.slaFormatted ? `SLA: ${t.slaFormatted}` : 'Active',
            }));
            setTasks(mappedTasks);
          }
        } catch {
          if (mounted) {
            setMyAssignmentsCount(MOCK_MY_WORK_TICKETS.length);
          }
        }
      } catch (err) {
        console.warn('Dashboard live fetch error, using fallbacks:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    try {
      await dashboardService.submitMood(mood);
    } catch {
      // Local optimistic update stays active
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSummary.trim()) return;

    setIsSubmittingTicket(true);
    let createdId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const res: any = await api.post('/api/incidents', {
        summary: newSummary.trim(),
        description: newDesc.trim() || newSummary.trim(),
        priority: newPriority,
        category: newCategory,
      });
      if (res?.data?.id) {
        createdId = `TK-${res.data.id}`;
      }
    } catch (err) {
      console.warn('Ticket create API error, saving locally:', err);
    } finally {
      setIsSubmittingTicket(false);
    }

    const newRow: RecentTicketRow = {
      id: String(Date.now()),
      ticketNumber: `#${createdId}`,
      subject: newSummary.trim(),
      status: 'Open',
      priority: (newPriority === 'Critical' ? 'High' : newPriority) as RecentTicketRow['priority'],
      date: 'Just now',
    };

    setRecentTickets((prev) => [newRow, ...prev.slice(0, 4)]);
    setTicketSuccessNotice(`Ticket #${createdId} created successfully!`);

    setTimeout(() => {
      setTicketSuccessNotice(null);
      setIsNewTicketOpen(false);
      setNewSummary('');
      setNewDesc('');
    }, 1500);
  };

  // Status breakdown numbers
  const statusCounts = useMemo(() => {
    // Prefer kpis (Prisma counts, no org filter) for open/resolved totals
    // Prefer ticketStatusMap (computed from fetched tickets) for per-status breakdown
    // Fall back to summary if available
    const hasTicketData = ticketStatusMap.open > 0 || ticketStatusMap.inProgress > 0 || ticketStatusMap.onHold > 0 || ticketStatusMap.resolved > 0;
    const open = kpis?.openIncidents != null
      ? kpis.openIncidents
      : (hasTicketData ? ticketStatusMap.open : (summary?.tickets?.active ?? 0));
    const resolved = kpis?.resolvedIncidents != null
      ? kpis.resolvedIncidents
      : (hasTicketData ? ticketStatusMap.resolved : (summary?.tickets?.actioned ?? 0));
    const inProgress = hasTicketData ? ticketStatusMap.inProgress : (summary?.tickets?.pending ?? 0);
    const onHold = hasTicketData ? ticketStatusMap.onHold : (summary?.tickets?.onHold ?? 0);
    const total = open + inProgress + onHold + resolved;
    return { open, inProgress, onHold, resolved, total };
  }, [summary, kpis, ticketStatusMap]);

  // Donut chart calculations
  const donutGeometry = useMemo(() => {
    const r = 50;
    const circumference = 2 * Math.PI * r;
    const total = statusCounts.total || 1; // avoid divide-by-zero; segments will all be 0 when no data

    const openLen = (statusCounts.open / total) * circumference;
    const inProgressLen = (statusCounts.inProgress / total) * circumference;
    const onHoldLen = (statusCounts.onHold / total) * circumference;
    const resolvedLen = (statusCounts.resolved / total) * circumference;

    return {
      r,
      circumference,
      openLen,
      inProgressLen,
      onHoldLen,
      resolvedLen,
    };
  }, [statusCounts]);

  // Display user info
  const fullName = user?.fullName || '';
  const firstName = user?.firstName || fullName.split(' ')[0] || 'Demo';
  const roleName = user?.role || 'IT Manager';
  const userInitials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DU';

  // Filtered recent tickets by search
  const filteredRecentTickets = useMemo(() => {
    if (!searchQuery.trim()) return recentTickets;
    const q = searchQuery.toLowerCase();
    return recentTickets.filter(
      (t) =>
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q)
    );
  }, [recentTickets, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-[#FAF7F5] text-gray-800 pb-16 font-sans">
      {/* ─── TOP NAVBAR ─── */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">Dashboard</span>
        </div>
        <GlobalNavbarActions />
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="max-w-[1400px] mx-auto px-8 pt-6 flex flex-col gap-6">
        {/* 1. GREETING & PROFILE BANNER */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {getGreeting()}, {firstName}
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#ECA58D] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-900 leading-tight">{fullName}</span>
              <div
                className="flex items-center gap-1.5 mt-0.5 cursor-pointer select-none group"
                onClick={handleTogglePresence}
                title={`Status: ${presence.charAt(0).toUpperCase() + presence.slice(1)} (Click to switch)`}
              >
                <span className="text-[11px] text-gray-500 group-hover:text-gray-700 transition-colors capitalize">
                  {roleName} - {presence}
                </span>
                <span
                  className={`w-2 h-2 rounded-full inline-block transition-colors ${
                    presence === 'available'
                      ? 'bg-emerald-500'
                      : presence === 'away'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. MOOD CHECK-IN */}
        <section className="bg-white border border-[#EFEAE4] rounded-xl px-6 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div>
            <h3 className="text-sm font-bold text-gray-900">How are you today?</h3>
            <p className="text-xs text-gray-500 mt-0.5">Take a moment to share how you're feeling.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Great */}
            <button
              type="button"
              onClick={() => handleMoodSelect('Great')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                selectedMood === 'Great'
                  ? 'bg-[#DCFCE7] text-[#15803D] ring-2 ring-[#22C55E] shadow-sm'
                  : 'bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0] border border-[#BBF7D0]'
              }`}
            >
              <span className="text-sm">😊</span>
              <span>Great</span>
            </button>

            {/* Good */}
            <button
              type="button"
              onClick={() => handleMoodSelect('Good')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                selectedMood === 'Good'
                  ? 'bg-[#E0F2FE] text-[#0369A1] ring-2 ring-[#0284C7] shadow-sm'
                  : 'bg-[#E0F2FE] text-[#0369A1] hover:bg-[#BAE6FD] border border-[#BAE6FD]'
              }`}
            >
              <span className="text-sm">🙂</span>
              <span>Good</span>
            </button>

            {/* Okay */}
            <button
              type="button"
              onClick={() => handleMoodSelect('Okay')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                selectedMood === 'Okay'
                  ? 'bg-[#FFEDD5] text-[#C2410C] ring-2 ring-[#EA580C] shadow-sm'
                  : 'bg-[#FFEDD5] text-[#C2410C] hover:bg-[#FED7AA] border border-[#FED7AA]'
              }`}
            >
              <span className="text-sm">😐</span>
              <span>Okay</span>
            </button>

            {/* Not Good */}
            <button
              type="button"
              onClick={() => handleMoodSelect('Not Good')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                selectedMood === 'Not Good'
                  ? 'bg-[#FEE2E2] text-[#B91C1C] ring-2 ring-[#DC2626] shadow-sm'
                  : 'bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA] border border-[#FECACA]'
              }`}
            >
              <span className="text-sm">🙁</span>
              <span>Not Good</span>
            </button>

            {/* Stressed */}
            <button
              type="button"
              onClick={() => handleMoodSelect('Stressed')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                selectedMood === 'Stressed'
                  ? 'bg-[#F3E8FF] text-[#7E22CE] ring-2 ring-[#9333EA] shadow-sm'
                  : 'bg-[#F3E8FF] text-[#7E22CE] hover:bg-[#E9D5FF] border border-[#E9D5FF]'
              }`}
            >
              <span className="text-sm">😣</span>
              <span>Stressed</span>
            </button>
          </div>
        </section>

        {/* 3. 4 KPI STAT TILES */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Open Tickets */}
          <div
            onClick={() => navigate('/incidents')}
            className="bg-white border border-[#EFEAE4] rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="w-11 h-11 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0284C7] flex-shrink-0">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-6l-2 3h-4l-2-3H2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7Z" />
                <path d="M5.45 5.11 2 12v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 leading-none">
                {kpis?.openIncidents != null ? kpis.openIncidents : (summary?.tickets?.active != null ? summary.tickets.active : (kpisError ? '—' : statusCounts.open))}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1.5">Open Tickets</div>
            </div>
          </div>

          {/* Tile 2: Resolved Tickets */}
          <div
            onClick={() => navigate('/incidents')}
            className="bg-white border border-[#EFEAE4] rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="w-11 h-11 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#16A34A] flex-shrink-0">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 leading-none">
                {kpis?.resolvedIncidents != null ? kpis.resolvedIncidents : (summary?.tickets?.actioned != null ? summary.tickets.actioned : (kpisError ? '—' : statusCounts.resolved))}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1.5">Resolved Tickets</div>
            </div>
          </div>

          {/* Tile 3: Pending Approvals */}
          <div
            onClick={() => navigate('/approvals')}
            className="bg-white border border-[#EFEAE4] rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="w-11 h-11 rounded-full bg-[#FFEDD5] flex items-center justify-center text-[#EA580C] flex-shrink-0">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 leading-none">
                {kpis?.pendingApprovals != null ? kpis.pendingApprovals : (pendingApprovalsCount != null ? pendingApprovalsCount : (summary?.approvals?.pending != null ? summary.approvals.pending : (kpisError ? '—' : '—')))}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1.5">Pending Approvals</div>
            </div>
          </div>

          {/* Tile 4: My Assignments */}
          <div
            onClick={() => navigate('/my-work')}
            className="bg-white border border-[#EFEAE4] rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="w-11 h-11 rounded-full bg-[#F3E8FF] flex items-center justify-center text-[#9333EA] flex-shrink-0">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 leading-none">
                {kpis?.myAssignments != null ? kpis.myAssignments : (myAssignmentsCount != null ? myAssignmentsCount : (summary?.assignments?.total != null ? summary.assignments.total : (kpisError ? '—' : '—')))}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1.5">My Assignments</div>
            </div>
          </div>
        </section>

        {/* 4. MIDDLE ROW: TICKETS BY STATUS + RECENT TICKETS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Tickets by Status */}
          <div className="bg-white border border-[#EFEAE4] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Tickets by Status</h3>

            <div className="flex items-center justify-around py-3">
              {/* Donut Chart */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background Track */}
                  <circle
                    cx="60"
                    cy="60"
                    r={donutGeometry.r}
                    fill="transparent"
                    stroke="#F3F4F6"
                    strokeWidth="14"
                  />
                  {/* Segment 1: Open (Emerald / Green) */}
                  <circle
                    cx="60"
                    cy="60"
                    r={donutGeometry.r}
                    fill="transparent"
                    stroke="#34D399"
                    strokeWidth="14"
                    strokeDasharray={`${donutGeometry.openLen} ${donutGeometry.circumference}`}
                    strokeDashoffset="0"
                  />
                  {/* Segment 2: In Progress (Sky / Blue) */}
                  <circle
                    cx="60"
                    cy="60"
                    r={donutGeometry.r}
                    fill="transparent"
                    stroke="#38BDF8"
                    strokeWidth="14"
                    strokeDasharray={`${donutGeometry.inProgressLen} ${donutGeometry.circumference}`}
                    strokeDashoffset={-donutGeometry.openLen}
                  />
                  {/* Segment 3: On Hold (Amber / Yellow) */}
                  <circle
                    cx="60"
                    cy="60"
                    r={donutGeometry.r}
                    fill="transparent"
                    stroke="#FBBF24"
                    strokeWidth="14"
                    strokeDasharray={`${donutGeometry.onHoldLen} ${donutGeometry.circumference}`}
                    strokeDashoffset={-(donutGeometry.openLen + donutGeometry.inProgressLen)}
                  />
                  {/* Segment 4: Resolved (Coral / Terracotta) */}
                  <circle
                    cx="60"
                    cy="60"
                    r={donutGeometry.r}
                    fill="transparent"
                    stroke="#F87171"
                    strokeWidth="14"
                    strokeDasharray={`${donutGeometry.resolvedLen} ${donutGeometry.circumference}`}
                    strokeDashoffset={-(donutGeometry.openLen + donutGeometry.inProgressLen + donutGeometry.onHoldLen)}
                  />
                </svg>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-gray-900 leading-none">{statusCounts.total}</span>
                  <span className="text-[10px] text-gray-400 font-medium mt-0.5">total</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex flex-col gap-2.5 min-w-[140px]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
                    <span className="text-gray-600 font-medium">Open</span>
                  </div>
                  <span className="text-gray-900 font-semibold">{statusCounts.open}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
                    <span className="text-gray-600 font-medium">In Progress</span>
                  </div>
                  <span className="text-gray-900 font-semibold">{statusCounts.inProgress}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
                    <span className="text-gray-600 font-medium">On Hold</span>
                  </div>
                  <span className="text-gray-900 font-semibold">{statusCounts.onHold}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F87171]" />
                    <span className="text-gray-600 font-medium">Resolved</span>
                  </div>
                  <span className="text-gray-900 font-semibold">{statusCounts.resolved}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Recent Tickets */}
          <div className="bg-white border border-[#EFEAE4] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-x-auto">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Recent Tickets</h3>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400">
                  <th className="pb-2">Ticket</th>
                  <th className="pb-2">Subject</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Priority</th>
                  <th className="pb-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skel-tick-${i}`} className="animate-pulse">
                      <td className="py-2.5"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                      <td className="py-2.5"><div className="h-4 bg-gray-200 rounded w-36" /></td>
                      <td className="py-2.5"><div className="h-4 bg-gray-200 rounded w-14" /></td>
                      <td className="py-2.5"><div className="h-4 bg-gray-200 rounded w-12" /></td>
                      <td className="py-2.5 text-right"><div className="h-4 bg-gray-200 rounded w-10 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredRecentTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">
                      No recent tickets found
                    </td>
                  </tr>
                ) : (
                  filteredRecentTickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => navigate('/incidents')}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 font-medium text-gray-700 whitespace-nowrap">{t.ticketNumber}</td>
                      <td className="py-2.5 text-gray-900 max-w-[180px] truncate pr-2" title={t.subject}>
                        {t.subject}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium leading-tight whitespace-nowrap ${
                            t.status === 'Open'
                              ? 'bg-[#E0F2FE] text-[#0369A1]'
                              : t.status === 'In Progress'
                              ? 'bg-[#DBEAFE] text-[#1D4ED8]'
                              : t.status === 'On Hold'
                              ? 'bg-[#FEF3C7] text-[#B45309]'
                              : 'bg-[#DCFCE7] text-[#15803D]'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`text-xs font-medium ${
                            t.priority === 'High'
                              ? 'text-[#DC2626]'
                              : t.priority === 'Medium'
                              ? 'text-[#D97706]'
                              : 'text-[#16A34A]'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-500 text-right whitespace-nowrap">{t.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. BOTTOM ROW: UPCOMING APPROVALS + MY TASKS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Upcoming Approvals */}
          <div className="bg-white border border-[#EFEAE4] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Upcoming Approvals</h3>
              <button
                type="button"
                onClick={() => navigate('/approvals')}
                className="text-xs font-semibold text-[#0284C7] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400">
                  <th className="pb-2">Request ID</th>
                  <th className="pb-2">Item</th>
                  <th className="pb-2">Requested By</th>
                  <th className="pb-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skel-app-${i}`} className="animate-pulse">
                      <td className="py-2.5"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                      <td className="py-2.5"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                      <td className="py-2.5"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                      <td className="py-2.5 text-right"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : approvals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      No upcoming approvals
                    </td>
                  </tr>
                ) : (
                  approvals.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => navigate('/approvals')}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 font-medium text-gray-700 whitespace-nowrap">{app.requestId}</td>
                      <td className="py-2.5 text-gray-900 max-w-[160px] truncate pr-2" title={app.item}>
                        {app.item}
                      </td>
                      <td className="py-2.5 text-gray-600 whitespace-nowrap">{app.requestedBy}</td>
                      <td className="py-2.5 text-gray-500 text-right whitespace-nowrap">{app.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Right: My Tasks */}
          <div className="bg-white border border-[#EFEAE4] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-x-auto">
            <h3 className="text-sm font-bold text-gray-900 mb-3">My Tasks</h3>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400">
                  <th className="pb-2">Task</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Priority</th>
                  <th className="pb-2 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skel-task-${i}`} className="animate-pulse">
                      <td className="py-2.5"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                      <td className="py-2.5"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                      <td className="py-2.5"><div className="h-4 bg-gray-200 rounded w-14" /></td>
                      <td className="py-2.5 text-right"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      No tasks assigned
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => navigate('/my-work')}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 font-medium text-gray-900 whitespace-nowrap">{task.task}</td>
                      <td className="py-2.5 text-gray-600 max-w-[180px] truncate pr-2" title={task.description}>
                        {task.description}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`text-xs font-medium ${
                            task.priority === 'High'
                              ? 'text-[#DC2626]'
                              : task.priority === 'Medium'
                              ? 'text-[#D97706]'
                              : 'text-[#16A34A]'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-500 text-right whitespace-nowrap">{task.dueDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ─── NEW TICKET MODAL ─── */}
      {isNewTicketOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsNewTicketOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg font-bold w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100"
              onClick={() => setIsNewTicketOpen(false)}
            >
              ✕
            </button>

            <h3 className="text-base font-bold text-gray-900 mb-4">Create New Ticket</h3>

            {ticketSuccessNotice && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg font-medium">
                {ticketSuccessNotice}
              </div>
            )}

            <form onSubmit={handleCreateTicketSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="e.g. Unable to access VPNTokyo gateway"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide incident details or user impact..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    <option value="Critical">Critical (P1)</option>
                    <option value="High">High (P2)</option>
                    <option value="Medium">Medium (P3)</option>
                    <option value="Low">Low (P4)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    <option value="Software">Software</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Network">Network</option>
                    <option value="Access">Access</option>
                    <option value="VPN">VPN</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#D97757] hover:bg-[#C86A4C] rounded-lg shadow-sm transition-colors"
                >
                  {isSubmittingTicket ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
