import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Popover from '@radix-ui/react-popover';
import { Download, Clock, SlidersHorizontal, Star, BarChart3, Users, CheckCircle2, RefreshCw } from 'lucide-react';
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
    (location.state as any)?.category || null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ReportTicketRow | null>(null);
  const [tickets, setTickets] = useState<ReportTicketRow[]>(DEFAULT_REPORT_TICKETS);

  // Scheduled export state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleFreq, setScheduleFreq] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [scheduleFormat, setScheduleFormat] = useState<'CSV' | 'PDF'>('CSV');
  const [scheduleEmail, setScheduleEmail] = useState('');
  const [savedSchedule, setSavedSchedule] = useState<{ freq: string; email: string; format: string } | null>(null);

  // Custom column visibility builder
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    id: true,
    summary: true,
    priority: true,
    category: true,
    agent: true,
    targetSla: true,
    status: true,
    slaMet: true,
    breachDuration: true,
  });

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

  // Clean default filter conditions
  const [filters, setFilters] = useState<FilterRow[]>([]);

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
        let fieldVal = '';
        if (f.field === 'Category') fieldVal = t.category || '';
        else if (f.field === 'Priority') fieldVal = t.priority || '';
        else if (f.field === 'Status') fieldVal = t.status || '';
        else if (f.field === 'Team') fieldVal = t.team || '';
        else if (f.field === 'Agent') fieldVal = t.agent || '';
        else if (f.field === 'ITIL Type') fieldVal = (t as any).itilType || (t.id.startsWith('REQ') ? 'Service Request' : t.id.startsWith('CHG') ? 'Change' : 'Incident');
        else continue;

        const target = (f.value || '').trim().toLowerCase();
        const current = fieldVal.trim().toLowerCase();

        if (f.operator === 'Is blank') {
          if (current !== '') return false;
        } else if (f.operator === 'Is not blank') {
          if (current === '') return false;
        } else if (target) {
          if (f.operator === 'Equals' && current !== target) return false;
          if (f.operator === 'Includes' && !current.includes(target)) return false;
          if (f.operator === 'Does not include' && current.includes(target)) return false;
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
      const agentMap: Record<string, { active: number; resolved: number; met: number; total: number }> = {};
      filteredTickets.forEach((t) => {
        const ag = t.agent || 'Unassigned';
        if (!agentMap[ag]) agentMap[ag] = { active: 0, resolved: 0, met: 0, total: 0 };
        agentMap[ag].total += 1;
        if (t.status === 'Resolved' || t.status === 'Closed') agentMap[ag].resolved += 1;
        else agentMap[ag].active += 1;
        if (t.slaResolutionMet === 1) agentMap[ag].met += 1;
      });
      rows = Object.entries(agentMap).map(([ag, stats]) => [
        ag,
        'Support Operations',
        stats.active.toString(),
        stats.resolved.toString(),
        '1h 35m',
        stats.total > 0 ? `${((stats.met / stats.total) * 100).toFixed(1)}%` : '100%',
      ]);
      if (rows.length === 0) {
        rows = [
          ['Alex Rivera', '1st Line Senior Agent', '7', '28', '1h 24m', '96.4%'],
          ['Sarah Jenkins', '1st Line Support Specialist', '4', '22', '1h 52m', '92.8%'],
        ];
      }
    } else {
      filename = 'first_contact_resolution_report.csv';
      headers = ['Category', 'Total Handled', 'First Contact Resolved', 'FCR Rate %', 'Industry Benchmark'];
      const catMap: Record<string, { total: number; met: number }> = {};
      filteredTickets.forEach((t) => {
        const cat = t.category || 'General';
        if (!catMap[cat]) catMap[cat] = { total: 0, met: 0 };
        catMap[cat].total += 1;
        if (t.slaResolutionMet === 1) catMap[cat].met += 1;
      });
      rows = Object.entries(catMap).map(([cat, stats]) => [
        cat,
        stats.total.toString(),
        stats.met.toString(),
        stats.total > 0 ? `${((stats.met / stats.total) * 100).toFixed(1)}%` : '100%',
        '75.0%',
      ]);
      if (rows.length === 0) {
        rows = [
          ['Account Administration & Passwords', '35', '33', '94.3%', '75.0%'],
          ['Office & Collaboration Tools', '28', '24', '85.7%', '72.0%'],
        ];
      }
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

      {/* ── Top Navbar (matching Dashboard & Reference Image) ── */}
      <header className="reporting-top-nav-bar">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-0 shrink-0">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">Reporting &amp; Analytics</span>
        </div>

        {/* Right utility items */}
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
      </header>

      {/* ── Main Reporting Canvas ── */}
      <div className="reporting-main-canvas">
        {/* Top actions: Export to CSV & Add to My Reports */}
        <div className="report-action-toolbar">
          <button
            type="button"
            className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
            onClick={handleExportCSV}
            title="Download report data as CSV file"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export to CSV</span>
          </button>

          <button
            type="button"
            className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
            onClick={() => setIsScheduleOpen(true)}
            title="Automate recurring report generation"
          >
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>{savedSchedule ? `Scheduled (${savedSchedule.freq})` : 'Schedule Export'}</span>
          </button>

          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                title="Customize table column display"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
                <span>Columns</span>
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 z-50 w-52 flex flex-col gap-1.5 text-xs text-slate-700 animate-in fade-in"
                sideOffset={6}
              >
                <span className="font-bold text-slate-800 pb-1 border-b border-slate-100">Toggle Visible Columns</span>
                {Object.keys(visibleColumns).map((colKey) => (
                  <label key={colKey} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={visibleColumns[colKey]}
                      onChange={(e) => setVisibleColumns((prev) => ({ ...prev, [colKey]: e.target.checked }))}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span className="capitalize">{colKey.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          <button
            type="button"
            className={`px-3 py-1.5 border text-xs font-semibold rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all ${
              isFavorite
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
            onClick={handleToggleFavorite}
            title="Save to personalized My Reports list"
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
            <span>Add to My Reports</span>
          </button>
        </div>

        {/* ── Report Catalog Switcher Tabs ── */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-lg shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveReport('category')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeReport === 'category'
                  ? 'bg-[#eb6a47] text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Incidents by Category</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReport('sla')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeReport === 'sla'
                  ? 'bg-[#eb6a47] text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>SLA Compliance &amp; Breach Analysis</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReport('agents')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeReport === 'agents'
                  ? 'bg-[#eb6a47] text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Agent Performance &amp; Workload</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReport('fcr')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeReport === 'fcr'
                  ? 'bg-[#eb6a47] text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>First Contact Resolution (FCR)</span>
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
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Reporting Period
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
                      ? 'bg-[#eb6a47] text-white shadow-2xs font-bold'
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Filter Conditions Builder
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-[#eb6a47] hover:bg-[#eb6a47]/10 rounded-lg border border-[#eb6a47]/30 transition-all cursor-pointer"
              onClick={handleAddFilterRow}
              title="Add another filter condition"
            >
              <span>+ Add Condition</span>
            </button>
          </div>

          {filters.length === 0 ? (
            <div className="p-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500">
              <span>No custom filter conditions applied. All incidents are included in this report.</span>
            </div>
          ) : (
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
          )}
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
            className="px-4 py-2 bg-[#eb6a47] hover:bg-[#d65a37] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
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
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
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
                    <td style={{ textAlign: 'center' }}>
                      {t.slaResolutionMet === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Met
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          ✕ Breached
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── View 2: SLA Compliance & Breach Analysis Table ── */}
        {activeReport === 'sla' && (
          <div className="flex flex-col gap-5">
            {/* Visual Charts: Donut Gauge + Priority Breach Bars */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-2">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Resolution SLA Met vs Breached</span>
                <div className="flex items-center gap-6 mt-1">
                  <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        strokeWidth="3.8"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-500 transition-all duration-1000"
                        strokeDasharray={`${slaMetrics.metPercent}, 100`}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-lg font-black text-slate-800">{slaMetrics.metPercent}%</span>
                      <span className="text-[9px] uppercase font-bold text-emerald-600">Compliance</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="font-medium text-slate-700">Met Target ({slaMetrics.met} tickets)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500" />
                      <span className="font-medium text-slate-700">Breached SLA ({slaMetrics.breached} tickets)</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Contractual SLA objective: 95.0% compliance</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">SLA Breach Breakdown by Priority</span>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Critical (P1)', count: filteredTickets.filter(t => t.priority === 'Critical' && t.slaResolutionMet === 0).length, total: filteredTickets.filter(t => t.priority === 'Critical').length || 1, color: 'bg-rose-600' },
                    { label: 'High (P2)', count: filteredTickets.filter(t => t.priority === 'High' && t.slaResolutionMet === 0).length, total: filteredTickets.filter(t => t.priority === 'High').length || 1, color: 'bg-orange-500' },
                    { label: 'Medium (P3)', count: filteredTickets.filter(t => t.priority === 'Medium' && t.slaResolutionMet === 0).length, total: filteredTickets.filter(t => t.priority === 'Medium').length || 1, color: 'bg-amber-400' },
                    { label: 'Low (P4)', count: filteredTickets.filter(t => t.priority === 'Low' && t.slaResolutionMet === 0).length, total: filteredTickets.filter(t => t.priority === 'Low').length || 1, color: 'bg-blue-400' },
                  ].map((row) => {
                    const pct = Math.round((row.count / row.total) * 100);
                    return (
                      <div key={row.label} className="flex flex-col gap-1 text-xs">
                        <div className="flex justify-between font-semibold text-slate-700">
                          <span>{row.label}</span>
                          <span className="text-slate-500">{row.count} breached ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full ${row.color} transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(pct, 4))}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="report-table-wrapper">
            <table className="report-data-table">
              <thead>
                <tr>
                  {visibleColumns.id && <th>Ticket ID</th>}
                  {visibleColumns.summary && <th>Summary</th>}
                  {visibleColumns.priority && <th>Priority</th>}
                  {visibleColumns.category && <th>Category</th>}
                  {visibleColumns.agent && <th>Assigned Agent</th>}
                  {visibleColumns.targetSla && <th>Target SLA</th>}
                  {visibleColumns.status && <th>Status</th>}
                  {visibleColumns.slaMet && <th style={{ textAlign: 'center' }}>Resolution SLA Met</th>}
                  {visibleColumns.breachDuration && <th>Breach Analysis & Overrun</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    title={`View ticket #${t.id} details`}
                  >
                    {visibleColumns.id && (
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
                    )}
                    {visibleColumns.summary && <td className="report-summary-cell font-medium">{t.summary}</td>}
                    {visibleColumns.priority && (
                      <td>
                        <span className={`report-priority-badge priority-${t.priority.toLowerCase()}`}>
                          {t.priority}
                        </span>
                      </td>
                    )}
                    {visibleColumns.category && <td className="text-xs text-slate-600">{t.category}</td>}
                    {visibleColumns.agent && <td className="whitespace-nowrap">{t.agent}</td>}
                    {visibleColumns.targetSla && <td className="whitespace-nowrap font-mono text-xs">{t.slaTarget || '4h Target'}</td>}
                    {visibleColumns.status && (
                      <td>
                        <span className="report-status-badge">{t.status}</span>
                      </td>
                    )}
                    {visibleColumns.slaMet && (
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
                    )}
                    {visibleColumns.breachDuration && (
                      <td className="whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            t.slaResolutionMet === 0 ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {t.breachDuration || (t.slaResolutionMet ? 'Within Target' : '+20m Breach')}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* ── View 3: Agent Performance Table ── */}
        {activeReport === 'agents' && (
          <div className="flex flex-col gap-5">
            {/* Visual Workload Distribution Bars */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Agent Resolution Velocity & SLA Adherence</span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                {[
                  { name: 'Alex Rivera', role: '1st Line Senior', closed: 28, metPct: 96.4, color: 'bg-emerald-500' },
                  { name: 'Sarah Jenkins', role: 'Support Specialist', closed: 22, metPct: 92.8, color: 'bg-emerald-500' },
                  { name: 'Alex Agent', role: 'Help Desk', closed: 10, metPct: 90.0, color: 'bg-amber-500' },
                  { name: 'Alice Approver', role: 'Operations Lead', closed: 8, metPct: 100.0, color: 'bg-indigo-500' },
                ].map((ag) => (
                  <div key={ag.name} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{ag.name}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">{ag.metPct}% Met</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900">{ag.closed}</span>
                      <span className="text-xs text-slate-400">tickets resolved</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full ${ag.color}`} style={{ width: `${ag.metPct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

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

      {/* ── Schedule Automated Export Dialog ── */}
      <Dialog.Root open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-md z-50 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <Dialog.Title className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>⏰ Schedule Automated Export</span>
              </Dialog.Title>
              <Dialog.Close className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</Dialog.Close>
            </div>
            <Dialog.Description className="text-xs text-slate-500">
              Configure recurring delivery of this report directly to your team's email inboxes.
            </Dialog.Description>

            <div className="flex flex-col gap-3.5 text-xs text-slate-700">
              <div>
                <label className="font-semibold block mb-1.5">Export Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Daily', 'Weekly', 'Monthly'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setScheduleFreq(freq)}
                      className={`py-2 rounded-lg font-semibold border transition-all cursor-pointer ${
                        scheduleFreq === freq
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1.5">Report File Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CSV', 'PDF'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setScheduleFormat(fmt)}
                      className={`py-2 rounded-lg font-semibold border transition-all cursor-pointer ${
                        scheduleFormat === fmt
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {fmt === 'CSV' ? '📊 CSV Spreadsheet' : '📄 PDF Document'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Recipient Email(s)</label>
                <input
                  type="email"
                  value={scheduleEmail}
                  onChange={(e) => setScheduleEmail(e.target.value)}
                  placeholder="e.g. operations@servigen.io, team@halo.ai"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSavedSchedule({
                    freq: scheduleFreq,
                    format: scheduleFormat,
                    email: scheduleEmail || 'current_user@servigen.io',
                  });
                  setIsScheduleOpen(false);
                  setStatusMessage(`Export schedule configured: ${scheduleFreq} ${scheduleFormat} to ${scheduleEmail || 'your email'}.`);
                }}
                className="px-4 py-2 text-xs font-bold bg-[#eb6a47] hover:bg-[#d65a37] text-white rounded-lg shadow-sm cursor-pointer transition-all"
              >
                Save Schedule
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Refresh Report Button & Results Count */}
    </div>
  );
}
