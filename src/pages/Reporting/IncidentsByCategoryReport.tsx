import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TicketDetailModal } from '../../components/TicketDetailModal';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { api } from '../../services/apiClient';
import './IncidentsByCategoryReport.css';

export type ReportType = 'category' | 'sla' | 'agents' | 'fcr';

interface FilterTag {
  id: string;
  label: string;
}

interface FilterRow {
  id: string;
  field: string;
  operator: string;
  value?: string;
  tags?: FilterTag[];
}

export interface ReportTicketRow {
  category: string;
  id: string;
  summary: string;
  createdAt: string;
  site: string;
  team: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  agent: string;
  status: string;
  slaResolutionMet: number;
  breachDuration?: string;
  slaTarget?: string;
}

const DEFAULT_REPORT_TICKETS: ReportTicketRow[] = [
  {
    id: 'INC-2024-001',
    summary: 'VPN Gateway latency affecting remote engineering team',
    category: 'Network>VPN>Connection Failure',
    createdAt: '13/11/2026',
    site: 'EMEA',
    team: '1st Line Support',
    priority: 'High',
    agent: 'Alex Rivera',
    status: 'Active',
    slaResolutionMet: 1,
    slaTarget: '4h Target',
    breachDuration: 'Met (+2h 15m left)',
  },
  {
    id: 'INC-2024-002',
    summary: 'Outlook 365 authentication prompt loop after MFA change',
    category: 'Office Applications>Microsoft Teams>Audio/Video Quality',
    createdAt: '13/11/2026',
    site: 'EMEA',
    team: '1st Line Support',
    priority: 'High',
    agent: 'Sarah Jenkins',
    status: 'Active',
    slaResolutionMet: 0,
    slaTarget: '2h Target',
    breachDuration: '+15m Overdue Breach',
  },
  {
    id: 'REQ-2024-001',
    summary: 'Developer MacBook Pro 32GB provisioning for senior backend hire',
    category: 'Hardware>Laptop',
    createdAt: '13/11/2026',
    site: 'US-East',
    team: '1st Line Support',
    priority: 'High',
    agent: 'Sarah Jenkins',
    status: 'Active',
    slaResolutionMet: 1,
    slaTarget: '8h Target',
    breachDuration: 'Met (+3h left)',
  },
  {
    id: 'REQ-2024-002',
    summary: 'JetBrains All Products Pack license allocation',
    category: 'Business Applications>CRM',
    createdAt: '13/11/2026',
    site: 'APAC',
    team: '1st Line Support',
    priority: 'Medium',
    agent: 'Alex Rivera',
    status: 'Active',
    slaResolutionMet: 1,
    slaTarget: '24h Target',
    breachDuration: 'Met (+4h left)',
  },
  {
    id: 'REQ-2024-003',
    summary: 'AWS Production Read-Only CloudWatch & RDS IAM role assignment',
    category: 'Security>Multi-Factor Authentication>Token Lost',
    createdAt: '13/11/2026',
    site: 'EMEA',
    team: '1st Line Support',
    priority: 'Critical',
    agent: 'Alex Rivera',
    status: 'New',
    slaResolutionMet: 0,
    slaTarget: '1h Target',
    breachDuration: '+42m Overdue Breach',
  },
  {
    id: 'INC-2024-005',
    summary: 'Kubernetes ingress SSL certificate auto-renewal warning',
    category: 'Infrastructure & Cloud',
    createdAt: '12/11/2026',
    site: 'EMEA',
    team: '2nd Line Support',
    priority: 'Medium',
    agent: 'Sarah Jenkins',
    status: 'On Hold',
    slaResolutionMet: 1,
    slaTarget: '12h Target',
    breachDuration: 'Clock Paused (On Hold)',
  },
  {
    id: 'INC-2024-008',
    summary: 'Customer portal 504 gateway timeout during peak checkout',
    category: 'Business Applications>CRM',
    createdAt: '12/11/2026',
    site: 'Global',
    team: '2nd Line Support',
    priority: 'Critical',
    agent: 'Alex Rivera',
    status: 'Actioned',
    slaResolutionMet: 0,
    slaTarget: '1h Target',
    breachDuration: '+28m Overdue Breach',
  },
  {
    id: 'INC-2024-011',
    summary: 'Monitor display flickering over HDMI adapter in Boardroom',
    category: 'Monitor>Display Issues',
    createdAt: '12/11/2026',
    site: 'London HQ',
    team: '1st Line Support',
    priority: 'Low',
    agent: 'Sarah Jenkins',
    status: 'Resolved',
    slaResolutionMet: 1,
    slaTarget: '48h Target',
    breachDuration: 'Met in 1h 20m',
  },
  {
    id: 'INC-2024-014',
    summary: 'Wi-Fi connection drops intermittently on 4th floor',
    category: 'Wi-Fi>Connectivity',
    createdAt: '11/11/2026',
    site: 'London HQ',
    team: '1st Line Support',
    priority: 'Medium',
    agent: 'Alex Rivera',
    status: 'Resolved',
    slaResolutionMet: 1,
    slaTarget: '8h Target',
    breachDuration: 'Met in 3h 10m',
  },
  {
    id: 'INC-2024-019',
    summary: 'OneDrive sync error 0x8004de40 after Windows upgrade',
    category: 'OneDrive>Sync Issues',
    createdAt: '11/11/2026',
    site: 'EMEA',
    team: '1st Line Support',
    priority: 'Medium',
    agent: 'Sarah Jenkins',
    status: 'Resolved',
    slaResolutionMet: 1,
    slaTarget: '8h Target',
    breachDuration: 'Met in 2h 45m',
  },
  {
    id: 'INC-2024-022',
    summary: 'Phishing email reporting macro attachment from external vendor',
    category: 'Security>Phishing>Email Report',
    createdAt: '10/11/2026',
    site: 'Global',
    team: 'Security Ops',
    priority: 'High',
    agent: 'Alex Rivera',
    status: 'Resolved',
    slaResolutionMet: 1,
    slaTarget: '4h Target',
    breachDuration: 'Met in 45m',
  },
  {
    id: 'INC-2024-025',
    summary: 'Hardware desktop boot failure on workstation WS-049',
    category: 'Hardware>Desktop>Boot Failure',
    createdAt: '10/11/2026',
    site: 'London HQ',
    team: '1st Line Support',
    priority: 'Critical',
    agent: 'Sarah Jenkins',
    status: 'Resolved',
    slaResolutionMet: 0,
    slaTarget: '2h Target',
    breachDuration: '+1h 14m Overdue Breach',
  },
];

export default function IncidentsByCategoryReport() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeReport, setActiveReport] = useState<ReportType>('category');
  const [slaFilterMode, setSlaFilterMode] = useState<'all' | 'breached' | 'met'>('all');

  const [dateField, setDateField] = useState('Date Created');
  const [period, setPeriod] = useState('All');
  const [isFavorite, setIsFavorite] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeCategoryTag, setActiveCategoryTag] = useState<string | null>(
    (location.state as any)?.category || 'Network>VPN>Connection Failure'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ReportTicketRow | null>(null);
  const [tickets, setTickets] = useState<ReportTicketRow[]>(DEFAULT_REPORT_TICKETS);

  React.useEffect(() => {
    let mounted = true;
    async function loadIncidents() {
      setIsRefreshing(true);
      try {
        const queryParams: Record<string, string | number> = { limit: 100 };
        if (activeCategoryTag) {
          const primaryCat = activeCategoryTag.includes('>')
            ? activeCategoryTag.split('>')[0].trim()
            : activeCategoryTag.trim();
          if (primaryCat) {
            queryParams.category = primaryCat;
          }
        }
        const res: any = await api.get('/api/incidents', { params: queryParams });
        const list = res?.data?.incidents || (Array.isArray(res?.data) ? res.data : []);
        if (mounted && Array.isArray(list) && list.length > 0) {
          const mapped: ReportTicketRow[] = list.map((item: any) => ({
            id: item.id || '',
            summary: item.summary || 'Incident ticket',
            category: item.incident?.category || item.category || 'General Support',
            createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '13/11/2026',
            site: item.siteName || item.organisation || 'EMEA',
            team: item.assignedTeam || '1st Line Support',
            priority: (item.priority || 'Medium') as any,
            agent: item.assignedAgent
              ? `${item.assignedAgent.firstName || ''} ${item.assignedAgent.lastName || ''}`.trim() || 'Unassigned'
              : item.agent || 'Unassigned',
            status: item.status || 'Active',
            slaResolutionMet: typeof item.slaTimeLeft === 'number' && item.slaTimeLeft > 0 ? 1 : 0,
            slaTarget: item.targetSla || '4h Target',
            breachDuration:
              typeof item.slaTimeLeft === 'number' && item.slaTimeLeft <= 0
                ? `+${Math.abs(item.slaTimeLeft)}m Overdue Breach`
                : 'Met Within SLA',
          }));
          setTickets(mapped);
        }
      } catch (err) {
        console.warn('Failed to load live incidents for report, using default reporting dataset:', err);
      } finally {
        if (mounted) setIsRefreshing(false);
      }
    }
    void loadIncidents();
    return () => {
      mounted = false;
    };
  }, [activeCategoryTag]);

  // Filter rows matching Image 2 with interactive condition capabilities
  const [filters, setFilters] = useState<FilterRow[]>([
    {
      id: 'f1',
      field: 'Category',
      operator: 'Is not blank',
    },
    {
      id: 'f2',
      field: 'Category',
      operator: 'Does not include',
      tags: [
        { id: 'c1', label: 'Standard Applications>Email' },
        { id: 'c2', label: 'Standard Applications>Internet' },
        { id: 'c3', label: 'Standard Applications>Other (Not Listed)' },
        { id: 'c4', label: 'Hardware>Laptop' },
        { id: 'c5', label: 'Hardware>Printer' },
        { id: 'c6', label: 'Account Administration' },
        { id: 'c7', label: 'Account Administration>Application Access' },
      ],
    },
    {
      id: 'f3',
      field: 'ITIL Type',
      operator: 'Includes',
      tags: [{ id: 't1', label: 'Incident' }],
    },
    {
      id: 'f4',
      field: 'Team',
      operator: 'Includes',
      tags: [
        { id: 'tm1', label: '1st Line Support' },
        { id: 'tm2', label: '2nd Line Support' },
      ],
    },
  ]);

  const handleCloseTab = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleRemoveTag = (rowId: string, tagId: string) => {
    setFilters((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? { ...row, tags: row.tags?.filter((t) => t.id !== tagId) }
          : row
      )
    );
  };

  const handleClearTags = (rowId: string) => {
    setFilters((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, tags: [] } : row))
    );
  };

  const handleRemoveFilterRow = (rowId: string) => {
    setFilters((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleAddFilterRow = () => {
    const newId = `f-${Date.now()}`;
    setFilters((prev) => [
      ...prev,
      {
        id: newId,
        field: 'Priority',
        operator: 'Equals',
        value: 'Critical',
      },
    ]);
    setStatusMessage('Added new filter condition row');
    setTimeout(() => setStatusMessage(null), 2000);
  };

  // Dynamically filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (activeCategoryTag && !t.category.toLowerCase().includes(activeCategoryTag.toLowerCase().split('>')[0])) {
        // Soft match if category tag is active
      }
      if (activeReport === 'sla') {
        if (slaFilterMode === 'breached' && t.slaResolutionMet !== 0) return false;
        if (slaFilterMode === 'met' && t.slaResolutionMet !== 1) return false;
      }
      // Check custom condition rows
      for (const f of filters) {
        if (f.field === 'Priority' && f.value) {
          if (f.operator === 'Equals' && t.priority.toLowerCase() !== f.value.toLowerCase()) return false;
          if (f.operator === 'Does not include' && t.priority.toLowerCase() === f.value.toLowerCase()) return false;
        }
        if (f.field === 'Status' && f.value) {
          if (f.operator === 'Equals' && t.status.toLowerCase() !== f.value.toLowerCase()) return false;
        }
      }
      return true;
    });
  }, [tickets, activeCategoryTag, activeReport, slaFilterMode, filters]);

  // SLA Metrics
  const slaMetrics = useMemo(() => {
    const total = tickets.length;
    const met = tickets.filter((t) => t.slaResolutionMet === 1).length;
    const breached = tickets.filter((t) => t.slaResolutionMet === 0).length;
    const metPercent = total > 0 ? ((met / total) * 100).toFixed(1) : '100.0';
    return { total, met, breached, metPercent };
  }, [tickets]);

  // CSV Exporter
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = 'report_export.csv';

    if (activeReport === 'category') {
      filename = 'incidents_by_category_report.csv';
      headers = ['Category', 'Ticket ID', 'Summary', 'Priority', 'Agent', 'Status', 'SLA Met'];
      rows = filteredTickets.map((t) => [
        t.category,
        t.id,
        t.summary,
        t.priority,
        t.agent,
        t.status,
        t.slaResolutionMet ? '1 (Met)' : '0 (Breached)',
      ]);
    } else if (activeReport === 'sla') {
      filename = 'sla_compliance_and_breach_analysis.csv';
      headers = ['Ticket ID', 'Summary', 'Priority', 'Category', 'Agent', 'Target SLA', 'Status', 'SLA Met', 'Breach Details'];
      rows = filteredTickets.map((t) => [
        t.id,
        t.summary,
        t.priority,
        t.category,
        t.agent,
        t.slaTarget || '4h Target',
        t.status,
        t.slaResolutionMet ? 'Yes' : 'NO (BREACHED)',
        t.breachDuration || '',
      ]);
    } else if (activeReport === 'agents') {
      filename = 'agent_performance_and_workload.csv';
      headers = ['Agent', 'Role / Team', 'Active Tickets', 'Resolved', 'Avg Handle Time', 'SLA Met %'];
      rows = [
        ['Alex Rivera', '1st Line Senior Agent', '7', '28', '1h 24m', '96.4%'],
        ['Sarah Jenkins', '1st Line Support Specialist', '4', '22', '1h 52m', '92.8%'],
        ['Alex Agent', '1st Line Help Desk', '0', '10', '2h 10m', '90.0%'],
        ['Alice Approver', 'Change & Operations Lead', '2', '8', '45m', '100.0%'],
      ];
    } else {
      filename = 'first_contact_resolution_report.csv';
      headers = ['Category', 'Total Handled', 'First Contact Resolved', 'FCR Rate %', 'Industry Benchmark'];
      rows = [
        ['Account Administration & Passwords', '35', '33', '94.3%', '75.0%'],
        ['Office & Collaboration Tools', '28', '24', '85.7%', '72.0%'],
        ['Hardware & Peripherals', '18', '12', '66.7%', '65.0%'],
        ['Network & VPN Access', '16', '11', '68.8%', '60.0%'],
      ];
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((item) => `"${item.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setStatusMessage(`Exported data to ${filename}`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    setStatusMessage(isFavorite ? 'Removed from My Reports' : 'Added to My Reports ⭐');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  return (
    <div className="reporting-page-container">
      {/* Toast banner */}
      {statusMessage && (
        <div className="reporting-toast-banner">
          ✓ {statusMessage}
        </div>
      )}

      {/* ── Top Browser Navigation Bar (matching Image 2) ── */}
      <div className="reporting-top-nav-bar">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Service Desk</span>
            <span>/</span>
            <span className="text-gray-900">Reporting & Analytics</span>
          </div>

          <div className="reporting-tabs-group">
            <div className="reporting-active-tab">
              <span className="tab-title">
                {activeReport === 'category'
                  ? 'Incidents by Category'
                  : activeReport === 'sla'
                  ? 'SLA Compliance & Breaches'
                  : activeReport === 'agents'
                  ? 'Agent Performance'
                  : 'FCR Rate Analysis'}
              </span>
              <button
                type="button"
                className="tab-close-btn"
                onClick={handleCloseTab}
                title="Close Reporting Tab"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              className="reporting-new-tab-btn"
              title="Open New Tab"
              onClick={() => {
                setStatusMessage('New report workspace opened');
                setTimeout(() => setStatusMessage(null), 2000);
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Right utility items from Image 2 */}
        <div className="reporting-top-right-tools">
          <GlobalNavbarActions
            onGetStarted={() => navigate('/dashboard')}
            onNewTicket={() => navigate('/incidents')}
            onOpenTicket={(id) => {
              const found = tickets.find((t) => t.id === id);
              if (found) setSelectedTicket(found);
            }}
          />
        </div>
      </div>

      {/* ── Main Reporting Canvas ── */}
      <div className="reporting-main-canvas">
        {/* Top actions: Export to CSV & Add to My Reports */}
        <div className="report-action-toolbar">
          <button
            type="button"
            className="report-pill-btn"
            onClick={handleExportCSV}
            title="Download report data as CSV file"
          >
            <svg className="w-3.5 h-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span>Export to CSV</span>
          </button>

          <button
            type="button"
            className={`report-pill-btn ${isFavorite ? 'favorited' : ''}`}
            onClick={handleToggleFavorite}
            title="Save to personalized My Reports list"
          >
            <span className="text-sm">{isFavorite ? '★' : '☆'}</span>
            <span>Add to My Reports</span>
          </button>
        </div>

        {/* ── Halo Gap Bridge: Report Catalog Switcher Tabs ── */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 bg-slate-200/90 p-1.5 rounded-xl shadow-inner border border-slate-300">
            <button
              type="button"
              onClick={() => setActiveReport('category')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeReport === 'category'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              📊 Incidents by Category
            </button>
            <button
              type="button"
              onClick={() => setActiveReport('sla')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeReport === 'sla'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              ⏱️ SLA Compliance & Breach Analysis
            </button>
            <button
              type="button"
              onClick={() => setActiveReport('agents')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeReport === 'agents'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              👥 Agent Performance & Workload
            </button>
            <button
              type="button"
              onClick={() => setActiveReport('fcr')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeReport === 'fcr'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              🎯 First Contact Resolution (FCR)
            </button>
          </div>
        </div>

        {/* Page Title */}
        <h1 className="report-page-heading">
          {activeReport === 'category' && 'Incidents by Category'}
          {activeReport === 'sla' && 'SLA Compliance & Breach Analysis'}
          {activeReport === 'agents' && 'Agent Performance & Workload Metrics'}
          {activeReport === 'fcr' && 'First Contact Resolution (FCR) Rate'}
        </h1>

        {/* ── KPI Cards for SLA Compliance View ── */}
        {activeReport === 'sla' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Met Compliance</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-emerald-600">{slaMetrics.metPercent}%</span>
                <span className="text-xs font-bold text-slate-500">Target 95.0%</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1">↑ +1.4% improvement vs previous period</span>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Met Within Target SLA</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-800">{slaMetrics.met}</span>
                <span className="text-xs font-semibold text-emerald-600">✓ On-Track</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1">Tickets resolved inside contractual SLA</span>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Breached Tickets</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-rose-600">{slaMetrics.breached}</span>
                <span className="text-xs font-semibold text-rose-600">⚠️ Critical Review</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1">Requiring post-incident SLA breach audit</span>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Breach Overrun</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-amber-600">+24m</span>
                <span className="text-xs font-semibold text-slate-500">Mean time</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1">Average excess time past breach threshold</span>
            </div>
          </div>
        )}

        {/* ── KPI Cards for Agent Performance View ── */}
        {activeReport === 'agents' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Responders</span>
              <div className="text-3xl font-extrabold text-slate-800 mt-2">4 Agents</div>
              <span className="text-[11px] text-slate-400 mt-1">Across 1st Line & 2nd Line Support</span>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tickets Resolved Today</span>
              <div className="text-3xl font-extrabold text-indigo-600 mt-2">42 Tickets</div>
              <span className="text-[11px] text-slate-400 mt-1">High throughput support sprint</span>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Resolution Time</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-2">1h 48m</div>
              <span className="text-[11px] text-slate-400 mt-1">Down from 2h 15m last quarter</span>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team SLA Adherence</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-2">96.4%</div>
              <span className="text-[11px] text-slate-400 mt-1">Exceeds corporate 95.0% SLA SLA KPI</span>
            </div>
          </div>
        )}

        {/* ── KPI Cards for FCR View ── */}
        {activeReport === 'fcr' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Contact Resolution</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-2">78.4%</div>
              <span className="text-[11px] text-slate-400 mt-1">Industry Benchmark: 70.0% – 75.0%</span>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">1st Touch Resolved</span>
              <div className="text-3xl font-extrabold text-slate-800 mt-2">69 Tickets</div>
              <span className="text-[11px] text-slate-400 mt-1">No escalations or handoffs required</span>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Escalated Handoffs</span>
              <div className="text-3xl font-extrabold text-amber-600 mt-2">19 Tickets</div>
              <span className="text-[11px] text-slate-400 mt-1">Transferred to Tier 2 engineering</span>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket Reopen Rate</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-2">2.1%</div>
              <span className="text-[11px] text-slate-400 mt-1">Below target ceiling of 5.0%</span>
            </div>
          </div>
        )}

        {/* ── Section 1: Reporting Period ── */}
        <div className="report-section-block">
          <div className="report-section-header-pill">
            <span>Reporting Period</span>
          </div>

          <div className="report-period-row">
            <div className="report-select-wrapper">
              <select
                className="report-select-input"
                value={dateField}
                onChange={(e) => setDateField(e.target.value)}
              >
                <option value="Date Created">Date Created</option>
                <option value="Date Resolved">Date Resolved</option>
                <option value="Date Closed">Date Closed</option>
                <option value="Date Updated">Date Updated</option>
              </select>
            </div>

            <div className="report-select-wrapper">
              <select
                className="report-select-input"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Quarter">This Quarter</option>
                <option value="This Year">This Year</option>
              </select>
            </div>

            {/* SLA Filter Slices */}
            {activeReport === 'sla' && (
              <div className="flex items-center gap-2 ml-4">
                <span className="text-xs font-bold text-slate-500">SLA Slice:</span>
                <button
                  type="button"
                  onClick={() => setSlaFilterMode('all')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    slaFilterMode === 'all'
                      ? 'bg-[#13273e] text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  All ({tickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSlaFilterMode('breached')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    slaFilterMode === 'breached'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white text-rose-700 border border-rose-200'
                  }`}
                >
                  ⚠️ Breached SLA ({slaMetrics.breached})
                </button>
                <button
                  type="button"
                  onClick={() => setSlaFilterMode('met')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    slaFilterMode === 'met'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-emerald-700 border border-emerald-200'
                  }`}
                >
                  ✓ Met SLA ({slaMetrics.met})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 2: Custom Filter Condition Builder ── */}
        <div className="report-section-block filters-block">
          <div className="report-section-header-pill filters-header-pill">
            <span>Filter Conditions Builder</span>
            <button
              type="button"
              className="filter-add-plus-btn"
              onClick={handleAddFilterRow}
              title="Add another filter condition"
            >
              ⊕ Add Condition
            </button>
          </div>

          <div className="filter-rows-container">
            {filters.map((filter) => (
              <div key={filter.id} className="filter-item-row">
                {/* Field select (e.g. Category, ITIL Type, Team, Priority, Status, Agent) */}
                <div className="filter-select-field">
                  <select
                    className="report-select-input"
                    value={filter.field}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilters((prev) =>
                        prev.map((r) => (r.id === filter.id ? { ...r, field: val } : r))
                      );
                    }}
                  >
                    <option value="Category">Category</option>
                    <option value="Priority">Priority</option>
                    <option value="Status">Status</option>
                    <option value="Team">Team</option>
                    <option value="Agent">Agent</option>
                    <option value="ITIL Type">ITIL Type</option>
                  </select>
                </div>

                {/* Operator select */}
                <div className="filter-select-operator">
                  <select
                    className="report-select-input"
                    value={filter.operator}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilters((prev) =>
                        prev.map((r) => (r.id === filter.id ? { ...r, operator: val } : r))
                      );
                    }}
                  >
                    <option value="Equals">Equals</option>
                    <option value="Includes">Includes</option>
                    <option value="Does not include">Does not include</option>
                    <option value="Is not blank">Is not blank</option>
                    <option value="Is blank">Is blank</option>
                  </select>
                </div>

                {/* Value input for custom filter rows */}
                {filter.value !== undefined ? (
                  <div className="flex-1 max-w-xs">
                    {filter.field === 'Priority' ? (
                      <select
                        className="report-select-input w-full"
                        value={filter.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFilters((prev) =>
                            prev.map((r) => (r.id === filter.id ? { ...r, value: val } : r))
                          );
                        }}
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="report-select-input w-full"
                        placeholder="Enter filter value..."
                        value={filter.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFilters((prev) =>
                            prev.map((r) => (r.id === filter.id ? { ...r, value: val } : r))
                          );
                        }}
                      />
                    )}
                  </div>
                ) : null}

                {/* Tag values box (if applicable) */}
                {filter.tags && (
                  <div className="filter-tags-box">
                    <div className="tags-chips-list">
                      {filter.tags.map((tag) => (
                        <span key={tag.id} className="filter-cyan-tag">
                          <span>{tag.label}</span>
                          <button
                            type="button"
                            className="tag-remove-x"
                            onClick={() => handleRemoveTag(filter.id, tag.id)}
                            title={`Remove ${tag.label}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="tags-box-controls">
                      {filter.tags.length > 0 && (
                        <button
                          type="button"
                          className="tags-clear-all"
                          onClick={() => handleClearTags(filter.id)}
                          title="Clear all selected"
                        >
                          ✕
                        </button>
                      )}
                      <span className="tags-caret">▾</span>
                    </div>
                  </div>
                )}

                {/* Remove filter row button on far right */}
                <button
                  type="button"
                  className="filter-remove-row-btn"
                  onClick={() => handleRemoveFilterRow(filter.id)}
                  title="Remove this filter"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active Filter Tag ── */}
        {activeCategoryTag && (
          <div className="report-active-filter-row">
            <span className="report-filter-tag-pill">
              <span>Category = "{activeCategoryTag}"</span>
              <button
                type="button"
                className="report-tag-close-btn"
                onClick={() => setActiveCategoryTag(null)}
                title="Remove Category Filter"
              >
                ✕
              </button>
            </span>
          </div>
        )}

        {/* ── Refresh Report & Results Counter ── */}
        <div className="report-table-action-bar">
          <button
            type="button"
            className="report-refresh-btn"
            onClick={() => {
              setIsRefreshing(true);
              setStatusMessage('Refreshed report data with latest metrics');
              setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => setStatusMessage(null), 2000);
              }, 600);
            }}
            title="Refresh current report query"
          >
            <span className={`text-sm ${isRefreshing ? 'animate-spin inline-block' : ''}`}>🔄</span>
            <span>Refresh Report</span>
          </button>

          <span className="report-results-count">Results: {filteredTickets.length}</span>
        </div>

        {/* ── View 1: Incidents by Category Table ── */}
        {activeReport === 'category' && (
          <div className="report-table-wrapper">
            <table className="report-data-table">
              <thead>
                <tr>
                  <th className="sortable-th" title="Click to sort by Category">
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      <span className="text-[10px]">▲</span>
                    </div>
                  </th>
                  <th>Ticket ID</th>
                  <th>Summary</th>
                  <th>Date Created</th>
                  <th>Site</th>
                  <th>Team</th>
                  <th>Priority</th>
                  <th>Assigned Agent</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>SLA Resolution Met</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t, idx) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    title={`View ticket #${t.id} details`}
                  >
                    <td>{idx === 0 || t.category !== filteredTickets[idx - 1]?.category ? t.category : ''}</td>
                    <td>
                      <button
                        type="button"
                        className="report-ticket-id-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(t);
                        }}
                      >
                        {t.id}
                      </button>
                    </td>
                    <td className="report-summary-cell">{t.summary}</td>
                    <td className="whitespace-nowrap">{t.createdAt}</td>
                    <td>{t.site}</td>
                    <td className="whitespace-nowrap">{t.team}</td>
                    <td>
                      <span className={`report-priority-badge priority-${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">{t.agent}</td>
                    <td>
                      <span className="report-status-badge">{t.status}</span>
                    </td>
                    <td className="report-sla-met-cell">{t.slaResolutionMet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── View 2: SLA Compliance & Breach Analysis Table ── */}
        {activeReport === 'sla' && (
          <div className="report-table-wrapper">
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Summary</th>
                  <th>Priority</th>
                  <th>Category</th>
                  <th>Assigned Agent</th>
                  <th>Target SLA</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Resolution SLA Met</th>
                  <th>Breach Analysis & Overrun</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    title={`View ticket #${t.id} details`}
                  >
                    <td>
                      <button
                        type="button"
                        className="report-ticket-id-link font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(t);
                        }}
                      >
                        {t.id}
                      </button>
                    </td>
                    <td className="report-summary-cell font-medium">{t.summary}</td>
                    <td>
                      <span className={`report-priority-badge priority-${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="text-xs text-slate-600">{t.category}</td>
                    <td className="whitespace-nowrap">{t.agent}</td>
                    <td className="whitespace-nowrap font-mono text-xs">{t.slaTarget || '4h Target'}</td>
                    <td>
                      <span className="report-status-badge">{t.status}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {t.slaResolutionMet === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Met
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                          ✕ Breached
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          t.slaResolutionMet === 0 ? 'text-rose-600 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {t.breachDuration || (t.slaResolutionMet ? 'Within Target' : '+20m Breach')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── View 3: Agent Performance Table ── */}
        {activeReport === 'agents' && (
          <div className="report-table-wrapper">
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Team / Role</th>
                  <th>Assigned Active</th>
                  <th>Resolved Today</th>
                  <th>Avg Handling Time</th>
                  <th>SLA Met Adherence</th>
                  <th>Performance Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold text-slate-800">Alex Rivera</td>
                  <td className="text-slate-600 text-xs">1st Line Senior Agent</td>
                  <td className="font-semibold text-slate-800">7</td>
                  <td className="font-bold text-indigo-600">28</td>
                  <td className="font-mono text-xs">1h 24m</td>
                  <td className="font-bold text-emerald-600">96.4%</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ⭐ Top Performer
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-800">Sarah Jenkins</td>
                  <td className="text-slate-600 text-xs">1st Line Support Specialist</td>
                  <td className="font-semibold text-slate-800">4</td>
                  <td className="font-bold text-indigo-600">22</td>
                  <td className="font-mono text-xs">1h 52m</td>
                  <td className="font-bold text-emerald-600">92.8%</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      🟢 Target Met
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-800">Alex Agent</td>
                  <td className="text-slate-600 text-xs">1st Line Help Desk</td>
                  <td className="font-semibold text-slate-800">0</td>
                  <td className="font-bold text-indigo-600">10</td>
                  <td className="font-mono text-xs">2h 10m</td>
                  <td className="font-bold text-amber-600">90.0%</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      🟡 Coaching
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-800">Alice Approver</td>
                  <td className="text-slate-600 text-xs">Change & Operations Lead</td>
                  <td className="font-semibold text-slate-800">2</td>
                  <td className="font-bold text-indigo-600">8</td>
                  <td className="font-mono text-xs">45m</td>
                  <td className="font-bold text-emerald-600">100.0%</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ⭐ Top Performer
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── View 4: First Contact Resolution (FCR) Table ── */}
        {activeReport === 'fcr' && (
          <div className="report-table-wrapper">
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Handled</th>
                  <th>First-Contact Resolved</th>
                  <th>Escalated to Specialist</th>
                  <th>FCR Success Rate</th>
                  <th>Benchmark Comparison</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold text-slate-800">Account Administration & Passwords</td>
                  <td>35</td>
                  <td className="font-semibold text-emerald-600">33</td>
                  <td>2</td>
                  <td className="font-bold text-emerald-600">94.3%</td>
                  <td className="text-xs text-emerald-700 font-semibold">+19.3% vs Industry (75%)</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-800">Office & Collaboration Tools</td>
                  <td>28</td>
                  <td className="font-semibold text-emerald-600">24</td>
                  <td>4</td>
                  <td className="font-bold text-emerald-600">85.7%</td>
                  <td className="text-xs text-emerald-700 font-semibold">+13.7% vs Industry (72%)</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-800">Hardware & Peripherals</td>
                  <td>18</td>
                  <td className="font-semibold text-slate-700">12</td>
                  <td>6</td>
                  <td className="font-bold text-amber-600">66.7%</td>
                  <td className="text-xs text-amber-700 font-semibold">+1.7% vs Industry (65%)</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-800">Network & VPN Access</td>
                  <td>16</td>
                  <td className="font-semibold text-slate-700">11</td>
                  <td>5</td>
                  <td className="font-bold text-emerald-600">68.8%</td>
                  <td className="text-xs text-emerald-700 font-semibold">+8.8% vs Industry (60%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Ticket Detail Modal Popup ── */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={{
            id: selectedTicket.id,
            type: 'Incident',
            summary: selectedTicket.summary,
            category: selectedTicket.category,
            priority: selectedTicket.priority,
            agent: selectedTicket.agent,
            status: selectedTicket.status,
            site: selectedTicket.site,
            createdAt: selectedTicket.createdAt,
            targetSla: selectedTicket.slaTarget || '4h Target',
          }}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* ── Bottom Right Assistant Help Bubble ── */}
      <div className="reporting-floating-assistant" title="ITSM Reporting Assistant">
        <div className="assistant-circle-cyan">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div className="assistant-circle-navy">
          <span className="text-sm">✦</span>
        </div>
      </div>
    </div>
  );
}
