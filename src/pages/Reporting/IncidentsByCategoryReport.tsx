import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Popover from '@radix-ui/react-popover';
import { Download, Clock, SlidersHorizontal, Star, BarChart3, Users, CheckCircle2, RefreshCw, BookOpen, Sliders, ShieldAlert, Database, Sparkles } from 'lucide-react';
import { TicketDetailModal } from '../../components/TicketDetailModal';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { ModalShell } from '../../components/shared/ModalShell';
import { MetricCard } from '../../components/shared/MetricCard';
import { SegmentedTabs, type SegmentedTab } from '../../components/shared/SegmentedTabs';
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

  
  const handleFilterFieldChange = (rowId: string, val: string) => {
    setFilters((prev) => prev.map((r) => (r.id === rowId ? { ...r, field: val } : r)));
  };

  const handleFilterOperatorChange = (rowId: string, val: string) => {
    setFilters((prev) => prev.map((r) => (r.id === rowId ? { ...r, operator: val } : r)));
  };

  const handleFilterTagRemove = (rowId: string, tagId: string) => {
    setFilters((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? { ...row, tags: row.tags?.filter((t) => t.id !== tagId) }
          : row
      )
    );
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

  // Contextual filters for Assets
  const [assetSearch, setAssetSearch] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('All');
  const [assetEnvFilter, setAssetEnvFilter] = useState('All');

  // Contextual filters for Changes
  const [changeSearch, setChangeSearch] = useState('');
  const [changeRiskFilter, setChangeRiskFilter] = useState('All');
  const [changeTypeFilter, setChangeTypeFilter] = useState('All');

  const CMDB_ASSETS = useMemo(() => [
    { tag: 'PAY-001', name: 'Primary Payment Gateway Host', type: 'Server', state: 'Deployed', env: 'Production', owner: 'Finance Ops', expiry: '15/12/2026', urgent: true },
    { tag: 'DB-001', name: 'Customer Production Relational DB', type: 'Database', state: 'Deployed', env: 'Production', owner: 'Data Eng', expiry: '28/01/2027', urgent: false },
    { tag: 'SW-001', name: 'Core Backbone Switch 01', type: 'Network', state: 'Deployed', env: 'Production', owner: 'Infrastructure', expiry: '05/12/2026', urgent: true },
    { tag: 'LAP-042', name: 'MacBook Pro M3 Max (Dev Lead)', type: 'Hardware', state: 'Deployed', env: 'End User', owner: 'Engineering', expiry: '12/11/2027', urgent: false },
    { tag: 'LIC-008', name: 'JetBrains Enterprise License Pool', type: 'Software', state: 'Deployed', env: 'Corporate', owner: 'IT Procurement', expiry: '20/12/2026', urgent: true },
    { tag: 'SRV-019', name: 'Kubernetes Ingress Edge Gateway', type: 'Server', state: 'Deployed', env: 'Production', owner: 'DevOps', expiry: '18/03/2027', urgent: false },
    { tag: 'DB-004', name: 'Redis Cache Cluster (EU West)', type: 'Database', state: 'Deployed', env: 'Production', owner: 'Platform Eng', expiry: '10/01/2027', urgent: false },
  ], []);

  const filteredAssets = useMemo(() => {
    return CMDB_ASSETS.filter((ci) => {
      const matchType = assetTypeFilter === 'All' || ci.type === assetTypeFilter;
      const matchEnv = assetEnvFilter === 'All' || ci.env === assetEnvFilter;
      const q = assetSearch.toLowerCase().trim();
      const matchSearch = !q || ci.tag.toLowerCase().includes(q) || ci.name.toLowerCase().includes(q) || ci.owner.toLowerCase().includes(q);
      return matchType && matchEnv && matchSearch;
    });
  }, [CMDB_ASSETS, assetTypeFilter, assetEnvFilter, assetSearch]);

  const CHANGES_DATA = useMemo(() => [
    { id: 'CR-2024-001', title: 'Core Data Center Switch Firmware Upgrade', type: 'Normal', risk: 'High', cab: 'Approved', rollback: 'Dual-image failback switch boot', status: 'Completed' },
    { id: 'CR-2024-002', title: 'PostgreSQL Read Replica Cluster Migration', type: 'Normal', risk: 'Critical', cab: 'Approved', rollback: 'Automated snapshot restore', status: 'In Progress' },
    { id: 'CR-2024-003', title: 'Azure AD SSO Token Expiry Policy Alignment', type: 'Standard', risk: 'Medium', cab: 'Pre-Approved', rollback: 'Session policy reversion', status: 'Completed' },
    { id: 'CR-2024-004', title: 'Kubernetes Worker Node Vulnerability Patch', type: 'Emergency', risk: 'Critical', cab: 'Emergency Sign-off', rollback: 'AMI node drain & revert', status: 'Completed' },
    { id: 'CR-2024-005', title: 'Payment Gateway Webhook Endpoint Migration', type: 'Normal', risk: 'High', cab: 'Pending CAB', rollback: 'Canary traffic routing revert', status: 'Scheduled' },
  ], []);

  const filteredChanges = useMemo(() => {
    return CHANGES_DATA.filter((cr) => {
      const matchRisk = changeRiskFilter === 'All' || cr.risk === changeRiskFilter;
      const matchType = changeTypeFilter === 'All' || cr.type === changeTypeFilter;
      const q = changeSearch.toLowerCase().trim();
      const matchSearch = !q || cr.id.toLowerCase().includes(q) || cr.title.toLowerCase().includes(q);
      return matchRisk && matchType && matchSearch;
    });
  }, [CHANGES_DATA, changeRiskFilter, changeTypeFilter, changeSearch]);


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
      <div className="reporting-main-canvas max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">

        {/* ── Level 1: Report Switcher Navigation Tabs ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
          <div className="p-1 bg-white border border-[#ebdcd3] rounded-full shadow-xs">
            <SegmentedTabs
              tabs={[
                { id: 'category', label: 'Incidents by Category', icon: <BarChart3 className="w-3.5 h-3.5" /> },
                { id: 'sla', label: 'SLA Compliance', icon: <Clock className="w-3.5 h-3.5" /> },
                { id: 'agents', label: 'Agent Performance', icon: <Users className="w-3.5 h-3.5" /> },
                { id: 'fcr', label: 'FCR Rate', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                { id: 'changes', label: 'Changes & CAB', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
                { id: 'assets', label: 'CMDB & Assets', icon: <Database className="w-3.5 h-3.5" /> },
                ...(customQueryConfig
                  ? [
                      {
                        id: 'custom' as ReportType,
                        label: `Custom: ${customQueryConfig.title.slice(0, 20)}...`,
                        icon: <Sparkles className="w-3.5 h-3.5 text-amber-300" />,
                      },
                    ]
                  : []),
              ]}
              activeTab={activeReport}
              onChange={(id) => setActiveReport(id as ReportType)}
              variant="pill"
              theme="navy"
              ariaLabel="Report Switcher Navigation"
            />
          </div>
        </div>

        {/* ── Level 2: Active Report Header Card & Unified Action Toolbar ── */}
        <div className="bg-white border border-[#ebdcd3] rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-[#332B28] tracking-tight m-0">
                {activeReport === 'category' && 'Incidents by Category'}
                {activeReport === 'sla' && 'SLA Compliance & Breach Analysis'}
                {activeReport === 'agents' && 'Agent Performance & Workload Metrics'}
                {activeReport === 'fcr' && 'First Contact Resolution (FCR) Rate'}
                {activeReport === 'changes' && 'Change Management & CAB Risk Analytics'}
                {activeReport === 'assets' && 'CMDB Asset Lifecycle & Expiring Warranties'}
                {activeReport === 'custom' && (customQueryConfig?.title || 'Custom Ad-Hoc Report')}
              </h1>
              <span className="text-[11px] font-bold text-[#C96F55] bg-[#FFF9F5] border border-[#ebdcd3] px-3 py-0.5 rounded-full">
                {activeCatalogReport ? `Template: ${activeCatalogReport.id}` : activeReport === 'category' ? 'INC-01 (Daily/Weekly)' : activeReport === 'sla' ? 'SLA-04 (Contractual)' : activeReport === 'agents' ? 'OPS-02 (Team KPI)' : activeReport === 'fcr' ? 'CSAT-03 (Quality)' : activeReport === 'changes' ? 'CHG-01 (ITIL V4)' : activeReport === 'assets' ? 'AST-08 (Inventory)' : 'AD-HOC (Custom)'}
              </span>
            </div>
            <p className="text-xs text-[#332B28]/70 mt-1 mb-0">
              {activeReport === 'category' && 'Distribution of incident tickets, response times, and team assignments across technical classifications.'}
              {activeReport === 'sla' && 'Contractual SLA response and resolution performance, breach durations, and target threshold metrics.'}
              {activeReport === 'agents' && 'First-line and second-line engineer throughput, ticket close rates, average handling time, and team SLA adherence.'}
              {activeReport === 'fcr' && 'Percentage of customer issues resolved upon initial touchpoint without escalation or handoff overhead.'}
              {activeReport === 'changes' && 'Production RFC throughput, CAB approval velocity, risk profiles, and implementation success rates.'}
              {activeReport === 'assets' && 'Asset distribution across environments, hardware lifecycle states, warranty expirations, and reserve inventory.'}
              {activeReport === 'custom' && `Custom multi-dimensional query evaluating ${customQueryConfig?.entity || 'records'} grouped by ${customQueryConfig?.groupBy || 'dimension'}.`}
            </p>
          </div>

          {/* Contextual Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              className="px-3.5 py-1.5 bg-[#C96F55] hover:bg-[#b55f46] text-white text-xs font-bold rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
              onClick={() => setIsCatalogOpen(true)}
              title="Browse all 24 standardized ITIL pre-built report templates"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Catalog (24)</span>
            </button>

            <button
              type="button"
              className="px-3.5 py-1.5 bg-[#FFF9F5] border border-[#ebdcd3] hover:bg-[#F7C4B3]/20 text-[#332B28] text-xs font-bold rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
              onClick={() => setIsQueryBuilderOpen(true)}
              title="Design custom cross-cutting ad-hoc report using no-code builder"
            >
              <Sliders className="w-3.5 h-3.5 text-[#C96F55]" />
              <span>Query Builder</span>
            </button>

            <button
              type="button"
              className="px-3.5 py-1.5 bg-white border border-[#ebdcd3] hover:bg-[#FFF9F5] text-[#332B28] text-xs font-semibold rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
              onClick={handleExportCSV}
              title="Download report data as CSV file"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              className="px-3.5 py-1.5 bg-white border border-[#ebdcd3] hover:bg-[#FFF9F5] text-[#332B28] text-xs font-semibold rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
              onClick={() => setIsScheduleOpen(true)}
              title="Automate recurring report generation"
            >
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>{savedSchedule ? `Scheduled (${savedSchedule.freq})` : 'Schedule'}</span>
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
                  className="bg-white border border-[#ebdcd3] shadow-xl rounded-xl p-3 z-50 w-52 flex flex-col gap-1.5 text-xs text-[#332B28] animate-in fade-in"
                  sideOffset={6}
                >
                  <span className="font-bold text-[#332B28] pb-1 border-b border-[#ebdcd3]">Toggle Columns</span>
                  {Object.keys(visibleColumns).map((colKey) => (
                    <label key={colKey} className="flex items-center gap-2 cursor-pointer hover:bg-[#FFF9F5] p-1 rounded">
                      <input
                        type="checkbox"
                        checked={visibleColumns[colKey]}
                        onChange={(e) => setVisibleColumns((prev) => ({ ...prev, [colKey]: e.target.checked }))}
                        className="rounded text-[#C96F55] focus:ring-[#C96F55]"
                      />
                      <span className="capitalize">{colKey.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <button
              type="button"
              className="px-3.5 py-1.5 bg-white border border-[#ebdcd3] hover:bg-[#FFF9F5] text-[#332B28] text-xs font-semibold rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
              onClick={() => {
                setIsRefreshing(true);
                setStatusMessage('Refreshed report metrics');
                setTimeout(() => {
                  setIsRefreshing(false);
                  setTimeout(() => setStatusMessage(null), 2000);
                }, 600);
              }}
              title="Refresh report data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C96F55]' : 'text-gray-500'}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className={`px-3.5 py-1.5 border text-xs font-semibold rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all ${
                isFavorite
                  ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                  : 'bg-white border-[#ebdcd3] hover:bg-[#FFF9F5] text-[#332B28]'
              }`}
              onClick={handleToggleFavorite}
              title="Save to personalized My Reports list"
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
              <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>
          </div>
        </div>

        {/* ── Level 3: Active Report Content & Data ── */}

        {/* ══════════════ VIEW 1: INCIDENTS BY CATEGORY ══════════════ */}
        {activeReport === 'category' && (
          <div className="flex flex-col gap-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Total Active Incidents"
                value={tickets.length}
                subtitle="Across 1st & 2nd line support"
              />
              <MetricCard
                label="Critical & High Priority"
                value={tickets.filter((t) => t.priority === 'Critical' || t.priority === 'High').length}
                valueClassName="text-rose-600"
                subtitle={<span className="text-rose-600 font-semibold">Expedited queue handling</span>}
              />
              <MetricCard
                label="SLA Met Compliance"
                value={`${slaMetrics.metPercent}%`}
                valueClassName="text-emerald-600"
                trend={<span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Target 95%</span>}
                subtitle="✓ Met contractual SLA"
              />
              <MetricCard
                label="Active Category Clusters"
                value="6"
                valueClassName="text-[#263B5E]"
                subtitle="Hardware, Network, Software..."
              />
            </div>

            {/* Contextual Incident Filter Strip */}
            <div className="bg-white border border-[#ebdcd3] rounded-2xl p-4 shadow-xs flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#ebdcd3]/60">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-[#332B28] uppercase tracking-wider">Filter Period:</span>
                  <div className="flex items-center gap-2">
                    <select
                      className="bg-[#FFF9F5] border border-[#ebdcd3] rounded-full px-3 py-1.5 text-xs text-[#332B28] font-semibold outline-none focus:ring-1 focus:ring-[#C96F55]"
                      value={dateField}
                      onChange={(e) => setDateField(e.target.value)}
                    >
                      <option value="Date Created">Date Created</option>
                      <option value="Date Resolved">Date Resolved</option>
                      <option value="Date Closed">Date Closed</option>
                    </select>
                    <select
                      className="bg-[#FFF9F5] border border-[#ebdcd3] rounded-full px-3 py-1.5 text-xs text-[#332B28] font-semibold outline-none focus:ring-1 focus:ring-[#C96F55]"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                    >
                      <option value="All">All Time</option>
                      <option value="Today">Today</option>
                      <option value="This Week">This Week</option>
                      <option value="This Month">This Month</option>
                      <option value="This Quarter">This Quarter</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#C96F55] hover:bg-[#C96F55]/10 rounded-full border border-[#C96F55]/30 transition-all cursor-pointer"
                    onClick={handleAddFilterRow}
                    title="Add another filter condition"
                  >
                    <span>+ Add Condition</span>
                  </button>
                  <span className="text-xs font-bold text-[#332B28]/70 bg-[#FFF9F5] border border-[#ebdcd3] px-3 py-1 rounded-full">
                    Showing {sortedTickets.length} matching incidents
                  </span>
                </div>
              </div>

              {/* Dynamic Filter Conditions Builder */}
              {filters.length > 0 && (
                <div className="filter-rows-container pt-2">
                  {filters.map((filter) => (
                    <div key={filter.id} className="filter-item-row flex items-center gap-2 flex-wrap">
                      <select
                        value={filter.field}
                        onChange={(e) => handleFilterFieldChange(filter.id, e.target.value)}
                        className="bg-[#FFF9F5] border border-[#ebdcd3] rounded-full px-3 py-1.5 text-xs text-[#332B28] font-semibold"
                      >
                        <option value="Category">Category</option>
                        <option value="Priority">Priority</option>
                        <option value="Status">Status</option>
                        <option value="Assigned Agent">Assigned Agent</option>
                        <option value="Site">Site</option>
                      </select>
                      <select
                        value={filter.operator}
                        onChange={(e) => handleFilterOperatorChange(filter.id, e.target.value)}
                        className="bg-[#FFF9F5] border border-[#ebdcd3] rounded-full px-3 py-1.5 text-xs text-[#332B28] font-semibold"
                      >
                        <option value="Equals">Equals</option>
                        <option value="Contains">Contains</option>
                        <option value="Does Not Equal">Does Not Equal</option>
                      </select>
                      <div className="flex-1 min-w-[200px] flex items-center gap-1.5 bg-[#FFF9F5] border border-[#ebdcd3] rounded-full px-3 py-1">
                        {filter.tags && filter.tags.length > 0 ? (
                          filter.tags.map((tag) => (
                            <span key={tag.id} className="inline-flex items-center gap-1 bg-white border border-[#ebdcd3] text-[#332B28] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                              {tag.label}
                              <button type="button" onClick={() => handleFilterTagRemove(filter.id, tag.id)} className="text-rose-500 font-bold hover:text-rose-700">✕</button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Condition active</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFilterRow(filter.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full cursor-pointer"
                        title="Remove condition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Active Category Tag pill */}
              {activeCategoryTag && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-[#332B28]/60">Active Filter:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#C96F55]/10 text-[#C96F55] border border-[#C96F55]/20">
                    Category: {activeCategoryTag}
                    <button type="button" onClick={() => setActiveCategoryTag(null)} className="hover:text-rose-600 font-black">✕</button>
                  </span>
                </div>
              )}
            </div>

            {/* Incidents Table */}
            <div className="report-table-wrapper bg-white border border-[#ebdcd3] rounded-2xl overflow-hidden shadow-xs">
              <table className="report-data-table w-full">
                <thead>
                  <tr>
                    <th
                      className="sortable-th cursor-pointer select-none hover:bg-[#FFF9F5] transition-colors"
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
                      className="hover:bg-[#FFF9F5] cursor-pointer transition-colors"
                      title={`View ticket #${t.id} details`}
                    >
                      <td className="font-semibold text-[#332B28]">
                        {sortField === 'category'
                          ? idx === 0 || t.category !== sortedTickets[idx - 1]?.category
                            ? t.category
                            : ''
                          : t.category}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="font-bold text-[#C96F55] hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(t);
                          }}
                        >
                          {t.id}
                        </button>
                      </td>
                      <td className="max-w-[320px] text-[#332B28] font-medium">{t.summary}</td>
                      <td className="whitespace-nowrap text-[#332B28]/70 text-xs">{t.createdAt}</td>
                      <td className="text-xs text-[#332B28]">{t.site}</td>
                      <td className="whitespace-nowrap text-xs text-[#332B28]">{t.team}</td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          t.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : t.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="text-xs font-medium text-[#332B28]">{t.agent}</td>
                      <td>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF9F5] border border-[#ebdcd3] text-[#332B28]">
                          {t.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          t.slaResolutionMet ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {t.slaResolutionMet ? '✓ Met' : '⚠️ Breached'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════ VIEW 2: SLA COMPLIANCE ══════════════ */}
        {activeReport === 'sla' && (
          <div className="flex flex-col gap-6">
            {/* SLA KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="SLA Met Compliance"
                value={`${slaMetrics.metPercent}%`}
                valueClassName="text-emerald-600"
                trend={<span className="text-xs font-bold text-slate-500">Target 95.0%</span>}
                subtitle="↑ +1.4% improvement vs previous period"
              />
              <MetricCard
                label="Met Within Target SLA"
                value={slaMetrics.met}
                trend={<span className="text-xs font-semibold text-emerald-600">✓ On-Track</span>}
                subtitle="Tickets resolved inside contractual SLA"
              />
              <MetricCard
                label="SLA Breached Tickets"
                value={slaMetrics.breached}
                valueClassName="text-rose-600"
                trend={<span className="text-xs font-semibold text-rose-600">⚠️ Critical Review</span>}
                subtitle="Requiring post-incident SLA breach audit"
              />
              <MetricCard
                label="Avg Breach Overrun"
                value="+24m"
                valueClassName="text-amber-600"
                trend={<span className="text-xs font-semibold text-slate-500">Mean time</span>}
                subtitle="Average excess time past breach threshold"
              />
            </div>

            {/* SLA Filter Slices */}
            <div className="bg-white border border-[#ebdcd3] rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#332B28] uppercase tracking-wider">Filter SLA Slices:</span>
                <button
                  type="button"
                  onClick={() => setSlaFilterMode('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                    slaFilterMode === 'all'
                      ? 'bg-[#263B5E] text-white shadow-xs font-bold'
                      : 'bg-white text-[#332B28] border border-[#ebdcd3] hover:bg-[#FFF9F5]'
                  }`}
                >
                  All ({tickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSlaFilterMode('breached')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                    slaFilterMode === 'breached'
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  ⚠️ Breached SLA ({slaMetrics.breached})
                </button>
                <button
                  type="button"
                  onClick={() => setSlaFilterMode('met')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                    slaFilterMode === 'met'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  ✓ Met SLA ({slaMetrics.met})
                </button>
              </div>

              <span className="text-xs font-bold text-[#332B28]/70 bg-[#FFF9F5] border border-[#ebdcd3] px-3 py-1 rounded-full">
                Showing {filteredTickets.length} incidents
              </span>
            </div>

            {/* SLA Table */}
            <div className="report-table-wrapper bg-white border border-[#ebdcd3] rounded-2xl overflow-hidden shadow-xs">
              <table className="report-data-table w-full">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Summary</th>
                    <th>Priority</th>
                    <th>Category</th>
                    <th>Assigned Agent</th>
                    <th>Target SLA</th>
                    <th>Status</th>
                    <th>SLA Met?</th>
                    <th>Breach Overrun / Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="hover:bg-[#FFF9F5] cursor-pointer transition-colors"
                      title={`View ticket #${t.id} details`}
                    >
                      <td className="font-bold text-[#C96F55]">{t.id}</td>
                      <td className="font-medium text-[#332B28]">{t.summary}</td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          t.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="text-xs text-[#332B28]/70">{t.category}</td>
                      <td className="text-xs font-medium text-[#332B28]">{t.agent}</td>
                      <td className="text-xs font-mono">{t.slaTarget || '4h Target'}</td>
                      <td>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF9F5] border border-[#ebdcd3] text-[#332B28]">
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          t.slaResolutionMet ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {t.slaResolutionMet ? '✓ Met' : '⚠️ Breached'}
                        </span>
                      </td>
                      <td className="text-xs font-medium text-rose-700">{t.breachDuration || 'None (Resolved in window)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════ VIEW 3: AGENT PERFORMANCE ══════════════ */}
        {activeReport === 'agents' && (
          <div className="flex flex-col gap-6">
            {/* Agent KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Active Responders"
                value="4 Agents"
                subtitle="Across 1st Line & 2nd Line Support"
              />
              <MetricCard
                label="Tickets Resolved Today"
                value="42 Tickets"
                valueClassName="text-[#C96F55]"
                subtitle="High throughput support sprint"
              />
              <MetricCard
                label="Avg Resolution Time"
                value="1h 48m"
                valueClassName="text-emerald-600"
                subtitle="Down from 2h 15m last quarter"
              />
              <MetricCard
                label="Team SLA Adherence"
                value="96.4%"
                valueClassName="text-emerald-600"
                subtitle="Exceeds corporate 95.0% SLA KPI"
              />
            </div>

            {/* Agent Performance Table */}
            <div className="report-table-wrapper bg-white border border-[#ebdcd3] rounded-2xl overflow-hidden shadow-xs">
              <table className="report-data-table w-full">
                <thead>
                  <tr>
                    <th>Agent Name</th>
                    <th>Role &amp; Assignment Group</th>
                    <th>Active / In-Progress Tickets</th>
                    <th>Resolved Tickets</th>
                    <th>Average Handling Time</th>
                    <th>SLA Resolution Met %</th>
                    <th>Operational Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Alex Rivera', role: '1st Line Senior Agent', active: 7, closed: 28, aht: '1h 24m', metPct: 96.4, color: 'bg-[#C96F55]' },
                    { name: 'Sarah Jenkins', role: '1st Line Support Specialist', active: 4, closed: 22, aht: '1h 52m', metPct: 92.8, color: 'bg-emerald-500' },
                    { name: 'Marcus Chen', role: '2nd Line Network Engineer', active: 5, closed: 10, aht: '3h 10m', metPct: 90.0, color: 'bg-purple-500' },
                    { name: 'Alice Approver', role: 'Operations Lead', closed: 8, active: 2, aht: '45m', metPct: 100.0, color: 'bg-[#263B5E]' },
                  ].map((ag) => (
                    <tr key={ag.name} className="hover:bg-[#FFF9F5] transition-colors">
                      <td className="font-bold text-[#332B28] flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${ag.color}`} />
                        <span>{ag.name}</span>
                      </td>
                      <td className="text-xs text-[#332B28]/70">{ag.role}</td>
                      <td className="font-bold text-[#332B28]">{ag.active}</td>
                      <td className="font-bold text-[#C96F55]">{ag.closed}</td>
                      <td className="font-mono text-xs">{ag.aht}</td>
                      <td className="font-bold text-emerald-600">{ag.metPct}%</td>
                      <td>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {ag.metPct >= 95 ? '★ Top Tier' : '✓ Good'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════ VIEW 4: FIRST CONTACT RESOLUTION (FCR) ══════════════ */}
        {activeReport === 'fcr' && (
          <div className="flex flex-col gap-6">
            {/* FCR KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="First Contact Resolution"
                value="78.4%"
                valueClassName="text-emerald-600"
                subtitle="Industry Benchmark: 70.0% – 75.0%"
              />
              <MetricCard
                label="1st Touch Resolved"
                value="69 Tickets"
                subtitle="No escalations or handoffs required"
              />
              <MetricCard
                label="Escalated Handoffs"
                value="19 Tickets"
                valueClassName="text-amber-600"
                subtitle="Transferred to Tier 2 engineering"
              />
              <MetricCard
                label="Ticket Reopen Rate"
                value="2.1%"
                valueClassName="text-emerald-600"
                subtitle="Below target ceiling of 5.0%"
              />
            </div>

            {/* FCR Breakdown Table */}
            <div className="report-table-wrapper bg-white border border-[#ebdcd3] rounded-2xl overflow-hidden shadow-xs">
              <table className="report-data-table w-full">
                <thead>
                  <tr>
                    <th>Category Classification</th>
                    <th>Total Handled</th>
                    <th>First-Contact Resolved</th>
                    <th>FCR Success Rate</th>
                    <th>Benchmark Comparison</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cat: 'Account Administration & Passwords', total: 35, fcr: 33, rate: '94.3%', comp: '+19.3% vs Industry (75%)' },
                    { cat: 'Office & Collaboration Tools', total: 28, fcr: 24, rate: '85.7%', comp: '+13.7% vs Industry (72%)' },
                    { cat: 'Hardware & Peripheral Setup', total: 18, fcr: 12, rate: '66.7%', comp: '-1.3% vs Industry (68%)' },
                    { cat: 'Network & VPN Connectivity', total: 16, fcr: 11, rate: '68.8%', comp: '+8.8% vs Industry (60%)' },
                  ].map((row) => (
                    <tr key={row.cat} className="hover:bg-[#FFF9F5] transition-colors">
                      <td className="font-bold text-[#332B28]">{row.cat}</td>
                      <td className="font-semibold text-[#332B28]">{row.total}</td>
                      <td className="font-semibold text-emerald-600">{row.fcr}</td>
                      <td className="font-bold text-emerald-700">{row.rate}</td>
                      <td className="text-xs text-emerald-700 font-semibold">{row.comp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════ VIEW 5: CHANGE MANAGEMENT & CAB ══════════════ */}
        {activeReport === 'changes' && (
          <div className="flex flex-col gap-6">
            {/* Changes KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Total Production RFCs"
                value="24"
                subtitle="18 Normal · 4 Standard · 2 Emergency"
              />
              <MetricCard
                label="Change Success Rate"
                value="95.8%"
                valueClassName="text-emerald-600"
                trend={<span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Target &gt;95%</span>}
                subtitle="23 Succeeded · 1 Rollback Triggered"
              />
              <MetricCard
                label="CAB Approval Velocity"
                value="18.4h"
                valueClassName="text-[#263B5E]"
                subtitle="Avg review turnaround time"
              />
              <MetricCard
                label="Emergency / Blackout"
                value="2"
                valueClassName="text-amber-600"
                subtitle="Requires post-implementation audit"
              />
            </div>

            {/* Risk Profile Breakdown Bar */}
            <div className="bg-white p-5 rounded-2xl border border-[#ebdcd3] shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#332B28]">Risk Profile Breakdown &amp; CAB Governance</span>
                <span className="text-xs text-[#332B28]/60 font-medium">Evaluated via 4-Question Risk Scoring Matrix</span>
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

            {/* Contextual Changes Filter Strip */}
            <div className="bg-white border border-[#ebdcd3] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Search change ID, title, rollback..."
                  value={changeSearch}
                  onChange={(e) => setChangeSearch(e.target.value)}
                  className="bg-[#FFF9F5] border border-[#ebdcd3] rounded-full px-3.5 py-1.5 text-xs text-[#332B28] placeholder-[#332B28]/40 outline-none focus:ring-1 focus:ring-[#C96F55] min-w-[240px]"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {['All', 'Critical', 'High', 'Medium', 'Low'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setChangeRiskFilter(r)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                        changeRiskFilter === r
                          ? 'bg-[#263B5E] text-white font-bold'
                          : 'bg-[#FFF9F5] border border-[#ebdcd3] text-[#332B28] hover:bg-white'
                      }`}
                    >
                      {r} Risk
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-xs font-bold text-[#332B28]/70 bg-[#FFF9F5] border border-[#ebdcd3] px-3 py-1 rounded-full self-start sm:self-center">
                Showing {filteredChanges.length} of 24 production RFCs
              </span>
            </div>

            {/* Changes Table */}
            <div className="report-table-wrapper bg-white border border-[#ebdcd3] rounded-2xl overflow-hidden shadow-xs">
              <table className="report-data-table w-full">
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
                  {filteredChanges.map((cr) => (
                    <tr key={cr.id} className="hover:bg-[#FFF9F5] transition-colors">
                      <td className="font-bold text-[#C96F55]">{cr.id}</td>
                      <td className="font-medium text-[#332B28]">{cr.title}</td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          cr.type === 'Emergency' ? 'bg-rose-100 text-rose-700' : cr.type === 'Standard' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {cr.type}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          cr.risk === 'Critical' ? 'bg-rose-100 text-rose-700' : cr.risk === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {cr.risk} Risk
                        </span>
                      </td>
                      <td className="font-semibold text-[#332B28]">{cr.cab}</td>
                      <td className="text-xs text-[#332B28]/70 font-mono">{cr.rollback}</td>
                      <td>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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

        {/* ══════════════ VIEW 6: CMDB ASSET LIFECYCLE ══════════════ */}
        {activeReport === 'assets' && (
          <div className="flex flex-col gap-6">
            {/* Asset KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Total CMDB Assets"
                value="42"
                subtitle="Servers, Appliances & Software"
              />
              <MetricCard
                label="Active Deployed Assets"
                value="31"
                valueClassName="text-emerald-600"
                subtitle={<span className="text-emerald-600 font-semibold">73.8% in live production</span>}
              />
              <MetricCard
                label="Ready In Stock"
                value="6"
                valueClassName="text-[#263B5E]"
                subtitle="Pre-provisioned reserve inventory"
              />
              <MetricCard
                label="Expiring Warranty (<60d)"
                value="5"
                valueClassName="text-rose-600"
                subtitle={<span className="text-rose-600 font-semibold">Requires renewal negotiation</span>}
              />
            </div>

            {/* Asset Lifecycle Progression Bar */}
            <div className="bg-white p-5 rounded-2xl border border-[#ebdcd3] shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#332B28]">CI Lifecycle Progression</span>
                <span className="text-xs text-[#332B28]/60 font-medium">Ordered → In Stock → Deployed → Maintenance → Retired</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
                <div style={{ width: '4.8%' }} className="bg-purple-500" title="Ordered (2)" />
                <div style={{ width: '14.3%' }} className="bg-[#263B5E]" title="In Stock (6)" />
                <div style={{ width: '73.8%' }} className="bg-emerald-500" title="Deployed (31)" />
                <div style={{ width: '4.8%' }} className="bg-amber-500" title="Maintenance (2)" />
                <div style={{ width: '2.3%' }} className="bg-slate-400" title="Retired (1)" />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Ordered (2)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#263B5E]" /> In Stock (6)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Deployed (31)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Maintenance (2)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Retired (1)</span>
              </div>
            </div>

            {/* Contextual Asset Filter Strip (NO INCIDENT MISMATCH!) */}
            <div className="bg-white border border-[#ebdcd3] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Search CI tag, asset name, department..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  className="bg-[#FFF9F5] border border-[#ebdcd3] rounded-full px-3.5 py-1.5 text-xs text-[#332B28] placeholder-[#332B28]/40 outline-none focus:ring-1 focus:ring-[#C96F55] min-w-[240px]"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {['All', 'Server', 'Database', 'Network', 'Hardware', 'Software'].map((tp) => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => setAssetTypeFilter(tp)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                        assetTypeFilter === tp
                          ? 'bg-[#263B5E] text-white font-bold'
                          : 'bg-[#FFF9F5] border border-[#ebdcd3] text-[#332B28] hover:bg-white'
                      }`}
                    >
                      {tp}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-xs font-bold text-[#332B28]/70 bg-[#FFF9F5] border border-[#ebdcd3] px-3 py-1 rounded-full self-start sm:self-center">
                Showing {filteredAssets.length} of 42 CMDB assets
              </span>
            </div>

            {/* Assets Table */}
            <div className="report-table-wrapper bg-white border border-[#ebdcd3] rounded-2xl overflow-hidden shadow-xs">
              <table className="report-data-table w-full">
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
                  {filteredAssets.map((ci) => (
                    <tr key={ci.tag} className="hover:bg-[#FFF9F5] transition-colors">
                      <td className="font-bold text-[#C96F55]">{ci.tag}</td>
                      <td className="font-medium text-[#332B28]">{ci.name}</td>
                      <td>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF9F5] border border-[#ebdcd3] text-[#332B28]">
                          {ci.type}
                        </span>
                      </td>
                      <td>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {ci.state}
                        </span>
                      </td>
                      <td className="text-xs text-[#332B28]/70">{ci.env}</td>
                      <td className="text-xs text-[#332B28]/70">{ci.owner}</td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          ci.urgent ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
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

        {/* ══════════════ VIEW 7: NO-CODE CUSTOM QUERY VIEW ══════════════ */}
        {activeReport === 'custom' && customQueryConfig && (
          <div className="flex flex-col gap-6">
            {/* Custom KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Total Evaluated Records"
                value="128"
                subtitle="Across all active teams"
              />
              <MetricCard
                label="Group Dimensions"
                value="5 Groups"
                valueClassName="text-[#263B5E]"
                subtitle={`Aggregated by ${customQueryConfig.groupBy}`}
              />
              <MetricCard
                label="Avg Value / Group"
                value="25.6"
                valueClassName="text-emerald-600"
                subtitle="Computed live"
              />
            </div>

            {/* Custom Query Header Banner */}
            <div className="p-4 bg-[#FFF9F5] border border-[#ebdcd3] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#263B5E] block">Active Custom Query</span>
                <h3 className="font-bold text-sm text-[#332B28] mt-0.5">{customQueryConfig.title}</h3>
                <p className="text-xs text-[#332B28]/70 mt-0.5">
                  Entity: <strong>{customQueryConfig.entity}</strong> · Metric: <strong>{customQueryConfig.metric}</strong> · Grouped by: <strong>{customQueryConfig.groupBy}</strong> · Window: <strong>{customQueryConfig.timeRange}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQueryBuilderOpen(true)}
                className="px-4 py-1.5 bg-[#C96F55] hover:bg-[#b55f46] text-white text-xs font-bold rounded-full shadow-xs cursor-pointer transition-all self-start sm:self-center"
              >
                Modify Query
              </button>
            </div>

            {/* Custom Aggregation Table */}
            <div className="report-table-wrapper bg-white border border-[#ebdcd3] rounded-2xl overflow-hidden shadow-xs">
              <table className="report-data-table w-full">
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
                    <tr key={row.group} className="hover:bg-[#FFF9F5] transition-colors">
                      <td className="font-bold text-[#332B28]">{row.group}</td>
                      <td className="font-semibold text-[#332B28]">{row.count}</td>
                      <td className="font-bold text-emerald-600">{row.sla}</td>
                      <td className="font-mono text-xs text-[#332B28]/70">{row.time}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#332B28]">{row.share}</span>
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
      <ModalShell
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        size="sm"
        title="⏰ Schedule Automated Export"
        description="Configure recurring delivery of this report directly to your team's email inboxes."
        footer={
          <div className="flex justify-end gap-2 w-full">
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
        }
      >
        <div className="p-6 flex flex-col gap-3.5 text-xs text-[#332B28]">
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
      </ModalShell>

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
