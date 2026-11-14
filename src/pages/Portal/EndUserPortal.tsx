import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Laptop,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Home,
  BookOpen,
  Plus,
  ThumbsUp,
  X,
  FileText,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';
import { Button } from '../../components/shared/Button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import './EndUserPortal.css';

interface PortalTicket {
  id: string;
  summary: string;
  category: string;
  status: 'Open' | 'In Progress' | 'Awaiting Approval' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
  targetResolution?: string;
  assignedAgent?: string;
}

interface FaqArticle {
  id: string;
  title: string;
  category: string;
  snippet: string;
  readTime: string;
  helpfulCount: number;
  content: string;
}

const DEFAULT_USER_TICKETS: PortalTicket[] = [
  {
    id: 'TK-4001',
    summary: 'Request 32GB RAM Developer Laptop Upgrade for Backend Sprint',
    category: 'Hardware Request',
    status: 'In Progress',
    priority: 'High',
    createdAt: '12/11/2026',
    targetResolution: 'Tomorrow, 5:00 PM',
    assignedAgent: 'Alex Rivera',
  },
  {
    id: 'TK-4002',
    summary: 'VPN 2FA Push notification failure on Mobile Authenticator',
    category: 'Access & Security',
    status: 'Open',
    priority: 'Medium',
    createdAt: '13/11/2026',
    targetResolution: 'Today, 6:00 PM',
    assignedAgent: 'Sarah Jenkins',
  },
  {
    id: 'TK-4003',
    summary: 'JetBrains All Products Pack License Renewal',
    category: 'Software License',
    status: 'Resolved',
    priority: 'Low',
    createdAt: '10/11/2026',
    targetResolution: 'Resolved',
    assignedAgent: 'Alex Rivera',
  },
];

const POPULAR_FAQS: FaqArticle[] = [
  {
    id: 'KB-101',
    title: 'How to Reset Your Corporate Single Sign-On (SSO) Password',
    category: 'Account & Security',
    snippet: 'Follow these 3 quick steps to reset your corporate Active Directory or Google Workspace password self-service.',
    readTime: '2 min read',
    helpfulCount: 342,
    content: '1. Navigate to https://sso.servigen.io/reset\n2. Enter your corporate email and verify 2FA on your authenticator device.\n3. Create a strong password (minimum 12 characters including uppercase, number, and symbol).\n4. Wait 60 seconds for global token synchronization.',
  },
  {
    id: 'KB-102',
    title: 'Connecting to Corporate VPN on macOS and Windows',
    category: 'Network & Connectivity',
    snippet: 'Complete setup guide for GlobalProtect & WireGuard VPN gateways with troubleshooting tips for slow connections.',
    readTime: '4 min read',
    helpfulCount: 289,
    content: 'Ensure you have the latest VPN client installed. Connect to vpn.emea.servigen.io or vpn.us.servigen.io. Enter your corporate username and approve the Duo/Okta push notification.',
  },
  {
    id: 'KB-103',
    title: 'Requesting Adobe Creative Cloud & Developer Software Licenses',
    category: 'Software & Licenses',
    snippet: 'Learn how to request software licenses through the Service Catalog and track manager approval stages.',
    readTime: '3 min read',
    helpfulCount: 198,
    content: 'Software licenses require line manager approval. Open the Services Catalogue tab, select the required tier, and submit your business justification. Turnaround is typically <24 hours.',
  },
  {
    id: 'KB-104',
    title: 'Troubleshooting Outlook & Microsoft Teams Video Audio Lag',
    category: 'Office Applications',
    snippet: 'Quick cache clearing instructions and hardware acceleration toggle to fix video call stutter.',
    readTime: '3 min read',
    helpfulCount: 156,
    content: 'Go to Teams Settings -> General -> Disable GPU hardware acceleration. Restart Teams. Ensure your network bandwidth is at least 5 Mbps symmetrical.',
  },
];

export const EndUserPortal: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTabState] = useState<'home' | 'tickets' | 'kb'>(() => {
    if (tabParam === 'tickets' || tabParam === 'kb') return tabParam;
    return 'home';
  });

  const setActiveTab = (tab: 'home' | 'tickets' | 'kb') => {
    setActiveTabState(tab);
    if (tab === 'home') {
      const next = new URLSearchParams(searchParams);
      next.delete('tab');
      setSearchParams(next, { replace: true });
    } else {
      const next = new URLSearchParams(searchParams);
      next.set('tab', tab);
      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    if (tabParam === 'tickets' || tabParam === 'kb' || tabParam === 'home') {
      setActiveTabState(tabParam as any);
    } else if (!tabParam) {
      setActiveTabState('home');
    }
  }, [tabParam]);
  const [selectedArticle, setSelectedArticle] = useState<FaqArticle | null>(null);
  const [myTickets, setMyTickets] = useState<PortalTicket[]>(DEFAULT_USER_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<PortalTicket | null>(null);

  const isAgentUser = user?.role !== 'End User';

  // New Ticket Quick Form State
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState('General Support');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portalNotice, setPortalNotice] = useState<string | null>(null);

  // Filtered knowledge articles based on search query
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_FAQS;
    const q = searchQuery.toLowerCase();
    return POPULAR_FAQS.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.snippet.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeTicketsCount = useMemo(() => {
    return myTickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length;
  }, [myTickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const newTicket: PortalTicket = {
        id: `TK-${Math.floor(4000 + Math.random() * 900)}`,
        summary: ticketTitle.trim(),
        category: ticketCategory,
        status: 'Open',
        priority: ticketPriority,
        createdAt: new Date().toLocaleDateString('en-GB'),
        targetResolution: 'Within 4 business hours',
        assignedAgent: '1st Line Triage Pool',
      };

      setMyTickets((prev) => [newTicket, ...prev]);
      setShowNewTicketModal(false);
      setTicketTitle('');
      setTicketDescription('');
      setPortalNotice(`Ticket #${newTicket.id} created successfully! Our team will respond shortly.`);
      setTimeout(() => setPortalNotice(null), 5000);
      setActiveTab('tickets');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="portal-canvas">
      {/* Top Banner Notice */}
      {portalNotice && (
        <div className="portal-toast-banner" role="status">
          <span>✓ {portalNotice}</span>
        </div>
      )}

      {/* ── Standard Application Top Header (Shared Architecture) ── */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 min-h-[50px] sticky top-0 z-30">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="hover:text-[#C96F55] transition-colors cursor-pointer"
          >
            Service Desk
          </button>
          <span>/</span>
          <span className="text-gray-900 font-extrabold">Self-Service</span>
        </div>

        <GlobalNavbarActions
          newTicketLabel="Raise IT Ticket"
          onNewTicket={() => setShowNewTicketModal(true)}
          onGetStarted={() => setActiveTab('kb')}
          onOpenTicket={(id) => {
            const found = myTickets.find((t) => t.id === id);
            if (found) setSelectedTicket(found);
          }}
        />
      </header>

      {/* ── Secondary Navigation Row (Below Application Header) ── */}
      <nav className="portal-subnav-bar" aria-label="Self-Service Portal Navigation">
        <div className="portal-subnav-container">
          <div className="portal-subnav-links">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`portal-subnav-item ${activeTab === 'home' ? 'active' : ''}`}
              aria-current={activeTab === 'home' ? 'page' : undefined}
            >
              <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Self-Service Hub</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tickets')}
              className={`portal-subnav-item ${activeTab === 'tickets' ? 'active' : ''}`}
              aria-current={activeTab === 'tickets' ? 'page' : undefined}
            >
              <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>My Support Tickets</span>
              {myTickets.length > 0 && (
                <span className="portal-subnav-badge" aria-label={`${myTickets.length} open tickets`}>
                  {myTickets.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kb')}
              className={`portal-subnav-item ${activeTab === 'kb' ? 'active' : ''}`}
              aria-current={activeTab === 'kb' ? 'page' : undefined}
            >
              <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Knowledge Base &amp; Guides</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Content Viewport (Desktop Max 1240px, Centered) ── */}
      <main className="portal-main-container">
        {/* Support Introduction Section (Warm light surface, no dark navy hero) */}
        <section className="portal-intro-section" aria-label="Support Introduction">
          <h1 className="portal-intro-title">
            How can we help you today?
          </h1>
          <p className="portal-intro-subtitle">
            Find answers, request equipment or software, or track your IT support tickets.
          </p>

          {/* Prominent Capsule Knowledge Search */}
          <div className="portal-search-wrapper">
            <Search className="portal-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge articles, VPN guides, laptop orders, password reset..."
              className="portal-search-input"
              aria-label="Search IT knowledge base and guides"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="portal-search-clear"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Common Topic Shortcuts */}
          <div className="portal-quick-tags">
            <span className="portal-tags-label">Common Topics:</span>
            {['Password Reset', 'Global VPN', 'Developer Laptop', 'Adobe License', 'Teams Audio'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(searchQuery === tag ? '' : tag)}
                className={`portal-tag-pill ${searchQuery === tag ? 'active' : ''}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* TAB 1: Self-Service Hub */}
        {activeTab === 'home' && (
          <div className="portal-hub-flow">
            {/* 3 Balanced Core Quick Action Cards */}
            <section className="portal-actions-grid" aria-label="Core Support Actions">
              {/* Card 1: Services Catalogue */}
              <div
                onClick={() => navigate('/services-catalogue')}
                className="portal-action-card group cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/services-catalogue')}
              >
                <div className="portal-card-top">
                  <div className="portal-card-icon-wrap">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <h3 className="portal-card-title">
                    Request Equipment &amp; Software
                  </h3>
                  <p className="portal-card-desc">
                    Browse standard laptops, monitors, workspace peripherals, Adobe licenses, and cloud subscriptions.
                  </p>
                </div>
                <div className="portal-card-footer">
                  <span className="portal-card-link">
                    Open Service Catalog{' '}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>

              {/* Card 2: Report an Issue */}
              <div
                onClick={() => setShowNewTicketModal(true)}
                className="portal-action-card group cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setShowNewTicketModal(true)}
              >
                <div className="portal-card-top">
                  <div className="portal-card-icon-wrap">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="portal-card-title">
                    Report an Issue or Outage
                  </h3>
                  <p className="portal-card-desc">
                    Experiencing an IT glitch, service disruption, login problem, or hardware fault? Raise an incident.
                  </p>
                </div>
                <div className="portal-card-footer">
                  <span className="portal-card-link">
                    Get Support Help{' '}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>

              {/* Card 3: Track Open Requests */}
              <div
                onClick={() => setActiveTab('tickets')}
                className="portal-action-card group cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveTab('tickets')}
              >
                <div className="portal-card-top">
                  <div className="portal-card-icon-wrap">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="portal-card-title">
                    Track My Open Requests
                  </h3>
                  <p className="portal-card-desc">
                    Check live progress, engineer notes, and estimated resolution times ({activeTicketsCount} active).
                  </p>
                </div>
                <div className="portal-card-footer">
                  <span className="portal-card-link">
                    View My Tickets{' '}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </section>

            {/* Popular Knowledge Base Guides */}
            <section className="portal-section-box" aria-label="Knowledge Base Guides">
              <div className="portal-section-header">
                <div>
                  <h2 className="portal-section-title">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Frequently Asked Questions &amp; Self-Service Fixes</span>
                  </h2>
                  <p className="portal-section-subtitle">
                    Step-by-step resolution guides to solve common IT issues instantly without waiting in queue
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('kb')}
                  className="portal-header-action"
                >
                  View All Guides →
                </button>
              </div>

              <div className="portal-faq-grid">
                {filteredFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    onClick={() => setSelectedArticle(faq)}
                    className="portal-faq-card group"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedArticle(faq)}
                  >
                    <div className="portal-faq-top">
                      <span className="portal-faq-category">{faq.category}</span>
                      <span className="portal-faq-time">{faq.readTime}</span>
                    </div>
                    <h3 className="portal-faq-title">
                      {faq.title}
                    </h3>
                    <p className="portal-faq-snippet">{faq.snippet}</p>
                    <div className="portal-faq-footer">
                      <span className="portal-faq-helpful">
                        <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                        <span>{faq.helpfulCount} found helpful</span>
                      </span>
                      <span className="portal-faq-read-link">
                        Read Guide →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Ticket Snapshot */}
            <section className="portal-section-box" aria-label="Recent Ticket Activity">
              <div className="portal-section-header">
                <div>
                  <h2 className="portal-section-title">Your Recent Activity</h2>
                  <p className="portal-section-subtitle">
                    Live status of tickets and service requests logged under your profile
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('tickets')}
                  className="portal-header-action"
                >
                  See Full List ({myTickets.length}) →
                </button>
              </div>

              <div className="portal-table-container">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th style={{ width: '110px' }}>Ticket ID</th>
                      <th>Summary</th>
                      <th style={{ width: '160px' }}>Category</th>
                      <th style={{ width: '120px' }}>Status</th>
                      <th style={{ width: '160px' }}>Target Resolution</th>
                      <th style={{ width: '140px' }}>Assigned Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTickets.slice(0, 4).map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className="cursor-pointer"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedTicket(t)}
                      >
                        <td className="portal-cell-id">{t.id}</td>
                        <td className="portal-cell-summary">{t.summary}</td>
                        <td className="portal-cell-category">{t.category}</td>
                        <td>
                          <StatusBadge status={t.status} size="sm" />
                        </td>
                        <td className="portal-cell-resolution">{t.targetResolution}</td>
                        <td className="portal-cell-agent">{t.assignedAgent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: My Support Tickets */}
        {activeTab === 'tickets' && (
          <div className="portal-section-box">
            <div className="portal-section-header">
              <div>
                <h2 className="portal-section-title">My Support Tickets</h2>
                <p className="portal-section-subtitle">
                  Complete history of your logged IT requests, incidents, and approvals
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowNewTicketModal(true)}
                icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
              >
                New Request
              </Button>
            </div>

            <div className="portal-table-container">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>Ticket ID</th>
                    <th>Summary</th>
                    <th style={{ width: '150px' }}>Category</th>
                    <th style={{ width: '90px' }}>Priority</th>
                    <th style={{ width: '120px' }}>Status</th>
                    <th style={{ width: '110px' }}>Logged Date</th>
                    <th style={{ width: '160px' }}>Target SLA</th>
                    <th style={{ width: '140px' }}>Assigned Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {myTickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="cursor-pointer"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedTicket(t)}
                    >
                      <td className="portal-cell-id">{t.id}</td>
                      <td className="portal-cell-summary">{t.summary}</td>
                      <td className="portal-cell-category">{t.category}</td>
                      <td>
                        <span
                          className={`portal-priority-badge priority-${t.priority.toLowerCase()}`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={t.status} size="sm" />
                      </td>
                      <td className="portal-cell-date">{t.createdAt}</td>
                      <td className="portal-cell-resolution">{t.targetResolution}</td>
                      <td className="portal-cell-agent">{t.assignedAgent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Knowledge Base & Guides */}
        {activeTab === 'kb' && (
          <div className="portal-section-box">
            <div className="portal-section-header">
              <div>
                <h2 className="portal-section-title">Knowledge Base &amp; IT Help Articles</h2>
                <p className="portal-section-subtitle">
                  Official step-by-step resolution guides authored by engineering ({filteredFaqs.length} articles)
                </p>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="portal-header-action"
                >
                  Clear Search Filter
                </button>
              )}
            </div>

            <div className="portal-faq-grid">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  onClick={() => setSelectedArticle(faq)}
                  className="portal-faq-card group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedArticle(faq)}
                >
                  <div className="portal-faq-top">
                    <span className="portal-faq-category">{faq.category}</span>
                    <span className="portal-faq-time">{faq.readTime}</span>
                  </div>
                  <h3 className="portal-faq-title">
                    {faq.title}
                  </h3>
                  <p className="portal-faq-snippet">{faq.snippet}</p>
                  <div className="portal-faq-footer">
                    <span className="portal-faq-helpful">
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                      <span>{faq.helpfulCount} colleagues found this helpful</span>
                    </span>
                    <span className="portal-faq-read-link">
                      Read Guide →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Article Viewer Modal ── */}
      {selectedArticle && (
        <div className="portal-modal-backdrop" onClick={() => setSelectedArticle(null)}>
          <div className="portal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="portal-modal-header">
              <div>
                <span className="portal-faq-category">{selectedArticle.category}</span>
                <h3 className="portal-modal-title">{selectedArticle.title}</h3>
                <span className="portal-modal-meta">{selectedArticle.readTime} · Last updated November 2026</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="portal-modal-close"
                aria-label="Close guide modal"
              >
                ✕
              </button>
            </div>
            <div className="portal-modal-body">
              <div className="portal-article-content">
                {selectedArticle.content}
              </div>

              {/* Deflection / Helpfulness Feedback */}
              <div className="portal-feedback-box">
                <span className="portal-feedback-prompt">Did this article answer your question?</span>
                <div className="portal-feedback-buttons">
                  <button
                    type="button"
                    onClick={() => {
                      setPortalNotice('Thank you for your feedback! Glad we could help.');
                      setSelectedArticle(null);
                      setTimeout(() => setPortalNotice(null), 4000);
                    }}
                    className="portal-feedback-yes"
                  >
                    ✓ Yes, resolved my issue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedArticle(null);
                      setShowNewTicketModal(true);
                    }}
                    className="portal-feedback-no"
                  >
                    No, I need support help
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Ticket Detail Inspection Modal ── */}
      {selectedTicket && (
        <div className="portal-modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="portal-modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="portal-modal-header">
              <div>
                <span className="portal-modal-tag">{selectedTicket.id}</span>
                <h3 className="portal-modal-title">{selectedTicket.summary}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="portal-modal-close"
                aria-label="Close ticket view modal"
              >
                ✕
              </button>
            </div>
            <div className="portal-modal-body space-y-4">
              <div className="portal-detail-grid">
                <div>
                  <span className="portal-detail-label">Status:</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedTicket.status} size="sm" />
                  </div>
                </div>
                <div>
                  <span className="portal-detail-label">Category:</span>
                  <span className="portal-detail-value">{selectedTicket.category}</span>
                </div>
                <div>
                  <span className="portal-detail-label">Assigned Agent:</span>
                  <span className="portal-detail-value">{selectedTicket.assignedAgent}</span>
                </div>
                <div>
                  <span className="portal-detail-label">Estimated SLA:</span>
                  <span className="portal-detail-value font-mono text-emerald-600">
                    {selectedTicket.targetResolution}
                  </span>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="portal-timeline-section">
                <span className="portal-timeline-title">Ticket Activity &amp; Status Path:</span>
                <div className="portal-timeline">
                  <div className="portal-timeline-item">
                    <span className="portal-timeline-point active" />
                    <div>
                      <span className="portal-timeline-heading">Ticket Logged</span>
                      <span className="portal-timeline-desc">
                        Logged on {selectedTicket.createdAt} by {user?.fullName || user?.firstName || 'Sam User'}
                      </span>
                    </div>
                  </div>
                  <div className="portal-timeline-item">
                    <span className="portal-timeline-point active" />
                    <div>
                      <span className="portal-timeline-heading">Assigned to Engineer</span>
                      <span className="portal-timeline-desc">
                        Triage complete; assigned to {selectedTicket.assignedAgent}
                      </span>
                    </div>
                  </div>
                  {selectedTicket.status === 'Resolved' && (
                    <div className="portal-timeline-item">
                      <span className="portal-timeline-point success" />
                      <div>
                        <span className="portal-timeline-heading text-emerald-600">Resolved ✓</span>
                        <span className="portal-timeline-desc">Resolution verified per SLA standards</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="portal-modal-footer">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTicket(null)}
              >
                Close Ticket View
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Raise New Ticket Modal ── */}
      {showNewTicketModal && (
        <div className="portal-modal-backdrop" onClick={() => setShowNewTicketModal(false)}>
          <div className="portal-modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="portal-modal-header">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-[#FFF9F5] text-[#C96F55] border border-[#ebdcd3] rounded-xl">
                  <Plus className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="portal-modal-title">Raise IT Support Request</h3>
                  <span className="portal-modal-meta">Our triage team will review and respond promptly</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
                className="portal-modal-close"
                aria-label="Close request modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="portal-modal-body space-y-4">
              <div>
                <label className="portal-form-label">Issue Subject / Request Title *</label>
                <input
                  type="text"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="e.g. Cannot connect to corporate VPN after password update"
                  className="portal-form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="portal-form-label">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="portal-form-select"
                  >
                    <option value="General Support">General Support</option>
                    <option value="Hardware Request">Hardware Request</option>
                    <option value="Software License">Software License</option>
                    <option value="Access & Security">Access &amp; Security</option>
                    <option value="Network & VPN">Network &amp; VPN</option>
                  </select>
                </div>

                <div>
                  <label className="portal-form-label">Urgency</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="portal-form-select"
                  >
                    <option value="Low">Low (General Inquiry)</option>
                    <option value="Medium">Medium (Standard Work Impact)</option>
                    <option value="High">High (Work Completely Blocked)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="portal-form-label">Detailed Description *</label>
                <textarea
                  rows={4}
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Please describe symptoms, error messages, and steps already attempted..."
                  className="portal-form-textarea"
                  required
                />
              </div>

              <div className="portal-modal-footer">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewTicketModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || !ticketTitle.trim() || !ticketDescription.trim()}
                  isLoading={isSubmitting}
                >
                  Submit Support Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EndUserPortal;
