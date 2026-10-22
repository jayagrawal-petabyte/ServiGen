import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import GetStartedGuide from '../../components/shared/GetStartedGuide';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { TicketDetailModal, type FullTicket } from '../../components/TicketDetailModal';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { api } from '../../services/apiClient';
import { fetchActiveChangeRequests } from '../../services/changeRequestsService';
import './RequestsPage.css';

export interface CustomView {
  id: string;
  name: string;
  status: 'All' | 'Open Requests' | 'In Progress' | 'New';
  team: string;
  priority: string;
}

export interface RequestItem {
  id: string;
  slaTimeLeft: string;
  summary: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'In Progress' | 'New' | 'Open' | 'Resolved';
  type: string;
  date: string;
  agent: string;
  team: string;
  requester?: string;
  description?: string;
}

export const DEFAULT_REQUESTS: RequestItem[] = [
  {
    id: '0003650',
    slaTimeLeft: '-42:15',
    summary: 'Developer laptop replacement - MacBook Pro M3',
    category: 'Hardware>Laptop',
    priority: 'Medium',
    status: 'In Progress',
    type: 'Service Request',
    date: '18/10/2026',
    agent: 'Adam Admin',
    team: '1st Line Support',
    requester: 'David Miller',
    description: 'Hardware upgrade request for lead engineer onboarding in London office.',
  },
  {
    id: '0003651',
    slaTimeLeft: '-14:30',
    summary: 'Request Google Workspace Enterprise licence',
    category: 'Identity & Access>Google Workspace',
    priority: 'Low',
    status: 'New',
    type: 'Service Request',
    date: '19/10/2026',
    agent: 'Adam Admin',
    team: '1st Line Support',
    requester: 'Sarah Jenkins',
    description: 'Provision Google Workspace Enterprise licence with security hardware key 2FA.',
  },
  {
    id: '0003652',
    slaTimeLeft: '-08:45',
    summary: 'Dual 27-inch 4K monitor setup for Analytics desk',
    category: 'Hardware>Monitor',
    priority: 'Medium',
    status: 'In Progress',
    type: 'Service Request',
    date: '19/10/2026',
    agent: 'Alex Agent',
    team: '1st Line Support',
    requester: 'Emma Watson',
    description: 'Setup two 4K external monitors with USB-C display link docking station.',
  },
  {
    id: '0003653',
    slaTimeLeft: '-02:10',
    summary: 'VPN profile setup for remote contractor',
    category: 'Network>VPN',
    priority: 'High',
    status: 'In Progress',
    type: 'Service Request',
    date: '20/10/2026',
    agent: 'Alex Agent',
    team: '1st Line Support',
    requester: 'Carlos Ray',
    description: 'Issue wireguard profile and client cert for EMEA contractor team.',
  },
  {
    id: '0003654',
    slaTimeLeft: '05:20',
    summary: 'SQL Server read-only reporting replica access',
    category: 'Database>Access',
    priority: 'High',
    status: 'New',
    type: 'Service Request',
    date: '21/10/2026',
    agent: 'Unassigned',
    team: '1st Line Support',
    requester: 'Marcus Brody',
    description: 'Grant read-only reporting access on replica prod-db-02 for BI dashboard ETL.',
  },
  {
    id: '0003655',
    slaTimeLeft: '18:00',
    summary: 'New hire software onboarding pack - Engineering',
    category: 'Software>Operating System',
    priority: 'Medium',
    status: 'New',
    type: 'Service Request',
    date: '21/10/2026',
    agent: 'Unassigned',
    team: '1st Line Support',
    requester: 'Linda Chen',
    description: 'Pre-configure Docker, IDE, Node, Python, and Git SSH keys on developer workstation.',
  },
  {
    id: '0003656',
    slaTimeLeft: '-110:00',
    summary: 'Shared departmental mailbox creation - logistics@company.com',
    category: 'Email>Distribution List',
    priority: 'Low',
    status: 'In Progress',
    type: 'Service Request',
    date: '17/10/2026',
    agent: 'Alex Agent',
    team: '2nd Line Support',
    requester: 'Karen White',
    description: 'Create M365 shared mailbox and delegate send-as access to 4 team members.',
  },
  {
    id: '0003657',
    slaTimeLeft: '03:40',
    summary: 'Core switch VLAN reconfiguration for lab room 302',
    category: 'Infrastructure>Network',
    priority: 'Critical',
    status: 'New',
    type: 'Service Request',
    date: '22/10/2026',
    agent: 'Unassigned',
    team: 'Infrastructure',
    requester: 'Network Operations',
    description: 'Port untagged VLAN 40 and trunk configuration for test hardware lab.',
  },
  {
    id: '0003658',
    slaTimeLeft: 'Resolved',
    summary: 'Replace faulty wireless keyboard and mouse set',
    category: 'Hardware>Peripherals',
    priority: 'Low',
    status: 'Resolved',
    type: 'Service Request',
    date: '16/10/2026',
    agent: 'Adam Admin',
    team: '1st Line Support',
    requester: 'Robert Paulson',
    description: 'Issued Logitech MX Master combo from IT asset stockroom.',
  },
  {
    id: '0003659',
    slaTimeLeft: '12:45',
    summary: 'Temporary AWS IAM elevated access for production release',
    category: 'Cloud>AWS',
    priority: 'High',
    status: 'New',
    type: 'Service Request',
    date: '22/10/2026',
    agent: 'Adam Admin',
    team: '2nd Line Support',
    requester: 'DevOps Lead',
    description: 'Request 4-hour elevation to AdministratorAccess on prod-account-01 for migration.',
  },
  {
    id: '0003660',
    slaTimeLeft: '-25:00',
    summary: 'Virtual machine scale-up - 32GB RAM for compilation host',
    category: 'Infrastructure>Compute',
    priority: 'Medium',
    status: 'In Progress',
    type: 'Service Request',
    date: '20/10/2026',
    agent: 'Unassigned',
    team: 'Infrastructure',
    requester: 'Build Automation',
    description: 'Upgrade runner-builder-04 from 16GB to 32GB memory in vCenter.',
  },
  {
    id: '0003661',
    slaTimeLeft: 'Resolved',
    summary: 'Request Adobe Creative Cloud all-apps licence',
    category: 'Software>Design',
    priority: 'Low',
    status: 'Resolved',
    type: 'Service Request',
    date: '15/10/2026',
    agent: 'Alex Agent',
    team: '1st Line Support',
    requester: 'Marketing Designer',
    description: 'Provision Enterprise Adobe CC licence for marketing visual assets.',
  },
];

export const RequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const currentUserName = user?.fullName || 'Adam Admin';

  // Navigation & Hierarchy State - default to 'All Agents' so tickets are immediately visible
  const [selectedTeam, setSelectedTeam] = useState<string>('1st Line Support');
  const [selectedAgent, setSelectedAgent] = useState<string>('All Agents');
  const [is1stLineExpanded, setIs1stLineExpanded] = useState<boolean>(true);
  const [is2ndLineExpanded, setIs2ndLineExpanded] = useState<boolean>(false);
  const [isInfraExpanded, setIsInfraExpanded] = useState<boolean>(false);
  const [isTreeCollapsed, setIsTreeCollapsed] = useState<boolean>(false);
  const [searchTree, setSearchTree] = useState<string>('');

  // Table Data State with guaranteed offline fallback
  const [requestsList, setRequestsList] = useState<RequestItem[]>(DEFAULT_REQUESTS);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<RequestItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open Requests' | 'In Progress' | 'New'>('Open Requests');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Custom Saved Views (Halo AI Style)
  const [customViews, setCustomViews] = useState<CustomView[]>(() => {
    try {
      const saved = localStorage.getItem('sg_custom_views');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeCustomView, setActiveCustomView] = useState<CustomView | null>(null);
  const [isCreateViewModalOpen, setIsCreateViewModalOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [newViewStatus, setNewViewStatus] = useState<'All' | 'Open Requests' | 'In Progress' | 'New'>('Open Requests');
  const [newViewTeam, setNewViewTeam] = useState('All Teams');
  const [newViewPriority, setNewViewPriority] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const [activeCrCount, setActiveCrCount] = useState<number | null>(1);

  // Dropdown reference for click-outside
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveCustomView = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewName.trim()) return;

    const newView: CustomView = {
      id: `view-${Date.now()}`,
      name: newViewName.trim(),
      status: newViewStatus,
      team: newViewTeam,
      priority: newViewPriority,
    };

    const updated = [...customViews, newView];
    setCustomViews(updated);
    try {
      localStorage.setItem('sg_custom_views', JSON.stringify(updated));
    } catch {}

    setActiveCustomView(newView);
    setIsCreateViewModalOpen(false);
    setNewViewName('');
    setStatusMessage(`✓ Custom view "${newView.name}" created and applied`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleDeleteCustomView = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = customViews.filter((v) => v.id !== id);
    setCustomViews(updated);
    try {
      localStorage.setItem('sg_custom_views', JSON.stringify(updated));
    } catch {}
    if (activeCustomView?.id === id) {
      setActiveCustomView(null);
      setStatusFilter('Open Requests');
    }
  };

  const loadData = useCallback(async () => {
    try {
      // 1. Fetch live active change requests count
      try {
        const crRes = await fetchActiveChangeRequests();
        const crList = Array.isArray(crRes?.data) ? crRes.data : [];
        setActiveCrCount(crList.length);
      } catch (crErr) {
        console.warn('[RequestsPage] Active CRs fetch error, using fallback count:', crErr);
        setActiveCrCount(1);
      }

      // 2. Fetch live requests
      const res: any = await api.get('/api/tickets', { params: { ticketType: 'Service Request' } });
      let items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      if (items.length === 0) {
        const allRes: any = await api.get('/api/tickets');
        const allItems = Array.isArray(allRes?.data) ? allRes.data : Array.isArray(allRes) ? allRes : [];
        if (allItems.length > 0) {
          items = allItems;
        }
      }

      if (items.length > 0) {
        const mapped: RequestItem[] = items.map((t: any) => {
          let agentName = 'Unassigned';
          if (typeof t.assignedAgent === 'string' && t.assignedAgent.trim()) {
            agentName = t.assignedAgent;
          } else if (t.assignedAgent?.fullName) {
            agentName = t.assignedAgent.fullName;
          } else if (t.assignedAgent?.firstName) {
            agentName = `${t.assignedAgent.firstName} ${t.assignedAgent.lastName || ''}`.trim();
          } else if (typeof t.agent === 'string' && t.agent.trim()) {
            agentName = t.agent;
          }

          const rawSla = t.slaTimeLeft != null ? String(t.slaTimeLeft) : '-12:00';
          const slaStr = t.slaFormatted || (rawSla.startsWith('-') ? rawSla : `${rawSla}m`);

          return {
            id: String(t.id).padStart(7, '0'),
            slaTimeLeft: slaStr,
            summary: t.summary || t.title || 'Service Request',
            category: t.category || 'General Access',
            priority: (t.priority || 'Medium') as RequestItem['priority'],
            status: (t.status === 'Actioned' || t.status === 'Resolved' ? 'Resolved' : t.status === 'Active' ? 'In Progress' : 'New') as RequestItem['status'],
            type: t.ticketType || 'Service Request',
            date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : 'Today',
            agent: agentName,
            team: t.assignedTeam || t.team || '1st Line Support',
            requester: t.requester || 'User',
            description: t.description || t.summary,
          };
        });
        setRequestsList(mapped);
      } else {
        // Keep default requests if backend returned 0 items
        setRequestsList((prev) => (prev.length > 0 ? prev : DEFAULT_REQUESTS));
      }
    } catch (err) {
      console.warn('[RequestsPage] Live service requests fetch error, fallback active:', err);
      // On network failure or offline backend, ensure default requests are populated
      setRequestsList((prev) => (prev.length > 0 ? prev : DEFAULT_REQUESTS));
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Auto-open modal if ?id= query param is specified
  useEffect(() => {
    const targetId = searchParams.get('id');
    if (targetId) {
      const cleanTarget = targetId.toLowerCase().replace(/^(sr-|req-)/i, '').padStart(7, '0');
      const match = requestsList.find(
        (r) =>
          r.id.toLowerCase() === targetId.toLowerCase() ||
          r.id.toLowerCase().includes(cleanTarget) ||
          targetId.toLowerCase().includes(r.id.toLowerCase())
      );
      if (match) {
        setSelectedTicketForModal(match);
      }
    }
  }, [searchParams, requestsList]);

  // New Ticket Modal State
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [newSummary, setNewSummary] = useState('');
  const [newCategory, setNewCategory] = useState('Hardware>Laptop');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [newDescription, setNewDescription] = useState('');
  const [newTeam, setNewTeam] = useState('1st Line Support');
  const [newAgent, setNewAgent] = useState('Adam Admin');

  // Filter requests based on selected agent, team, and filter mode
  const filteredRequests = useMemo(() => {
    return requestsList.filter((req) => {
      // If a custom view is active, evaluate its specific criteria
      if (activeCustomView) {
        if (activeCustomView.status === 'Open Requests' && req.status === 'Resolved') return false;
        if (activeCustomView.status === 'In Progress' && req.status !== 'In Progress') return false;
        if (activeCustomView.status === 'New' && req.status !== 'New') return false;

        if (activeCustomView.team && activeCustomView.team !== 'All Teams') {
          if (req.team.toLowerCase() !== activeCustomView.team.toLowerCase()) return false;
        }

        if (activeCustomView.priority && activeCustomView.priority !== 'All') {
          if (req.priority !== activeCustomView.priority) return false;
        }
      } else {
        // Standard Agent & Team filter
        if (selectedAgent && selectedAgent !== 'All Agents') {
          if (req.agent.toLowerCase() !== selectedAgent.toLowerCase()) return false;
          if (selectedTeam && selectedTeam !== 'All Teams' && req.team.toLowerCase() !== selectedTeam.toLowerCase()) {
            return false;
          }
        } else if (selectedTeam && selectedTeam !== 'All Teams') {
          if (req.team.toLowerCase() !== selectedTeam.toLowerCase()) return false;
        }

        // Standard Status filter
        if (statusFilter === 'Open Requests') {
          if (req.status === 'Resolved') return false;
        } else if (statusFilter === 'In Progress') {
          if (req.status !== 'In Progress') return false;
        } else if (statusFilter === 'New') {
          if (req.status !== 'New') return false;
        }
      }

      // Search filter
      if (searchTree.trim()) {
        const query = searchTree.toLowerCase();
        return (
          req.id.toLowerCase().includes(query) ||
          req.summary.toLowerCase().includes(query) ||
          req.category.toLowerCase().includes(query) ||
          req.agent.toLowerCase().includes(query) ||
          req.team.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [requestsList, selectedAgent, selectedTeam, statusFilter, activeCustomView, searchTree]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTeam, selectedAgent, statusFilter, searchTree]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Dynamic tree counts & agents
  const firstLineAgents = useMemo(() => {
    return [...new Set(
      requestsList
        .filter((r) => r.team === '1st Line Support' && r.agent !== 'Unassigned' && r.agent !== currentUserName && r.agent)
        .map((r) => r.agent)
    )];
  }, [requestsList, currentUserName]);

  const secondLineAgents = useMemo(() => {
    return [...new Set(
      requestsList
        .filter((r) => r.team === '2nd Line Support' && r.agent !== 'Unassigned' && r.agent)
        .map((r) => r.agent)
    )];
  }, [requestsList]);

  const infraAgents = useMemo(() => {
    return [...new Set(
      requestsList
        .filter((r) => r.team === 'Infrastructure' && r.agent !== 'Unassigned' && r.agent)
        .map((r) => r.agent)
    )];
  }, [requestsList]);

  const counts = useMemo(() => {
    const unassignedCount = requestsList.filter((r) => r.team === '1st Line Support' && r.agent === 'Unassigned').length;
    const demoUserCount = requestsList.filter((r) => r.team === '1st Line Support' && r.agent.toLowerCase() === currentUserName.toLowerCase()).length;
    const firstLineTotal = requestsList.filter((r) => r.team === '1st Line Support').length;
    const secondLineTotal = requestsList.filter((r) => r.team === '2nd Line Support').length;
    const infraTotal = requestsList.filter((r) => r.team === 'Infrastructure').length;
    const allTotal = requestsList.length;

    const otherCounts: Record<string, number> = {};
    firstLineAgents.forEach((name) => {
      otherCounts[name] = requestsList.filter((r) => r.team === '1st Line Support' && r.agent === name).length;
    });

    const secondLineOtherCounts: Record<string, number> = {};
    secondLineAgents.forEach((name) => {
      secondLineOtherCounts[name] = requestsList.filter((r) => r.team === '2nd Line Support' && r.agent === name).length;
    });

    const infraOtherCounts: Record<string, number> = {};
    infraAgents.forEach((name) => {
      infraOtherCounts[name] = requestsList.filter((r) => r.team === 'Infrastructure' && r.agent === name).length;
    });

    return {
      unassigned: unassignedCount,
      demoUser: demoUserCount,
      otherAgents: otherCounts,
      secondLineAgents: secondLineOtherCounts,
      infraAgents: infraOtherCounts,
      firstLine: firstLineTotal,
      secondLine: secondLineTotal,
      infra: infraTotal,
      all: allTotal,
    };
  }, [requestsList, currentUserName, firstLineAgents, secondLineAgents, infraAgents]);

  // Checkbox handling
  const allSelected = paginatedRequests.length > 0 && paginatedRequests.every((r) => selectedRequestIds.includes(r.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRequestIds([]);
    } else {
      setSelectedRequestIds(paginatedRequests.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedRequestIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setStatusMessage('Refreshing requests list with live server telemetry...');
    await loadData();
    setIsRefreshing(false);
    setStatusMessage('✓ Requests list updated');
    setTimeout(() => setStatusMessage(null), 2000);
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'SLA', 'Summary', 'Category', 'Priority', 'Status', 'Type', 'Date', 'Agent', 'Team', 'Requester'];
    const rows = filteredRequests.map((r) => [
      r.id,
      `"${r.slaTimeLeft}"`,
      `"${r.summary.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      r.priority,
      r.status,
      r.type,
      r.date,
      `"${r.agent}"`,
      `"${r.team}"`,
      `"${r.requester || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Service_Requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsMoreMenuOpen(false);
    setStatusMessage('✓ Exported to CSV');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleResetFilters = () => {
    setSelectedTeam('1st Line Support');
    setSelectedAgent('All Agents');
    setStatusFilter('Open Requests');
    setSearchTree('');
    setCurrentPage(1);
    setIsMoreMenuOpen(false);
    setStatusMessage('✓ Filters reset to default');
    setTimeout(() => setStatusMessage(null), 2000);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSummary.trim()) return;

    const newId = `000${3650 + requestsList.length}`;
    const newReq: RequestItem = {
      id: newId,
      slaTimeLeft: '-40:01',
      summary: newSummary.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'New',
      type: 'Service Request',
      date: new Date().toLocaleDateString('en-GB'),
      agent: newAgent || (selectedAgent !== 'All Agents' ? selectedAgent : 'Adam Admin'),
      team: newTeam || (selectedTeam !== 'All Teams' ? selectedTeam : '1st Line Support'),
      requester: currentUserName,
      description: newDescription.trim() || 'Service request submitted via Requests workspace.',
    };

    setRequestsList([newReq, ...requestsList]);
    setIsNewRequestModalOpen(false);
    setNewSummary('');
    setNewDescription('');
    setStatusMessage(`✓ Request #${newId} created successfully`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="requests-page-layout">
      {/* Toast notification banner */}
      {statusMessage && (
        <div className="requests-toast-banner" role="status" aria-live="polite">
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ── Global Header Bar ── */}
      <header className="requests-top-header">
        <div className="requests-breadcrumb-group">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="breadcrumb-link text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-cyan-700 bg-transparent border-none cursor-pointer p-0"
          >
            Service Desk
          </button>
          <span className="text-gray-400 text-xs font-bold">/</span>
          <button
            type="button"
            onClick={() => {
              setSelectedTeam('All Teams');
              setSelectedAgent('All Agents');
              setStatusFilter('All');
            }}
            className="breadcrumb-link text-xs font-bold text-gray-900 uppercase tracking-wider bg-transparent border-none cursor-pointer p-0"
            title="Click to view all requests"
          >
            Requests
          </button>
        </div>

        <div className="requests-header-right-actions">
          <GlobalNavbarActions
            onGetStarted={() => setIsGuideOpen(true)}
            onNewTicket={() => setIsNewRequestModalOpen(true)}
            onOpenTicket={(id) => {
              const clean = id.toLowerCase().replace(/^(sr-|req-)/i, '').padStart(7, '0');
              const found = requestsList.find((r) => r.id === id || r.id === clean || r.id.endsWith(clean));
              if (found) setSelectedTicketForModal(found);
            }}
          />
        </div>
      </header>

      {/* ── Two Column Viewport: Team Tree + Main Requests Table ── */}
      <div className="requests-body-container">
        {/* Left Team Tree Sidebar */}
        <aside className={`requests-tree-sidebar ${isTreeCollapsed ? 'collapsed' : ''}`}>
          {/* Tree Search Box */}
          {!isTreeCollapsed && (
            <div className="requests-tree-search-wrapper">
              <input
                type="text"
                placeholder="Search Requests..."
                value={searchTree}
                onChange={(e) => setSearchTree(e.target.value)}
                className="requests-tree-search-input"
              />
              <svg className="tree-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          )}

          {/* Section Header (Halo AI Style) */}
          <div className="requests-tree-header">
            <div className="tree-header-left">
              <div className="tree-group-icon">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.5 3.75A2.25 2.25 0 002.25 6v9a2.25 2.25 0 002.25 2.25h1.5v3.75l4.5-3.75h9.75A2.25 2.25 0 0022.5 15V6a2.25 2.25 0 00-2.25-2.25H4.5z" />
                </svg>
              </div>
              {!isTreeCollapsed && (
                <div className="tree-title-block">
                  <span className="tree-title">Requests by Team</span>
                  <span className="tree-subtitle">
                    {selectedTeam === 'All Teams' ? 'All Teams' : selectedTeam}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="tree-collapse-btn"
              title={isTreeCollapsed ? 'Expand Team Tree' : 'Collapse Team Tree'}
              onClick={() => setIsTreeCollapsed(!isTreeCollapsed)}
            >
              {isTreeCollapsed ? '>>' : '<<'}
            </button>
          </div>

          {/* Tree Hierarchical List */}
          {!isTreeCollapsed && (
            <div className="requests-tree-nodes">
              {/* Group 0: All Requests */}
              <div className="tree-node-group mb-1">
                <div
                  className={`tree-group-title-row ${selectedTeam === 'All Teams' ? 'active-group' : ''}`}
                  onClick={() => {
                    setSelectedTeam('All Teams');
                    setSelectedAgent('All Agents');
                    setStatusFilter('All');
                  }}
                  title="View all service requests"
                >
                  <span className="text-xs">🌐</span>
                  <span className="group-name font-medium ml-1">All Service Requests</span>
                  <span className="group-count-badge cyan-badge">{counts.all}</span>
                </div>
              </div>

              {/* Group 1: 1st Line Support */}
              <div className="tree-node-group">
                <div
                  className={`tree-group-title-row ${selectedTeam === '1st Line Support' && (!selectedAgent || selectedAgent === 'All Agents') ? 'active-group' : ''}`}
                  onClick={() => {
                    setSelectedTeam('1st Line Support');
                    setSelectedAgent('All Agents');
                    setIs1stLineExpanded(!is1stLineExpanded);
                  }}
                  title="Click to view all 1st Line Support tickets or toggle list"
                >
                  <span className="tree-caret">{is1stLineExpanded ? '▾' : '▸'}</span>
                  <span className="group-name font-medium">1st Line Support</span>
                  <span className="group-count-badge cyan-badge">{counts.firstLine}</span>
                </div>

                {is1stLineExpanded && (
                  <div className="tree-sub-items">
                    {/* Unassigned */}
                    <div
                      className={`tree-agent-row ${selectedTeam === '1st Line Support' && selectedAgent === 'Unassigned' ? 'active-agent' : ''}`}
                      onClick={() => {
                        setSelectedTeam('1st Line Support');
                        setSelectedAgent('Unassigned');
                      }}
                    >
                      <span className="agent-icon-silhouette">👤</span>
                      <span className="agent-name">Unassigned</span>
                      <span className="agent-count-badge">{counts.unassigned}</span>
                    </div>

                    {/* Current User (You) */}
                    <div
                      className={`tree-agent-row highlight-demo-user ${selectedTeam === '1st Line Support' && selectedAgent.toLowerCase() === currentUserName.toLowerCase() ? 'active-agent-pill' : ''}`}
                      onClick={() => {
                        setSelectedTeam('1st Line Support');
                        setSelectedAgent(currentUserName);
                      }}
                    >
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="available-pill-tag">Available</span>
                        <span className="agent-name font-bold truncate">{currentUserName} (You)</span>
                        <span className="trophy-badge text-xs">🏆</span>
                      </div>
                      <span className="agent-count-badge cyan-count">{counts.demoUser}</span>
                    </div>

                    {/* Dynamic other 1st Line agents */}
                    {firstLineAgents.map((agentName) => {
                      const initials = agentName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <div
                          key={agentName}
                          className={`tree-agent-row ${selectedTeam === '1st Line Support' && selectedAgent === agentName ? 'active-agent' : ''}`}
                          onClick={() => {
                            setSelectedTeam('1st Line Support');
                            setSelectedAgent(agentName);
                          }}
                        >
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="agent-circle-tag bg-slate-500">{initials}</span>
                            <span className="agent-name truncate">{agentName}</span>
                          </div>
                          <span className="agent-count-badge">{counts.otherAgents[agentName] ?? 0}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Group 2: 2nd Line Support */}
              <div className="tree-node-group">
                <div
                  className={`tree-group-title-row ${selectedTeam === '2nd Line Support' && (!selectedAgent || selectedAgent === 'All Agents') ? 'active-group' : ''}`}
                  onClick={() => {
                    setSelectedTeam('2nd Line Support');
                    setSelectedAgent('All Agents');
                    setIs2ndLineExpanded(!is2ndLineExpanded);
                  }}
                  title="Click to view all 2nd Line tickets or toggle list"
                >
                  <span className="tree-caret">{is2ndLineExpanded ? '▾' : '▸'}</span>
                  <span className="group-name font-medium">2nd Line Support</span>
                  <span className="group-count-badge cyan-badge">{counts.secondLine}</span>
                </div>

                {is2ndLineExpanded && (
                  <div className="tree-sub-items">
                    <div
                      className={`tree-agent-row ${selectedTeam === '2nd Line Support' && selectedAgent === 'Unassigned' ? 'active-agent' : ''}`}
                      onClick={() => {
                        setSelectedTeam('2nd Line Support');
                        setSelectedAgent('Unassigned');
                      }}
                    >
                      <span className="agent-icon-silhouette">👤</span>
                      <span className="agent-name">Unassigned</span>
                      <span className="agent-count-badge">
                        {requestsList.filter((r) => r.team === '2nd Line Support' && r.agent === 'Unassigned').length}
                      </span>
                    </div>

                    {secondLineAgents.map((agentName) => {
                      const initials = agentName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <div
                          key={agentName}
                          className={`tree-agent-row ${selectedTeam === '2nd Line Support' && selectedAgent === agentName ? 'active-agent' : ''}`}
                          onClick={() => {
                            setSelectedTeam('2nd Line Support');
                            setSelectedAgent(agentName);
                          }}
                        >
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="agent-circle-tag bg-cyan-700">{initials}</span>
                            <span className="agent-name truncate">{agentName}</span>
                          </div>
                          <span className="agent-count-badge">{counts.secondLineAgents[agentName] ?? 0}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Group 3: Infrastructure */}
              <div className="tree-node-group">
                <div
                  className={`tree-group-title-row ${selectedTeam === 'Infrastructure' && (!selectedAgent || selectedAgent === 'All Agents') ? 'active-group' : ''}`}
                  onClick={() => {
                    setSelectedTeam('Infrastructure');
                    setSelectedAgent('All Agents');
                    setIsInfraExpanded(!isInfraExpanded);
                  }}
                  title="Click to view all Infrastructure tickets or toggle list"
                >
                  <span className="tree-caret">{isInfraExpanded ? '▾' : '▸'}</span>
                  <span className="group-name font-medium">Infrastructure</span>
                  <span className="group-count-badge cyan-badge">{counts.infra}</span>
                </div>

                {isInfraExpanded && (
                  <div className="tree-sub-items">
                    <div
                      className={`tree-agent-row ${selectedTeam === 'Infrastructure' && selectedAgent === 'Unassigned' ? 'active-agent' : ''}`}
                      onClick={() => {
                        setSelectedTeam('Infrastructure');
                        setSelectedAgent('Unassigned');
                      }}
                    >
                      <span className="agent-icon-silhouette">👤</span>
                      <span className="agent-name">Unassigned</span>
                      <span className="agent-count-badge">
                        {requestsList.filter((r) => r.team === 'Infrastructure' && r.agent === 'Unassigned').length}
                      </span>
                    </div>

                    {infraAgents.map((agentName) => {
                      const initials = agentName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <div
                          key={agentName}
                          className={`tree-agent-row ${selectedTeam === 'Infrastructure' && selectedAgent === agentName ? 'active-agent' : ''}`}
                          onClick={() => {
                            setSelectedTeam('Infrastructure');
                            setSelectedAgent(agentName);
                          }}
                        >
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="agent-circle-tag bg-emerald-700">{initials}</span>
                            <span className="agent-name truncate">{agentName}</span>
                          </div>
                          <span className="agent-count-badge">{counts.infraAgents[agentName] ?? 0}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Group 4: Change Requests link */}
              <div className="tree-node-group mt-3 pt-2.5 border-t border-[#d4887b]">
                <div
                  className="tree-group-title-row cursor-pointer hover:bg-black/5 transition-colors rounded-lg py-1 px-2 flex items-center justify-between"
                  onClick={() => navigate('/change-requests')}
                  title="Go to Change Requests & Active Changes"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">📝</span>
                    <span className="group-name font-bold text-[#3a201a]">Change Requests</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#13273e] text-white">
                    {activeCrCount !== null ? `${activeCrCount} Active` : '1 Active'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Requests Content */}
        <main className="requests-main-viewport">
          {/* Main Table Toolbar */}
          <div className="requests-table-toolbar">
            <div className="toolbar-left-view-selector relative" ref={filterDropdownRef}>
              <button
                type="button"
                className="view-selector-btn"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                aria-expanded={isFilterDropdownOpen}
              >
                <span className="view-title font-bold text-gray-800">
                  {activeCustomView ? activeCustomView.name : statusFilter}
                </span>
                <span className="view-caret">▾</span>
              </button>

              <button
                type="button"
                className="add-view-btn"
                title="Create custom view"
                onClick={() => {
                  setNewViewName('');
                  setNewViewStatus(activeCustomView ? activeCustomView.status : statusFilter);
                  setNewViewTeam(activeCustomView?.team || (selectedTeam !== 'All Teams' ? selectedTeam : 'All Teams'));
                  setNewViewPriority(activeCustomView?.priority || 'All');
                  setIsCreateViewModalOpen(true);
                }}
              >
                +
              </button>

              {isFilterDropdownOpen && (
                <div className="view-dropdown-menu">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Standard Views
                  </div>
                  {(['Open Requests', 'In Progress', 'New', 'All'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`view-dropdown-item ${!activeCustomView && statusFilter === opt ? 'selected' : ''}`}
                      onClick={() => {
                        setActiveCustomView(null);
                        setStatusFilter(opt);
                        setIsFilterDropdownOpen(false);
                      }}
                    >
                      <span>{opt}</span>
                      {!activeCustomView && statusFilter === opt && <span>✓</span>}
                    </button>
                  ))}

                  {customViews.length > 0 && (
                    <>
                      <div className="border-t border-gray-100 my-1 pt-1 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Custom Views
                      </div>
                      {customViews.map((cv) => (
                        <div
                          key={cv.id}
                          className={`view-dropdown-item flex items-center justify-between cursor-pointer ${
                            activeCustomView?.id === cv.id ? 'selected' : ''
                          }`}
                          onClick={() => {
                            setActiveCustomView(cv);
                            setIsFilterDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {activeCustomView?.id === cv.id && <span>✓</span>}
                            <span className="truncate">{cv.name}</span>
                          </div>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-red-500 p-0.5 rounded cursor-pointer border-none bg-transparent ml-2"
                            title="Delete custom view"
                            onClick={(e) => handleDeleteCustomView(e, cv.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="toolbar-right-actions">
              <span className="requests-count-text">
                {filteredRequests.length > 0
                  ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredRequests.length)} of ${filteredRequests.length}`
                  : '0 of 0'}
              </span>

              <div className="pagination-arrows">
                <button
                  type="button"
                  className={`pag-btn ${currentPage <= 1 ? 'disabled' : ''}`}
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous Page"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className={`pag-btn ${currentPage >= totalPages ? 'disabled' : ''}`}
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next Page"
                >
                  &gt;
                </button>
              </div>

              <button
                type="button"
                className="toolbar-refresh-btn"
                title="Refresh Requests"
                onClick={handleRefresh}
              >
                <svg
                  className={`w-3.5 h-3.5 text-[#eb6a47] ${isRefreshing ? 'animate-spin' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>

              {selectedRequestIds.length > 0 && (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  onClick={() => {
                    const firstReq = requestsList.find((r) => r.id === selectedRequestIds[0]);
                    if (firstReq) {
                      navigate(
                        `/change-requests?openCreate=true&fromRequestId=${firstReq.id}&summary=${encodeURIComponent(firstReq.summary)}&category=${encodeURIComponent(firstReq.category)}`
                      );
                    }
                  }}
                  title="Create Change Request from selected Service Request"
                >
                  <span>⚡</span>
                  <span>Create Change ({selectedRequestIds.length})</span>
                </button>
              )}

              <button
                type="button"
                className="requests-create-btn"
                onClick={() => setIsNewRequestModalOpen(true)}
                title="Create New Service Request"
              >
                <span>+</span>
                <span>New</span>
              </button>

              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  className="toolbar-more-btn"
                  title="More actions & export"
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                >
                  ···
                </button>

                {isMoreMenuOpen && (
                  <div className="more-actions-dropdown">
                    <button type="button" className="more-actions-item" onClick={handleExportCsv}>
                      <span>📥</span>
                      <span>Export to CSV ({filteredRequests.length})</span>
                    </button>
                    <button type="button" className="more-actions-item" onClick={handleResetFilters}>
                      <span>🔄</span>
                      <span>Reset All Filters</span>
                    </button>
                    <button
                      type="button"
                      className="more-actions-item"
                      onClick={() => {
                        toggleSelectAll();
                        setIsMoreMenuOpen(false);
                      }}
                    >
                      <span>☑️</span>
                      <span>{allSelected ? 'Deselect All' : 'Select All Page'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="requests-table-card">
            <table className="requests-data-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all requests on this page"
                    />
                  </th>
                  <th className="col-viewing">Viewing</th>
                  <th className="col-id">ID</th>
                  <th className="col-sla">SLA Time Left</th>
                  <th className="col-summary">Summary</th>
                  <th className="col-category">Category</th>
                  <th className="col-priority">Priority</th>
                  <th className="col-status">Status</th>
                  <th className="col-type">Type</th>
                  <th className="col-date">Date</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-2xl">📋</span>
                        <p className="font-semibold text-gray-700">No requests match the current filters.</p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="text-xs text-[#eb6a47] font-bold hover:underline cursor-pointer bg-transparent border-none"
                        >
                          Reset Filters to Show All Requests
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req) => {
                    const isChecked = selectedRequestIds.includes(req.id);
                    return (
                      <tr
                        key={req.id}
                        className={`request-table-row ${isChecked ? 'row-selected' : ''}`}
                        onClick={() => setSelectedTicketForModal(req)}
                        title="Click to view details"
                      >
                        <td className="col-check" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectOne(req.id)}
                            aria-label={`Select request ${req.id}`}
                          />
                        </td>

                        <td className="col-viewing"></td>

                        <td className="col-id font-medium text-gray-700">{req.id}</td>

                        <td className="col-sla">
                          <span
                            className={`sla-red-pill font-bold ${
                              req.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : ''
                            }`}
                          >
                            {req.slaTimeLeft}
                          </span>
                        </td>

                        <td className="col-summary">
                          <span className="request-summary-link font-medium" title={req.summary}>
                            {req.summary}
                          </span>
                        </td>

                        <td className="col-category text-gray-600 truncate max-w-[190px]">{req.category}</td>

                        <td className="col-priority">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`priority-square-dot ${
                                req.priority === 'Critical'
                                  ? 'bg-rose-600'
                                  : req.priority === 'High'
                                  ? 'bg-amber-500'
                                  : req.priority === 'Medium'
                                  ? 'bg-yellow-400'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            <span className="priority-label text-xs text-gray-700">{req.priority}</span>
                          </div>
                        </td>

                        <td className="col-status">
                          <span
                            className={`status-pill ${
                              req.status === 'In Progress'
                                ? 'status-in-progress'
                                : req.status === 'Resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'status-new'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>

                        <td className="col-type text-gray-700 text-xs">{req.type}</td>

                        <td className="col-date text-gray-600 text-xs font-mono">{req.date}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* ── Ticket Detail Modal ── */}
      {selectedTicketForModal && (
        <TicketDetailModal
          ticket={{
            id: selectedTicketForModal.id,
            type: selectedTicketForModal.type,
            summary: selectedTicketForModal.summary,
            agent: selectedTicketForModal.agent,
            priority: selectedTicketForModal.priority,
            status: selectedTicketForModal.status,
            category: selectedTicketForModal.category,
            requester: selectedTicketForModal.requester || currentUserName,
            description: selectedTicketForModal.description || selectedTicketForModal.summary,
            createdAt: `${selectedTicketForModal.date} 4:06 AM`,
          }}
          variant="incident"
          currentUser={currentUserName}
          onClose={() => setSelectedTicketForModal(null)}
          onUpdateTicket={(updated: FullTicket) => {
            setRequestsList((prev) =>
              prev.map((r) =>
                r.id === updated.id
                  ? {
                      ...r,
                      status: (updated.status as any) || r.status,
                      summary: updated.summary || r.summary,
                      agent: updated.agent || r.agent,
                      priority: (updated.priority as any) || r.priority,
                    }
                  : r
              )
            );
            setStatusMessage(`✓ Request #${updated.id} updated`);
            setTimeout(() => setStatusMessage(null), 2500);
          }}
        />
      )}

      {/* ── New Request Modal ── */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-scaleUp">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-cyan-600 to-teal-700 text-white">
              <div className="flex items-center gap-2">
                <span className="text-base">📋</span>
                <h3 className="font-bold text-sm">Create New Service Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewRequestModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs cursor-pointer border-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Request Summary / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="e.g. Request dual monitor setup for trading desk..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#eb6a47]"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#eb6a47]"
                  >
                    <option value="Hardware>Laptop">Hardware &gt; Laptop</option>
                    <option value="Hardware>Monitor">Hardware &gt; Monitor</option>
                    <option value="Software>Operating System">Software &gt; Operating System</option>
                    <option value="Identity & Access>Google Workspace">Identity &amp; Access</option>
                    <option value="Email>Distribution List">Email &gt; Distribution List</option>
                    <option value="Cloud>AWS">Cloud &gt; AWS</option>
                    <option value="Database>Access">Database &gt; Access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#eb6a47]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Assigned Team
                  </label>
                  <select
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#eb6a47]"
                  >
                    <option value="1st Line Support">1st Line Support</option>
                    <option value="2nd Line Support">2nd Line Support</option>
                    <option value="Infrastructure">Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Assigned Agent
                  </label>
                  <select
                    value={newAgent}
                    onChange={(e) => setNewAgent(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#eb6a47]"
                  >
                    <option value="Unassigned">Unassigned</option>
                    <option value="Adam Admin">Adam Admin</option>
                    <option value="Alex Agent">Alex Agent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Detailed Specifications / Justification
                </label>
                <textarea
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide technical requirements, business reason, or preferred delivery bay..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:border-[#eb6a47]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#eb6a47] hover:bg-[#db5936] text-white font-semibold text-xs shadow-sm cursor-pointer"
                >
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Custom View Modal (Halo AI Style) ── */}
      {isCreateViewModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-scaleUp">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-cyan-600 to-teal-700 text-white">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <h3 className="font-bold text-sm">Create Custom View</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateViewModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs cursor-pointer border-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomView} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                  View Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="e.g. Critical Hardware Requests"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#eb6a47]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Status Filter
                </label>
                <select
                  value={newViewStatus}
                  onChange={(e) => setNewViewStatus(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#eb6a47]"
                >
                  <option value="Open Requests">Open Requests</option>
                  <option value="In Progress">In Progress</option>
                  <option value="New">New</option>
                  <option value="All">All</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Team Filter
                </label>
                <select
                  value={newViewTeam}
                  onChange={(e) => setNewViewTeam(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#eb6a47]"
                >
                  <option value="All Teams">All Teams</option>
                  <option value="1st Line Support">1st Line Support</option>
                  <option value="2nd Line Support">2nd Line Support</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Priority Filter
                </label>
                <select
                  value={newViewPriority}
                  onChange={(e) => setNewViewPriority(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#eb6a47]"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateViewModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#eb6a47] hover:bg-[#db5936] text-white font-semibold text-xs shadow-sm cursor-pointer"
                >
                  Save View
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Getting Started Guide Modal ── */}
      {isGuideOpen && (
        <GetStartedGuide
          title="Getting Started with Service Requests"
          subtitle="How requests are raised, triaged and fulfilled"
          onClose={() => setIsGuideOpen(false)}
          primaryActionLabel="Create First Request →"
          onPrimaryAction={() => {
            setIsGuideOpen(false);
            setIsNewRequestModalOpen(true);
          }}
          steps={[
            {
              title: 'Raise a Request',
              body: (
                <>
                  Click <strong>+ New</strong> or <strong>+ New Ticket</strong> to log a service request — a laptop, access to a
                  system, a licence. Pick a category and priority so it routes to the right queue.
                </>
              ),
            },
            {
              title: 'Triage by Team and Agent',
              body: (
                <>
                  Use the left-hand tree to switch between <strong>1st Line</strong>,{' '}
                  <strong>2nd Line</strong> and <strong>Infrastructure</strong>, or pick an individual
                  agent. The status filter narrows to Open, In Progress or New.
                </>
              ),
            },
            {
              title: 'Approve and Fulfil',
              body: (
                <>
                  Requests needing sign-off appear in <strong>Approvals</strong>. Once approved, work the
                  request to completion and it moves to Resolved. Select one and use{' '}
                  <strong>Create Change ({selectedRequestIds.length || 1})</strong> if it needs a controlled change.
                </>
              ),
            },
          ]}
        />
      )}
    </div>
  );
};

export default RequestsPage;
