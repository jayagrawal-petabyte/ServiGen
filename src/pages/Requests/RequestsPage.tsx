import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { TicketDetailModal, type FullTicket } from '../../components/TicketDetailModal';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { api } from '../../services/apiClient';
import './RequestsPage.css';

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

const INITIAL_REQUESTS: RequestItem[] = [
  {
    id: '0003583',
    slaTimeLeft: '-88:01',
    summary: 'Requesting a temporary staff account for Q4 tax audit',
    category: 'Email>Distribution List>External Access',
    priority: 'Low',
    status: 'In Progress',
    type: 'Service Request',
    date: '20/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Marcus Brody',
    description: 'Contract auditor requires temporary AD credentials with read-only access to Finance share during FY26 Q4 reconciliation.',
  },
  {
    id: '0003581',
    slaTimeLeft: '-40:01',
    summary: 'Requesting a recently promoted senior analyst access to PowerBI executive dashboard',
    category: 'Email>Distribution List>Internal Reports',
    priority: 'Low',
    status: 'In Progress',
    type: 'Service Request',
    date: '28/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Rachel Green',
    description: 'Promoted analyst requires PowerBI Pro license and workspace contributor permissions for Corporate KPI reports.',
  },
  {
    id: '0003502',
    slaTimeLeft: '-64:00',
    summary: 'Requesting a specific linting extension in VS Code for backend node repo',
    category: 'Development Tools>Visual Studio Code',
    priority: 'Low',
    status: 'In Progress',
    type: 'Service Request',
    date: '24/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Devon Vance',
    description: 'Developer requesting ESLint v9 workspace extension whitelisting on managed engineering laptops.',
  },
  {
    id: '0003467',
    slaTimeLeft: '-88:01',
    summary: 'Requesting a new application package for Docker Desktop developer license',
    category: 'Endpoint Management>Software Distribution',
    priority: 'Low',
    status: 'In Progress',
    type: 'Service Request',
    date: '20/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Alex Morgan',
    description: 'Docker Desktop business subscription license assigned to user; needs client push from Intune company portal.',
  },
  {
    id: '0003409',
    slaTimeLeft: '-40:01',
    summary: 'Reimage requested for a desktop workstation following storage drive replacement',
    category: 'Software>Operating System>Windows 11 Enterprise',
    priority: 'Low',
    status: 'In Progress',
    type: 'Service Request',
    date: '28/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Jennifer Cole',
    description: 'Workstation ABC00001 had SSD upgraded; technician requests standard SOE Windows 11 Enterprise re-imaging.',
  },
  {
    id: '0003232',
    slaTimeLeft: '-40:01',
    summary: 'Onboarding five new starters needing standard laptop and monitor bundles',
    category: 'Hardware>Mobile Devices & Bundles',
    priority: 'Medium',
    status: 'In Progress',
    type: 'Service Request',
    date: '28/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'HR Onboarding Hub',
    description: 'Batch equipment request for September consultancy intake: 5x ThinkPad X1 Carbon Gen 11, dual 27-inch monitors, and USB-C docks.',
  },
  {
    id: '0003209',
    slaTimeLeft: '-40:01',
    summary: 'Docking station makes a clicking sound and disconnects external displays',
    category: 'Hardware>Docking Station',
    priority: 'Low',
    status: 'In Progress',
    type: 'Service Request',
    date: '28/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Brian Hayes',
    description: 'CalDigit TS4 dock intermittently drops secondary DisplayPort monitor connection after 30 minutes of continuous use.',
  },
  {
    id: '0003013',
    slaTimeLeft: '-40:01',
    summary: 'Update email display name across Google Workspace & Directory',
    category: 'Identity & Access>Google Workspace',
    priority: 'Medium',
    status: 'New',
    type: 'Service Request',
    date: '28/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Kavita Rao',
    description: 'User legally updated surname; please synchronize primary display name across Google Workspace, Slack, and Zoom.',
  },
  {
    id: '0003012',
    slaTimeLeft: '-40:01',
    summary: 'Request external monitor for workstation B-42',
    category: 'Hardware>Monitor',
    priority: 'High',
    status: 'New',
    type: 'Service Request',
    date: '28/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Rahul Verma',
    description: 'UX designer requesting Dell UltraSharp 27-inch 4K color-accurate monitor for high-fidelity prototyping desk.',
  },
  {
    id: '0003011',
    slaTimeLeft: '-88:01',
    summary: 'Install Adobe Acrobat Pro and license activation',
    category: 'Standard Applications>Adobe Acrobat Pro',
    priority: 'Low',
    status: 'New',
    type: 'Service Request',
    date: '20/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Sarah Jenkins',
    description: 'Legal counsel requires Adobe Acrobat Pro DC enterprise license for PDF redaction and certified digital signatures.',
  },
  {
    id: '0003010',
    slaTimeLeft: '-64:00',
    summary: 'Access request for Finance FY27-Audit shared folder',
    category: 'Account Administration>Shared Drives',
    priority: 'Medium',
    status: 'New',
    type: 'Service Request',
    date: '24/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'David Wallace',
    description: 'Finance supervisor approved NTFS security group membership for FY27 external audit working documents repository.',
  },
  {
    id: '0003009',
    slaTimeLeft: '-40:01',
    summary: 'Request new laptop for new staff onboarding',
    category: 'Hardware>Laptop',
    priority: 'High',
    status: 'New',
    type: 'Service Request',
    date: '28/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Lisa Ray',
    description: 'Standard MacBook Pro 14-inch M3 Pro requested for incoming senior frontend engineer starting next Monday.',
  },
  {
    id: '0003008',
    slaTimeLeft: '-40:01',
    summary: 'Additional 32GB RAM upgrade for CAD engineering workstation',
    category: 'Hardware>Memory & Components',
    priority: 'Low',
    status: 'New',
    type: 'Service Request',
    date: '28/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Martin Lee',
    description: 'Civil engineering user running complex SolidWorks simulations experiencing out-of-memory crash dumps.',
  },
  {
    id: '0003007',
    slaTimeLeft: '-88:01',
    summary: 'Configure SSO integration for newly provisioned Figma organization',
    category: 'Identity & Access>SAML SSO',
    priority: 'Medium',
    status: 'In Progress',
    type: 'Service Request',
    date: '20/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Aisha Khan',
    description: 'Configure Okta SAML 2.0 app integration with SCIM user provisioning for company design organization.',
  },
  {
    id: '0003006',
    slaTimeLeft: '-64:00',
    summary: 'Provision dev sandbox PostgreSQL database with seed datasets',
    category: 'Database Services>PostgreSQL',
    priority: 'Low',
    status: 'In Progress',
    type: 'Service Request',
    date: '24/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Elena Rostova',
    description: 'Isolated test environment AWS RDS PostgreSQL 16 instance required for billing engine upgrade dry run.',
  },
  {
    id: '0003005',
    slaTimeLeft: '-40:01',
    summary: 'Replacement USB-C charging cable for Dell Latitude 7440',
    category: 'Hardware>Peripherals & Cables',
    priority: 'Low',
    status: 'In Progress',
    type: 'Service Request',
    date: '28/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Carlos Ruiz',
    description: 'Existing OEM 65W braided USB-C power delivery cable damaged at connector end; requires storeroom replacement.',
  },
  {
    id: '0003004',
    slaTimeLeft: '-88:01',
    summary: 'Extend guest Wi-Fi voucher for visiting ISO 27001 audit team',
    category: 'Network>Wireless Guest Access',
    priority: 'Low',
    status: 'In Progress',
    type: 'Service Request',
    date: '20/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Security Operations',
    description: 'Audit team on-site for additional 3 business days; extend WPA2 guest portal voucher expiration to Friday 18:00.',
  },
  {
    id: '0003003',
    slaTimeLeft: '-40:01',
    summary: 'Mobile device management profile enrollment for employee iPhone 15',
    category: 'Endpoint Management>MDM Profile',
    priority: 'Low',
    status: 'In Progress',
    type: 'Service Request',
    date: '28/09/2026',
    agent: 'Demo User',
    team: '1st Line Support',
    requester: 'Claire Dunphy',
    description: 'Employee BYOD registration for secure corporate email, Microsoft Authenticator, and Slack MDM containment.',
  },

  // Additional Team Requests (for James Brown, Jennifer Williams, Unassigned, etc.)
  {
    id: '0003601',
    slaTimeLeft: '-12:30',
    summary: 'Request local administrator override for legacy compiler runtime',
    category: 'Endpoint Management>Privilege Access',
    priority: 'Medium',
    status: 'In Progress',
    type: 'Service Request',
    date: '29/09/2026',
    agent: 'James Brown',
    team: '1st Line Support',
  },
  {
    id: '0003602',
    slaTimeLeft: '-24:00',
    summary: 'Replace damaged headset ear cushions for customer service agent',
    category: 'Hardware>Peripherals & Cables',
    priority: 'Low',
    status: 'In Progress',
    type: 'Service Request',
    date: '27/09/2026',
    agent: 'James Brown',
    team: '1st Line Support',
  },
  {
    id: '0003610',
    slaTimeLeft: '-08:15',
    summary: 'Configure secondary email forwarder to regional shared mailbox',
    category: 'Email>Distribution List>Mailbox Rules',
    priority: 'Low',
    status: 'New',
    type: 'Service Request',
    date: '30/09/2026',
    agent: 'Jennifer Williams',
    team: '1st Line Support',
  },
  {
    id: '0003620',
    slaTimeLeft: '-04:00',
    summary: 'Urgent replacement laptop for traveling sales director',
    category: 'Hardware>Laptop',
    priority: 'High',
    status: 'New',
    type: 'Service Request',
    date: '30/09/2026',
    agent: 'Unassigned',
    team: '1st Line Support',
  },
  {
    id: '0003630',
    slaTimeLeft: '-16:45',
    summary: 'VPN split-tunneling exception for developer container cluster',
    category: 'Network>VPN Configuration',
    priority: 'Medium',
    status: 'In Progress',
    type: 'Service Request',
    date: '25/09/2026',
    agent: 'David Chen',
    team: '2nd Line Support',
  },
  {
    id: '0003640',
    slaTimeLeft: '-32:10',
    summary: 'Firewall port opening for third-party payroll API endpoint',
    category: 'Network>Firewall Rules',
    priority: 'High',
    status: 'In Progress',
    type: 'Service Request',
    date: '26/09/2026',
    agent: 'Elena Rostova',
    team: 'Infrastructure',
  },
];

export const RequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Navigation & Hierarchy State
  const [selectedTeam, setSelectedTeam] = useState<string>('1st Line Support');
  const [selectedAgent, setSelectedAgent] = useState<string>('Demo User');
  const [is1stLineExpanded, setIs1stLineExpanded] = useState<boolean>(true);
  const [is2ndLineExpanded, setIs2ndLineExpanded] = useState<boolean>(false);
  const [isInfraExpanded, setIsInfraExpanded] = useState<boolean>(false);
  const [searchTree, setSearchTree] = useState<string>('');

  // Table Data State
  const [requestsList, setRequestsList] = useState<RequestItem[]>(INITIAL_REQUESTS);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<RequestItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open Requests' | 'In Progress' | 'New'>('Open Requests');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadLiveRequests() {
      try {
        const res: any = await api.get('/api/tickets', { params: { ticketType: 'Service Request' } });
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!active) return;
        if (items.length > 0) {
          const mapped: RequestItem[] = items.map((t: any) => ({
            id: String(t.id).padStart(7, '0'),
            slaTimeLeft: t.slaTimeLeft || '-12:00',
            summary: t.summary || t.title || 'Service Request',
            category: t.category || 'General Access',
            priority: (t.priority || 'Medium') as RequestItem['priority'],
            status: (t.status === 'Actioned' || t.status === 'Resolved' ? 'Resolved' : t.status === 'Active' ? 'In Progress' : 'New') as RequestItem['status'],
            type: t.ticketType || 'Service Request',
            date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : 'Today',
            agent: typeof t.assignedAgent === 'string' ? t.assignedAgent : t.assignedAgent?.fullName || 'Support Agent',
            team: t.assignedTeam || '1st Line Support',
            requester: t.requester || 'User',
            description: t.description || t.summary,
          }));
          setRequestsList(mapped);
        }
      } catch (err) {
        console.warn('[RequestsPage] Live service requests fetch error, fallback active:', err);
      }
    }
    void loadLiveRequests();
    return () => {
      active = false;
    };
  }, []);

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

  // Top Drawers & Popovers
  const [showKpiDrawer, setShowKpiDrawer] = useState(false);
  const [showFeedPopover, setShowFeedPopover] = useState(false);
  const [showTimesheetPopover, setShowTimesheetPopover] = useState(false);

  // Filter requests based on selected agent, team, and filter mode
  const filteredRequests = useMemo(() => {
    return requestsList.filter((req) => {
      // Agent filter
      if (selectedAgent && selectedAgent !== 'All Agents') {
        if (req.agent !== selectedAgent) return false;
      } else if (selectedTeam && selectedTeam !== 'All Teams') {
        if (req.team !== selectedTeam) return false;
      }

      // Status filter
      if (statusFilter === 'Open Requests') {
        if (req.status === 'Resolved') return false;
      } else if (statusFilter === 'In Progress') {
        if (req.status !== 'In Progress') return false;
      } else if (statusFilter === 'New') {
        if (req.status !== 'New') return false;
      }

      // Search filter
      if (searchTree.trim()) {
        const query = searchTree.toLowerCase();
        return (
          req.id.toLowerCase().includes(query) ||
          req.summary.toLowerCase().includes(query) ||
          req.category.toLowerCase().includes(query) ||
          req.agent.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [requestsList, selectedAgent, selectedTeam, statusFilter, searchTree]);

  // Counts for Tree Badges
  const counts = useMemo(() => {
    const unassignedCount = requestsList.filter((r) => r.team === '1st Line Support' && r.agent === 'Unassigned').length;
    const demoUserCount = requestsList.filter((r) => r.team === '1st Line Support' && r.agent === 'Demo User').length;
    const jamesBrownCount = requestsList.filter((r) => r.team === '1st Line Support' && r.agent === 'James Brown').length;
    const jenniferCount = requestsList.filter((r) => r.team === '1st Line Support' && r.agent === 'Jennifer Williams').length;
    const firstLineTotal = unassignedCount + demoUserCount + jamesBrownCount + jenniferCount;
    const secondLineTotal = requestsList.filter((r) => r.team === '2nd Line Support').length;
    const infraTotal = requestsList.filter((r) => r.team === 'Infrastructure').length;

    return {
      unassigned: unassignedCount || 12,
      demoUser: demoUserCount || 18,
      jamesBrown: jamesBrownCount || 20,
      jennifer: jenniferCount || 7,
      firstLine: firstLineTotal || 57,
      secondLine: secondLineTotal || 16,
      infra: infraTotal || 11,
    };
  }, [requestsList]);

  // Checkbox handling
  const allSelected = filteredRequests.length > 0 && filteredRequests.every((r) => selectedRequestIds.includes(r.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRequestIds([]);
    } else {
      setSelectedRequestIds(filteredRequests.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedRequestIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setStatusMessage('Refreshing requests list with live server telemetry...');
    setTimeout(() => {
      setIsRefreshing(false);
      setStatusMessage('✓ Requests list updated');
      setTimeout(() => setStatusMessage(null), 2000);
    }, 800);
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
      agent: selectedAgent || 'Demo User',
      team: selectedTeam || '1st Line Support',
      requester: user?.fullName || 'Inesh Agarwal',
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
        <div className="requests-toast-banner">
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ── Global Header Bar matching Image 2 ── */}
      <header className="requests-top-header">
        <div className="requests-breadcrumb-group">
          <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg mr-2 text-xs">
            <button
              type="button"
              className="px-2.5 py-1 rounded-md font-bold bg-white text-slate-900 shadow-2xs cursor-default flex items-center gap-1"
            >
              <span>📋</span>
              <span>Requests</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/change-requests')}
              className="px-2.5 py-1 rounded-md font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
              title="Switch to Change Requests queue"
            >
              <span>📝</span>
              <span>Change Requests</span>
            </button>
          </div>

          <span className="breadcrumb-link" onClick={() => { setSelectedTeam('All Teams'); setSelectedAgent('All Agents'); }}>
            Requests
          </span>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-link" onClick={() => setSelectedAgent('All Agents')}>
            {selectedTeam}
          </span>
          {selectedAgent && selectedAgent !== 'All Agents' && (
            <>
              <span className="breadcrumb-sep">&gt;</span>
              <span className="breadcrumb-current font-bold text-gray-800">
                {selectedAgent === 'Demo User' ? 'Demo User' : selectedAgent}
              </span>
            </>
          )}
        </div>

        <div className="requests-header-right-actions">
          <GlobalNavbarActions
            onGetStarted={() => {
              setStatusMessage('Onboarding tour initiated for Requests workspace');
              setTimeout(() => setStatusMessage(null), 2500);
            }}
            onNewTicket={() => setIsNewRequestModalOpen(true)}
            onOpenTicket={(id) => {
              const found = requestsList.find((r) => r.id === id);
              if (found) setSelectedTicketForModal(found);
            }}
          />
        </div>
      </header>

      {/* ── Two Column Viewport: Team Tree + Main Requests Table ── */}
      <div className="requests-body-container">
        {/* Left Team Tree Sidebar */}
        <aside className="requests-tree-sidebar">
          {/* Tree Search Box */}
          <div className="requests-tree-search-wrapper">
            <input
              type="text"
              placeholder="Search Requests..."
              value={searchTree}
              onChange={(e) => setSearchTree(e.target.value)}
              className="requests-tree-search-input"
            />
            <svg className="tree-search-icon" viewBox="0 0 24 24" fill="none" stroke="#00bcd4" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>

          {/* Section Header */}
          <div className="requests-tree-header">
            <div className="tree-header-left">
              <div className="tree-group-icon">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.5 3.75A2.25 2.25 0 002.25 6v9a2.25 2.25 0 002.25 2.25h1.5v3.75l4.5-3.75h9.75A2.25 2.25 0 0022.5 15V6a2.25 2.25 0 00-2.25-2.25H4.5z" />
                </svg>
              </div>
              <div className="tree-title-block">
                <span className="tree-title">Requests by Team</span>
                <span className="tree-subtitle">▾ Open Requests</span>
              </div>
            </div>
            <button
              type="button"
              className="tree-collapse-btn"
              title="Collapse Team Tree"
              onClick={() => {
                setStatusMessage('Team tree layout toggled');
                setTimeout(() => setStatusMessage(null), 1500);
              }}
            >
              &lt;&lt;
            </button>
          </div>

          {/* Tree Hierarchical List matching Image 2 */}
          <div className="requests-tree-nodes">
            {/* Group 1: 1st Line Support */}
            <div className="tree-node-group">
              <div
                className={`tree-group-title-row ${selectedTeam === '1st Line Support' && (!selectedAgent || selectedAgent === 'All Agents') ? 'active-group' : ''}`}
                onClick={() => {
                  setSelectedTeam('1st Line Support');
                  setSelectedAgent('All Agents');
                  setIs1stLineExpanded(!is1stLineExpanded);
                }}
              >
                <span className="tree-caret">{is1stLineExpanded ? '▾' : '▸'}</span>
                <span className="group-name font-medium">1st Line Support</span>
                <span className="group-count-badge cyan-badge">{counts.firstLine}</span>
              </div>

              {is1stLineExpanded && (
                <div className="tree-sub-items">
                  {/* Unassigned */}
                  <div
                    className={`tree-agent-row ${selectedAgent === 'Unassigned' ? 'active-agent' : ''}`}
                    onClick={() => {
                      setSelectedTeam('1st Line Support');
                      setSelectedAgent('Unassigned');
                    }}
                  >
                    <span className="agent-icon-silhouette">👤</span>
                    <span className="agent-name">Unassigned</span>
                    <span className="agent-count-badge">{counts.unassigned}</span>
                  </div>

                  {/* Demo User (You) */}
                  <div
                    className={`tree-agent-row highlight-demo-user ${selectedAgent === 'Demo User' ? 'active-agent-pill' : ''}`}
                    onClick={() => {
                      setSelectedTeam('1st Line Support');
                      setSelectedAgent('Demo User');
                    }}
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="available-pill-tag">Available</span>
                      <span className="agent-name font-bold truncate">Demo User (You)</span>
                      <span className="trophy-badge text-xs">🏆</span>
                    </div>
                    <span className="agent-count-badge cyan-count">{counts.demoUser}</span>
                  </div>

                  {/* James Brown */}
                  <div
                    className={`tree-agent-row ${selectedAgent === 'James Brown' ? 'active-agent' : ''}`}
                    onClick={() => {
                      setSelectedTeam('1st Line Support');
                      setSelectedAgent('James Brown');
                    }}
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="offline-pill-tag">Offline</span>
                      <span className="agent-circle-tag bg-amber-500">JB</span>
                      <span className="agent-name truncate">James Brown</span>
                    </div>
                    <span className="agent-count-badge">{counts.jamesBrown}</span>
                  </div>

                  {/* Jennifer Williams */}
                  <div
                    className={`tree-agent-row ${selectedAgent === 'Jennifer Williams' ? 'active-agent' : ''}`}
                    onClick={() => {
                      setSelectedTeam('1st Line Support');
                      setSelectedAgent('Jennifer Williams');
                    }}
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="agent-circle-tag bg-purple-600">JW</span>
                      <span className="agent-name truncate">Jennifer Williams</span>
                    </div>
                    <span className="agent-count-badge">{counts.jennifer}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Group 2: 2nd Line Support */}
            <div className="tree-node-group">
              <div
                className={`tree-group-title-row ${selectedTeam === '2nd Line Support' ? 'active-group' : ''}`}
                onClick={() => {
                  setSelectedTeam('2nd Line Support');
                  setSelectedAgent('All Agents');
                  setIs2ndLineExpanded(!is2ndLineExpanded);
                }}
              >
                <span className="tree-caret">{is2ndLineExpanded ? '▾' : '▸'}</span>
                <span className="group-name font-medium">2nd Line Support</span>
                <span className="group-count-badge cyan-badge">{counts.secondLine}</span>
              </div>
            </div>

            {/* Group 3: Infrastructure */}
            <div className="tree-node-group">
              <div
                className={`tree-group-title-row ${selectedTeam === 'Infrastructure' ? 'active-group' : ''}`}
                onClick={() => {
                  setSelectedTeam('Infrastructure');
                  setSelectedAgent('All Agents');
                  setIsInfraExpanded(!isInfraExpanded);
                }}
              >
                <span className="tree-caret">{isInfraExpanded ? '▾' : '▸'}</span>
                <span className="group-name font-medium">Infrastructure</span>
                <span className="group-count-badge cyan-badge">{counts.infra}</span>
              </div>
            </div>

            {/* Group 4: Change Requests & Active Changes */}
            <div className="tree-node-group mt-3 pt-2.5 border-t border-slate-200">
              <div
                className="tree-group-title-row cursor-pointer hover:bg-orange-50 transition-colors rounded-lg py-1 px-2 flex items-center justify-between"
                onClick={() => navigate('/change-requests')}
                title="Go to Change Requests & Active Changes"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">📝</span>
                  <span className="group-name font-bold text-slate-800">Change Requests</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-700">5 Active</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Requests Content */}
        <main className="requests-main-viewport">
          {/* Main Table Toolbar */}
          <div className="requests-table-toolbar">
            <div className="toolbar-left-view-selector relative">
              <button
                type="button"
                className="view-selector-btn"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              >
                <span className="view-title font-bold text-gray-800">{statusFilter}</span>
                <span className="view-caret">▾</span>
              </button>

              <button
                type="button"
                className="add-view-btn"
                title="Create New Saved View"
                onClick={() => {
                  setStatusMessage('Custom view saved to quick views');
                  setTimeout(() => setStatusMessage(null), 2000);
                }}
              >
                +
              </button>

              {isFilterDropdownOpen && (
                <div className="view-dropdown-menu">
                  {(['Open Requests', 'In Progress', 'New', 'All'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`view-dropdown-item ${statusFilter === opt ? 'selected' : ''}`}
                      onClick={() => {
                        setStatusFilter(opt);
                        setIsFilterDropdownOpen(false);
                      }}
                    >
                      <span>{opt}</span>
                      {statusFilter === opt && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="toolbar-right-actions">
              <span className="requests-count-text">
                {filteredRequests.length > 0 ? `1-${filteredRequests.length} of ${filteredRequests.length}` : '0 of 0'}
              </span>

              <div className="pagination-arrows">
                <button type="button" className="pag-btn disabled" disabled>
                  &lt;
                </button>
                <button type="button" className="pag-btn disabled" disabled>
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
                  className={`w-3.5 h-3.5 text-[#00bcd4] ${isRefreshing ? 'animate-spin' : ''}`}
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
                      navigate(`/change-requests?openCreate=true&fromRequestId=${firstReq.id}&summary=${encodeURIComponent(firstReq.summary)}&category=${encodeURIComponent(firstReq.category)}`);
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
              >
                <span>+</span>
                <span>New</span>
              </button>

              <button
                type="button"
                className="toolbar-more-btn"
                title="Export or bulk actions"
                onClick={() => {
                  setStatusMessage('Bulk export / view options displayed');
                  setTimeout(() => setStatusMessage(null), 2000);
                }}
              >
                ···
              </button>
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
                      aria-label="Select all requests"
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
                {filteredRequests.map((req) => {
                  const isChecked = selectedRequestIds.includes(req.id);
                  return (
                    <tr
                      key={req.id}
                      className={`request-table-row ${isChecked ? 'row-selected' : ''}`}
                      onClick={() => setSelectedTicketForModal(req)}
                    >
                      <td className="col-check" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(req.id)}
                          aria-label={`Select request ${req.id}`}
                        />
                      </td>

                      <td className="col-viewing">
                        {req.agent === 'Demo User' && (
                          <div className="viewing-avatar-dot" title="Viewing by Demo User">
                            <span>DU</span>
                          </div>
                        )}
                      </td>

                      <td className="col-id font-medium text-gray-700">
                        {req.id}
                      </td>

                      <td className="col-sla">
                        <span className="sla-red-pill font-bold">{req.slaTimeLeft}</span>
                      </td>

                      <td className="col-summary">
                        <span
                          className="request-summary-link font-medium"
                          title={req.summary}
                        >
                          {req.summary}
                        </span>
                      </td>

                      <td className="col-category text-gray-600 truncate max-w-[190px]">
                        {req.category}
                      </td>

                      <td className="col-priority">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`priority-square-dot ${
                              req.priority === 'High'
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
                            req.status === 'In Progress' ? 'status-in-progress' : 'status-new'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="col-type text-gray-700 text-xs">{req.type}</td>

                      <td className="col-date text-gray-600 text-xs font-mono">{req.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* ── Ticket Detail Modal matching Incident Modal Layout (Image 2) ── */}
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
            requester: selectedTicketForModal.requester || 'Marcus Brody',
            description: selectedTicketForModal.description || selectedTicketForModal.summary,
            createdAt: `${selectedTicketForModal.date} 4:06 AM`,
          }}
          variant="incident"
          currentUser={user?.fullName || 'Inesh Agarwal'}
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
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs cursor-pointer"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Hardware>Laptop">Hardware &gt; Laptop</option>
                    <option value="Hardware>Monitor">Hardware &gt; Monitor</option>
                    <option value="Software>Operating System">Software &gt; Operating System</option>
                    <option value="Identity & Access>Google Workspace">Identity &amp; Access</option>
                    <option value="Email>Distribution List">Email &gt; Distribution List</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Assigned Team & Agent
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    disabled
                    value={selectedTeam}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600"
                  />
                  <input
                    type="text"
                    disabled
                    value={selectedAgent === 'All Agents' ? 'Unassigned' : selectedAgent}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600"
                  />
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
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:border-cyan-500"
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
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
                >
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsPage;
