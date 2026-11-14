import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Popover from '@radix-ui/react-popover';
import { Download, Clock, SlidersHorizontal, Star, BarChart3, Users, CheckCircle2, RefreshCw, BookOpen, Sliders, ShieldAlert, Database, Sparkles } from 'lucide-react';
import { TicketDetailModal } from '../../components/TicketDetailModal';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { api } from '../../services/apiClient';
import { ReportCatalogModal } from './ReportCatalogModal';
import { QueryBuilderModal, type CustomQueryConfig } from './QueryBuilderModal';
import { PRE_BUILT_REPORTS, type PreBuiltReportItem } from './reportCatalog.data';
import './IncidentsByCategoryReport.css';

export type ReportType = 'category' | 'sla' | 'agents' | 'fcr' | 'changes' | 'assets' | 'custom';

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

  // Catalog and No-Code Query Builder states
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isQueryBuilderOpen, setIsQueryBuilderOpen] = useState(false);
  const [customQueryConfig, setCustomQueryConfig] = useState<CustomQueryConfig | null>(null);
  const [activeCatalogReport, setActiveCatalogReport] = useState<PreBuiltReportItem | null>(null);

  const handleSelectCatalogReport = (report: PreBuiltReportItem) => {
    setActiveCatalogReport(report);
    setActiveReport(report.targetView);
    setStatusMessage(`Loaded pre-built report: ${report.title} (${report.id})`);
  };

  const handleExecuteCustomQuery = (config: CustomQueryConfig) => {
    setCustomQueryConfig(config);
    setActiveReport('custom');
    setStatusMessage(`Executed custom query: "${config.title}"`);
  };

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

  // Sorting state for report table
  type SortField = 'category' | 'id' | 'summary' | 'createdAt' | 'site' | 'team' | 'priority' | 'agent' | 'status' | 'slaResolutionMet';
  const [sortField, setSortField] = useState<SortField>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortField === 'category') {
        aVal = a.category || '';
        bVal = b.category || '';
      } else if (sortField === 'id') {
        aVal = a.id || '';
        bVal = b.id || '';
      } else if (sortField === 'summary') {
        aVal = a.summary || '';
        bVal = b.summary || '';
      } else if (sortField === 'createdAt') {
        aVal = a.createdAt || '';
        bVal = b.createdAt || '';
      } else if (sortField === 'site') {
        aVal = a.site || '';
        bVal = b.site || '';
      } else if (sortField === 'team') {
        aVal = a.team || '';
        bVal = b.team || '';
      } else if (sortField === 'priority') {
        const pOrder: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        aVal = pOrder[a.priority] || 0;
        bVal = pOrder[b.priority] || 0;
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      } else if (sortField === 'agent') {
        aVal = a.agent || '';
        bVal = b.agent || '';
      } else if (sortField === 'status') {
        aVal = a.status || '';
        bVal = b.status || '';
      } else if (sortField === 'slaResolutionMet') {
        aVal = a.slaResolutionMet ?? 0;
        bVal = b.slaResolutionMet ?? 0;
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const cmp = String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredTickets, sortField, sortOrder]);

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
        {/* Top actions: Export to CSV, Pre-Built Catalog & Custom Query Builder */}
        <div className="report-action-toolbar flex-wrap gap-2">
          {/* Primary Action 1: Pre-Built Report Catalog (24 Templates) */}
          <button
            type="button"
            className="px-4 py-1.5 bg-[#C96F55] hover:bg-[#b55f46] text-white text-xs font-bold rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
            onClick={() => setIsCatalogOpen(true)}
            title="Browse all 24 standardized ITIL pre-built report templates"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Pre-Built Reports Catalog (24)</span>
          </button>

          {/* Primary Action 2: No-Code Query Builder */}
          <button
            type="button"
            className="px-3.5 py-1.5 bg-[#FFF9F5] border border-[#ebdcd3] hover:bg-[#F7C4B3]/20 text-[#332B28] text-xs font-bold rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
            onClick={() => setIsQueryBuilderOpen(true)}
            title="Design custom cross-cutting ad-hoc report using no-code builder"
          >
            <Sliders className="w-3.5 h-3.5 text-[#C96F55]" />
            <span>Custom Query Builder</span>
          </button>

          <button
            type="button"
            className="px-3.5 py-1.5 bg-white border border-[#ebdcd3] hover:bg-[#FFF9F5] text-[#332B28] text-xs font-semibold rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
            onClick={handleExportCSV}
            title="Download report data as CSV file"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export to CSV</span>
          </button>

          <button
            type="button"
            className="px-3.5 py-1.5 bg-white border border-[#ebdcd3] hover:bg-[#FFF9F5] text-[#332B28] text-xs font-semibold rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
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
                className="px-3.5 py-1.5 bg-white border border-[#ebdcd3] hover:bg-[#FFF9F5] text-[#332B28] text-xs font-semibold rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
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
        <div className="mb-5 overflow-x-auto pb-1">
          <div className="inline-flex items-center gap-1 p-1 bg-white border border-[#ebdcd3] rounded-full shadow-2xs flex-nowrap min-w-max">
            <button
              type="button"
              onClick={() => setActiveReport('category')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeReport === 'category'
                  ? 'bg-[#C96F55] text-white shadow-xs font-bold rounded-full'
                  : 'text-[#332B28] hover:text-[#332B28] hover:bg-[#FFF9F5] rounded-full'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Incidents by Category</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReport('sla')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeReport === 'sla'
                  ? 'bg-[#C96F55] text-white shadow-xs font-bold rounded-full'
                  : 'text-[#332B28] hover:text-[#332B28] hover:bg-[#FFF9F5] rounded-full'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>SLA Compliance</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReport('agents')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeReport === 'agents'
                  ? 'bg-[#C96F55] text-white shadow-xs font-bold rounded-full'
                  : 'text-[#332B28] hover:text-[#332B28] hover:bg-[#FFF9F5] rounded-full'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Agent Performance</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReport('fcr')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeReport === 'fcr'
                  ? 'bg-[#C96F55] text-white shadow-xs font-bold rounded-full'
                  : 'text-[#332B28] hover:text-[#332B28] hover:bg-[#FFF9F5] rounded-full'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>FCR Rate</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReport('changes')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeReport === 'changes'
                  ? 'bg-[#C96F55] text-white shadow-xs font-bold rounded-full'
                  : 'text-[#332B28] hover:text-[#332B28] hover:bg-[#FFF9F5] rounded-full'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Changes &amp; CAB</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReport('assets')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeReport === 'assets'
                  ? 'bg-[#C96F55] text-white shadow-xs font-bold rounded-full'
                  : 'text-[#332B28] hover:text-[#332B28] hover:bg-[#FFF9F5] rounded-full'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>CMDB &amp; Assets</span>
            </button>
            {customQueryConfig && (
              <button
                type="button"
                onClick={() => setActiveReport('custom')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeReport === 'custom'
                    ? 'bg-[#263B5E] text-white shadow-xs font-bold rounded-full'
                    : 'text-[#263B5E] hover:bg-[#FFF9F5] border border-[#263B5E]/30 rounded-full'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Custom: {customQueryConfig.title.slice(0, 24)}...</span>
              </button>
            )}
          </div>
        </div>

        {/* Page Title & Active Report Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h1 className="report-page-heading mb-0">
            {activeReport === 'category' && 'Incidents by Category'}
            {activeReport === 'sla' && 'SLA Compliance & Breach Analysis'}
            {activeReport === 'agents' && 'Agent Performance & Workload Metrics'}
            {activeReport === 'fcr' && 'First Contact Resolution (FCR) Rate'}
            {activeReport === 'changes' && 'Change Management & CAB Risk Analytics'}
            {activeReport === 'assets' && 'CMDB Asset Lifecycle & Expiring Warranties'}
            {activeReport === 'custom' && (customQueryConfig?.title || 'Custom Ad-Hoc Report')}
          </h1>
          {activeCatalogReport && (
            <span className="text-xs text-slate-500 font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-full self-start">
              Template: <strong className="text-slate-800">{activeCatalogReport.id}</strong> ({activeCatalogReport.frequency})
            </span>
          )}
        </div>

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
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#C96F55] hover:bg-[#C96F55]/10 rounded-full border border-[#C96F55]/30 transition-all cursor-pointer"
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
            className="px-4 py-2 bg-[#C96F55] hover:bg-[#b55f46] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
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
                  <th
                    className="sortable-th cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('category')}
                    title="Click to toggle sort order by Category"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      <span className="text-[11px] font-bold text-[#C96F55]">
                        {sortField === 'category' ? (sortOrder === 'asc' ? '▲' : '▼') : '▲'}
                      </span>
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
                {sortedTickets.map((t, idx) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    title={`View ticket #${t.id} details`}
                  >
                    <td className="font-semibold text-slate-800">
                      {sortField === 'category'
                        ? idx === 0 || t.category !== sortedTickets[idx - 1]?.category
                          ? t.category
                          : ''
                        : t.category}
                    </td>
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

        {/* ── View 5: Change Management & CAB Risk Analytics ── */}
        {activeReport === 'changes' && (
          <div className="flex flex-col gap-5">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Production RFCs</span>
                <span className="text-2xl font-black text-slate-900 mt-2">24</span>
                <span className="text-[11px] text-slate-400 mt-1">18 Normal · 4 Standard · 2 Emergency</span>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Change Success Rate</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-emerald-600">95.8%</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Target &gt;95%</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1">23 Succeeded · 1 Rollback Triggered</span>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CAB Approval Velocity</span>
                <span className="text-2xl font-black text-indigo-600 mt-2">18.4h</span>
                <span className="text-[11px] text-slate-400 mt-1">Avg review turnaround time</span>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency / Blackout</span>
                <span className="text-2xl font-black text-amber-600 mt-2">2</span>
                <span className="text-[11px] text-slate-400 mt-1">Requires post-implementation audit</span>
              </div>
            </div>

            {/* Change Risk Distribution Progress */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Risk Profile Breakdown &amp; CAB Governance</span>
                <span className="text-xs text-slate-400 font-medium">Evaluated via 4-Question Risk Scoring Matrix</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
                <div style={{ width: '12.5%' }} className="bg-rose-500" title="Critical Risk (3)" />
                <div style={{ width: '29.2%' }} className="bg-amber-500" title="High Risk (7)" />
                <div style={{ width: '45.8%' }} className="bg-blue-500" title="Medium Risk (11)" />
                <div style={{ width: '12.5%' }} className="bg-emerald-500" title="Low Risk (3)" />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> <strong>Critical:</strong> 3 (12.5%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> <strong>High:</strong> 7 (29.2%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> <strong>Medium:</strong> 11 (45.8%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> <strong>Low:</strong> 3 (12.5%)</span>
              </div>
            </div>

            {/* Changes Table */}
            <div className="report-table-wrapper">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th>Change ID</th>
                    <th>Change Title &amp; Purpose</th>
                    <th>Type</th>
                    <th>Risk Profile</th>
                    <th>CAB Status</th>
                    <th>Rollback &amp; Backout Strategy</th>
                    <th>Execution Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'CR-2024-001', title: 'Core Data Center Switch Firmware Upgrade', type: 'Normal', risk: 'High', cab: 'Approved', rollback: 'Dual-image failback switch boot', status: 'Completed' },
                    { id: 'CR-2024-002', title: 'PostgreSQL Read Replica Cluster Migration', type: 'Normal', risk: 'Critical', cab: 'Approved', rollback: 'Automated snapshot restore', status: 'In Progress' },
                    { id: 'CR-2024-003', title: 'Azure AD SSO Token Expiry Policy Alignment', type: 'Standard', risk: 'Medium', cab: 'Pre-Approved', rollback: 'Session policy reversion', status: 'Completed' },
                    { id: 'CR-2024-004', title: 'Kubernetes Worker Node Vulnerability Patch', type: 'Emergency', risk: 'Critical', cab: 'Emergency Sign-off', rollback: 'AMI node drain & revert', status: 'Completed' },
                    { id: 'CR-2024-005', title: 'Payment Gateway Webhook Endpoint Migration', type: 'Normal', risk: 'High', cab: 'Pending CAB', rollback: 'Canary traffic routing revert', status: 'Scheduled' },
                  ].map((cr) => (
                    <tr key={cr.id}>
                      <td className="font-bold text-slate-800">{cr.id}</td>
                      <td className="font-medium text-slate-800">{cr.title}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          cr.type === 'Emergency' ? 'bg-rose-100 text-rose-700' : cr.type === 'Standard' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {cr.type}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          cr.risk === 'Critical' ? 'bg-rose-100 text-rose-700' : cr.risk === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {cr.risk} Risk
                        </span>
                      </td>
                      <td className="font-semibold text-slate-700">{cr.cab}</td>
                      <td className="text-xs text-slate-600 font-mono">{cr.rollback}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {cr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── View 6: CMDB Asset Lifecycle & Expiring Warranties ── */}
        {activeReport === 'assets' && (
          <div className="flex flex-col gap-5">
            {/* Asset KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total CMDB Assets</span>
                <span className="text-2xl font-black text-slate-900 mt-2">42</span>
                <span className="text-[11px] text-slate-400 mt-1">Servers, Appliances &amp; Software</span>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Deployed Assets</span>
                <span className="text-2xl font-black text-emerald-600 mt-2">31</span>
                <span className="text-[11px] text-slate-400 mt-1">73.8% in live production environments</span>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ready In Stock</span>
                <span className="text-2xl font-black text-indigo-600 mt-2">6</span>
                <span className="text-[11px] text-slate-400 mt-1">Pre-provisioned reserve inventory</span>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expiring Warranty (&lt;60d)</span>
                <span className="text-2xl font-black text-rose-600 mt-2">5</span>
                <span className="text-[11px] text-rose-600 font-semibold mt-1">Requires renewal negotiation</span>
              </div>
            </div>

            {/* Asset Lifecycle Distribution Progress */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">CI Lifecycle Progression</span>
                <span className="text-xs text-slate-400 font-medium">Ordered → In Stock → Deployed → Maintenance → Retired</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
                <div style={{ width: '4.8%' }} className="bg-purple-500" title="Ordered (2)" />
                <div style={{ width: '14.3%' }} className="bg-indigo-500" title="In Stock (6)" />
                <div style={{ width: '73.8%' }} className="bg-emerald-500" title="Deployed (31)" />
                <div style={{ width: '4.8%' }} className="bg-amber-500" title="Maintenance (2)" />
                <div style={{ width: '2.3%' }} className="bg-slate-400" title="Retired (1)" />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Ordered (2)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> In Stock (6)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Deployed (31)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Maintenance (2)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Retired (1)</span>
              </div>
            </div>

            {/* Assets Table */}
            <div className="report-table-wrapper">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th>CI Tag</th>
                    <th>Asset Name</th>
                    <th>CI Type</th>
                    <th>Lifecycle State</th>
                    <th>Environment</th>
                    <th>Owner / Department</th>
                    <th>Warranty Expiry &amp; Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { tag: 'PAY-001', name: 'Primary Payment Gateway Host', type: 'Server', state: 'Deployed', env: 'Production', owner: 'Finance Ops', expiry: '15/12/2026', urgent: true },
                    { tag: 'DB-001', name: 'Customer Production Relational DB', type: 'Database', state: 'Deployed', env: 'Production', owner: 'Data Eng', expiry: '28/01/2027', urgent: false },
                    { tag: 'SW-001', name: 'Core Backbone Switch 01', type: 'Network', state: 'Deployed', env: 'Production', owner: 'Infrastructure', expiry: '05/12/2026', urgent: true },
                    { tag: 'LAP-042', name: 'MacBook Pro M3 Max (Dev Lead)', type: 'Hardware', state: 'Deployed', env: 'End User', owner: 'Engineering', expiry: '12/11/2027', urgent: false },
                    { tag: 'LIC-008', name: 'JetBrains Enterprise License Pool', type: 'Software', state: 'Deployed', env: 'Corporate', owner: 'IT Procurement', expiry: '20/12/2026', urgent: true },
                  ].map((ci) => (
                    <tr key={ci.tag}>
                      <td className="font-bold text-slate-800">{ci.tag}</td>
                      <td className="font-medium text-slate-800">{ci.name}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                          {ci.type}
                        </span>
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {ci.state}
                        </span>
                      </td>
                      <td className="text-xs text-slate-600">{ci.env}</td>
                      <td className="text-xs text-slate-600">{ci.owner}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          ci.urgent ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ci.expiry} {ci.urgent && '⚠️ (<60d)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── View 7: No-Code Custom Query Result View ── */}
        {activeReport === 'custom' && customQueryConfig && (
          <div className="flex flex-col gap-5">
            {/* Custom Query Header Banner */}
            <div className="p-4 bg-[#FFF9F5] border border-[#ebdcd3] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#263B5E] block">Active Custom Query</span>
                <h3 className="font-bold text-sm text-slate-900 mt-0.5">{customQueryConfig.title}</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Entity: <strong>{customQueryConfig.entity}</strong> · Metric: <strong>{customQueryConfig.metric}</strong> · Grouped by: <strong>{customQueryConfig.groupBy}</strong> · Window: <strong>{customQueryConfig.timeRange}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQueryBuilderOpen(true)}
                className="px-3.5 py-1.5 bg-[#C96F55] hover:bg-[#b55f46] text-white text-xs font-bold rounded-full shadow-xs cursor-pointer transition-all self-start sm:self-center"
              >
                Modify Query
              </button>
            </div>

            {/* Custom KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Evaluated Records</span>
                <span className="text-2xl font-black text-slate-900 block mt-2">128</span>
                <span className="text-[11px] text-slate-400 mt-1">Across all active teams</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group Dimensions</span>
                <span className="text-2xl font-black text-[#263B5E] block mt-2">5 Groups</span>
                <span className="text-[11px] text-slate-400 mt-1">Aggregated by {customQueryConfig.groupBy}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Value / Group</span>
                <span className="text-2xl font-black text-emerald-600 block mt-2">25.6</span>
                <span className="text-[11px] text-slate-400 mt-1">Computed live</span>
              </div>
            </div>

            {/* Custom Aggregation Table */}
            <div className="report-table-wrapper">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th className="capitalize">{customQueryConfig.groupBy} Group</th>
                    <th>Record Count</th>
                    <th>SLA Resolution Met %</th>
                    <th>Average Handling Time</th>
                    <th>Relative Share (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { group: 'Critical / High Impact', count: 42, sla: '90.5%', time: '1h 12m', share: '32.8%' },
                    { group: 'Standard Service Requests', count: 38, sla: '97.4%', time: '45m', share: '29.7%' },
                    { group: 'Infrastructure & Network', count: 24, sla: '91.7%', time: '2h 05m', share: '18.8%' },
                    { group: 'Application & Software', count: 16, sla: '87.5%', time: '3h 15m', share: '12.5%' },
                    { group: 'Access & Compliance', count: 8, sla: '100.0%', time: '22m', share: '6.2%' },
                  ].map((row) => (
                    <tr key={row.group}>
                      <td className="font-bold text-slate-800">{row.group}</td>
                      <td className="font-semibold text-slate-800">{row.count}</td>
                      <td className="font-bold text-emerald-600">{row.sla}</td>
                      <td className="font-mono text-xs">{row.time}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{row.share}</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-[#C96F55]" style={{ width: row.share }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <Dialog.Content className="fixed inset-0 m-auto bg-white rounded-2xl shadow-2xl border border-[#ebdcd3] p-6 w-full max-w-md h-fit max-h-[90vh] z-50 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#ebdcd3] pb-3">
              <Dialog.Title className="text-base font-bold text-[#332B28] flex items-center gap-2">
                <span>⏰ Schedule Automated Export</span>
              </Dialog.Title>
              <Dialog.Close className="text-[#332B28]/50 hover:text-[#332B28] text-lg cursor-pointer transition-colors">✕</Dialog.Close>
            </div>
            <Dialog.Description className="text-xs text-[#332B28]/70">
              Configure recurring delivery of this report directly to your team's email inboxes.
            </Dialog.Description>

            <div className="flex flex-col gap-3.5 text-xs text-[#332B28]">
              <div>
                <label className="font-semibold block mb-1.5 text-[#332B28]">Export Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Daily', 'Weekly', 'Monthly'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setScheduleFreq(freq)}
                      className={`py-2 rounded-full font-semibold border transition-all cursor-pointer ${
                        scheduleFreq === freq
                          ? 'bg-[#263B5E] text-white border-[#263B5E] shadow-xs'
                          : 'bg-white text-[#332B28] border-[#ebdcd3] hover:bg-[#FFF9F5]'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1.5 text-[#332B28]">Report File Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CSV', 'PDF'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setScheduleFormat(fmt)}
                      className={`py-2 rounded-full font-semibold border transition-all cursor-pointer ${
                        scheduleFormat === fmt
                          ? 'bg-[#C96F55] text-white border-[#C96F55] shadow-xs'
                          : 'bg-white text-[#332B28] border-[#ebdcd3] hover:bg-[#FFF9F5]'
                      }`}
                    >
                      {fmt === 'CSV' ? '📊 CSV Spreadsheet' : '📄 PDF Document'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[#332B28]">Recipient Email(s)</label>
                <input
                  type="email"
                  value={scheduleEmail}
                  onChange={(e) => setScheduleEmail(e.target.value)}
                  placeholder="e.g. operations@servigen.io, team@halo.ai"
                  className="w-full px-3.5 py-2.5 border border-[#ebdcd3] rounded-xl text-xs text-[#332B28] bg-white placeholder-[#332B28]/40 focus:outline-none focus:ring-2 focus:ring-[#C96F55] focus:border-[#C96F55] transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ebdcd3]">
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#332B28] hover:bg-[#FFF9F5] border border-[#ebdcd3] rounded-full cursor-pointer transition-all"
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
                className="px-5 py-2 text-xs font-bold bg-[#C96F55] hover:bg-[#b55f46] text-white rounded-full shadow-sm cursor-pointer transition-all"
              >
                Save Schedule
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Pre-Built Report Catalog Modal ── */}
      <ReportCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectReport={handleSelectCatalogReport}
        activeReportId={activeCatalogReport?.id}
      />

      {/* ── No-Code Custom Query Builder Modal ── */}
      <QueryBuilderModal
        isOpen={isQueryBuilderOpen}
        onClose={() => setIsQueryBuilderOpen(false)}
        onExecuteQuery={handleExecuteCustomQuery}
      />

      {/* Refresh Report Button & Results Count */}
    </div>
  );
}
