import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Laptop,
  HelpCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';
import { api } from '../../services/apiClient';
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
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'tickets' | 'kb'>('home');
  const [selectedArticle, setSelectedArticle] = useState<FaqArticle | null>(null);
  const [myTickets, setMyTickets] = useState<PortalTicket[]>(DEFAULT_USER_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<PortalTicket | null>(null);

  // New Ticket Quick Form State
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState('General Support');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portalNotice, setPortalNotice] = useState<string | null>(null);

  // Filtered knowledge articles
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
        <div className="portal-toast-banner">
          ✓ {portalNotice}
        </div>
      )}

      {/* Hero Header */}
      <section className="portal-hero">
        <div className="portal-hero-container">
          <div className="portal-user-badge">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>IT Self-Service Portal · Logged in as <strong>{user?.fullName || user?.firstName || 'Sam User'}</strong></span>
          </div>

          <h1 className="portal-hero-title">
            How can IT Support help you today?
          </h1>
          <p className="portal-hero-subtitle">
            Search our knowledge base for instant answers, request new hardware and software, or track your existing support tickets.
          </p>

          {/* Unified Search Input */}
          <div className="portal-search-wrapper">
            <Search className="portal-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge articles, VPN guides, laptop orders, password reset..."
              className="portal-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="portal-search-clear">
                ✕
              </button>
            )}
          </div>

          {/* Quick Category Suggestions */}
          <div className="portal-quick-tags">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Common Topics:</span>
            {['Password Reset', 'Global VPN', 'Developer Laptop', 'Adobe License', 'Teams Audio'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className="portal-tag-pill"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="portal-nav-bar">
        <div className="portal-nav-container">
          <div className="portal-tabs">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`portal-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
            >
              <span>🏠 Self-Service Hub</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tickets')}
              className={`portal-tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            >
              <span>🎫 My Support Tickets</span>
              <span className="portal-count-badge">{myTickets.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('kb')}
              className={`portal-tab-btn ${activeTab === 'kb' ? 'active' : ''}`}
            >
              <span>📚 Knowledge Base &amp; Guides</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNewTicketModal(true)}
              className="portal-new-ticket-btn"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise IT Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="portal-main-container">
        {/* TAB 1: Home Hub */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* 3 Core Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Services Catalogue */}
              <div
                onClick={() => navigate('/services-catalogue')}
                className="portal-action-card group cursor-pointer"
              >
                <div className="portal-card-icon-wrap bg-orange-100 text-[#eb6a47] group-hover:scale-110 transition-transform">
                  <Laptop className="w-6 h-6" />
                </div>
                <h3 className="portal-card-title group-hover:text-[#eb6a47] transition-colors">
                  Request Equipment &amp; Software
                </h3>
                <p className="portal-card-desc">
                  Browse standard laptops, monitors, accessories, Adobe licenses, and cloud IDE subscriptions.
                </p>
                <div className="portal-card-footer">
                  <span className="text-xs font-bold text-[#eb6a47] flex items-center gap-1">
                    Open Service Catalog <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>

              {/* Card 2: Report an Incident */}
              <div
                onClick={() => setShowNewTicketModal(true)}
                className="portal-action-card group cursor-pointer"
              >
                <div className="portal-card-icon-wrap bg-rose-100 text-rose-600 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="portal-card-title group-hover:text-rose-600 transition-colors">
                  Report an Issue or Outage
                </h3>
                <p className="portal-card-desc">
                  Experiencing an IT glitch, login failure, or hardware fault? Raise an incident ticket with our support engineers.
                </p>
                <div className="portal-card-footer">
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                    Get Support Help <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>

              {/* Card 3: Track Existing Tickets */}
              <div
                onClick={() => setActiveTab('tickets')}
                className="portal-action-card group cursor-pointer"
              >
                <div className="portal-card-icon-wrap bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="portal-card-title group-hover:text-blue-600 transition-colors">
                  Track My Open Requests
                </h3>
                <p className="portal-card-desc">
                  Check live progress, engineer notes, and estimated resolution times for your active tickets ({myTickets.filter(t => t.status !== 'Resolved').length} active).
                </p>
                <div className="portal-card-footer">
                  <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                    View My Tickets <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>

            {/* Popular Knowledge Base Guides */}
            <div className="portal-section-box">
              <div className="portal-section-header">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Frequently Asked Questions &amp; Self-Service Fixes</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Solve common issues instantly without waiting in queue</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('kb')}
                  className="text-xs font-bold text-[#eb6a47] hover:underline"
                >
                  View All Guides →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {filteredFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    onClick={() => setSelectedArticle(faq)}
                    className="portal-faq-card group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="portal-faq-category">{faq.category}</span>
                      <span className="portal-faq-time">{faq.readTime}</span>
                    </div>
                    <h4 className="portal-faq-title group-hover:text-[#eb6a47] transition-colors">
                      {faq.title}
                    </h4>
                    <p className="portal-faq-snippet">{faq.snippet}</p>
                    <div className="portal-faq-helpful">
                      <span>👍 {faq.helpfulCount} colleagues found this helpful</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Ticket Snapshot */}
            <div className="portal-section-box">
              <div className="portal-section-header">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Your Recent Activity</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Summary of tickets logged under your corporate profile</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('tickets')}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  See Full List ({myTickets.length}) →
                </button>
              </div>

              <div className="portal-tickets-table-wrapper mt-4">
                <table className="portal-tickets-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Summary</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Target Resolution</th>
                      <th>Assigned Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTickets.slice(0, 3).map((t) => (
                      <tr key={t.id} onClick={() => setSelectedTicket(t)} className="cursor-pointer">
                        <td className="font-bold text-[#eb6a47]">{t.id}</td>
                        <td className="font-medium text-slate-800">{t.summary}</td>
                        <td className="text-xs text-slate-600">{t.category}</td>
                        <td>
                          <span className={`portal-status-pill status-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="text-xs text-slate-500">{t.targetResolution}</td>
                        <td className="text-xs text-slate-700">{t.assignedAgent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: My Support Tickets */}
        {activeTab === 'tickets' && (
          <div className="portal-section-box">
            <div className="portal-section-header">
              <div>
                <h2 className="text-base font-bold text-slate-900">My Support Tickets</h2>
                <p className="text-xs text-slate-500 mt-0.5">Complete history of IT requests, incidents, and approvals</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTicketModal(true)}
                className="portal-new-ticket-btn"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ New Request</span>
              </button>
            </div>

            <div className="portal-tickets-table-wrapper mt-4">
              <table className="portal-tickets-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Summary</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Logged Date</th>
                    <th>Target SLA</th>
                    <th>Assigned Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {myTickets.map((t) => (
                    <tr key={t.id} onClick={() => setSelectedTicket(t)} className="cursor-pointer">
                      <td className="font-bold text-[#eb6a47]">{t.id}</td>
                      <td className="font-semibold text-slate-800">{t.summary}</td>
                      <td className="text-xs text-slate-600">{t.category}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          t.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`portal-status-pill status-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">{t.createdAt}</td>
                      <td className="text-xs font-mono text-slate-600">{t.targetResolution}</td>
                      <td className="text-xs text-slate-700 font-medium">{t.assignedAgent}</td>
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
                <h2 className="text-base font-bold text-slate-900">Knowledge Base &amp; IT Help Articles</h2>
                <p className="text-xs text-slate-500 mt-0.5">Official step-by-step resolution guides authored by engineering</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  onClick={() => setSelectedArticle(faq)}
                  className="portal-faq-card group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="portal-faq-category">{faq.category}</span>
                    <span className="portal-faq-time">{faq.readTime}</span>
                  </div>
                  <h4 className="portal-faq-title group-hover:text-[#eb6a47] transition-colors">
                    {faq.title}
                  </h4>
                  <p className="portal-faq-snippet">{faq.snippet}</p>
                  <div className="portal-faq-helpful">
                    <span>👍 {faq.helpfulCount} colleagues found this helpful</span>
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
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedArticle.title}</h3>
                <span className="text-xs text-slate-400">{selectedArticle.readTime} · Last updated Oct 2026</span>
              </div>
              <button onClick={() => setSelectedArticle(null)} className="portal-modal-close">✕</button>
            </div>
            <div className="portal-modal-body">
              <div className="whitespace-pre-line text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {selectedArticle.content}
              </div>

              {/* Deflection Feedback */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Did this article answer your question?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPortalNotice('Thank you for your feedback! Glad we could help.');
                      setSelectedArticle(null);
                      setTimeout(() => setPortalNotice(null), 4000);
                    }}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                  >
                    ✓ Yes, it resolved my issue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedArticle(null);
                      setShowNewTicketModal(true);
                    }}
                    className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
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
                <span className="text-xs font-mono font-bold text-[#eb6a47]">{selectedTicket.id}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedTicket.summary}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="portal-modal-close">✕</button>
            </div>
            <div className="portal-modal-body space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Status:</span>
                  <span className="font-bold text-slate-800">{selectedTicket.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Category:</span>
                  <span className="font-bold text-slate-800">{selectedTicket.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Agent:</span>
                  <span className="font-bold text-slate-800">{selectedTicket.assignedAgent}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Estimated Resolution:</span>
                  <span className="font-bold text-emerald-600">{selectedTicket.targetResolution}</span>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Ticket Activity &amp; Status Path:</span>
                <div className="border-l-2 border-orange-300 pl-3 space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Ticket Created</span>
                    <span className="text-[11px] text-slate-400">Logged on {selectedTicket.createdAt} by {user?.fullName || user?.firstName || 'Sam User'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">Assigned to Engineer</span>
                    <span className="text-[11px] text-slate-400">Triage complete; assigned to {selectedTicket.assignedAgent}</span>
                  </div>
                  {selectedTicket.status === 'Resolved' && (
                    <div>
                      <span className="font-bold text-emerald-600 block">Resolved ✓</span>
                      <span className="text-[11px] text-slate-400">Resolution verified per SLA standards</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="portal-modal-footer">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Close Ticket View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Raise New Ticket Modal ── */}
      {showNewTicketModal && (
        <div className="portal-modal-backdrop" onClick={() => setShowNewTicketModal(false)}>
          <div className="portal-modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="portal-modal-header">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-100 text-[#eb6a47] rounded-lg">
                  <PlusCircle className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">Raise IT Support Request</h3>
              </div>
              <button onClick={() => setShowNewTicketModal(false)} className="portal-modal-close">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="portal-modal-body space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Subject / Request Title *</label>
                <input
                  type="text"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="e.g. Cannot connect to corporate VPN after password update"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#eb6a47] font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#eb6a47]"
                  >
                    <option value="General Support">General Support</option>
                    <option value="Hardware Request">Hardware Request</option>
                    <option value="Software License">Software License</option>
                    <option value="Access & Security">Access &amp; Security</option>
                    <option value="Network & VPN">Network &amp; VPN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Urgency</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#eb6a47]"
                  >
                    <option value="Low">Low (General Inquiry)</option>
                    <option value="Medium">Medium (Standard Work Impact)</option>
                    <option value="High">High (Work Completely Blocked)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Please describe the symptoms, error messages, and steps already tried..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#eb6a47] text-slate-800"
                  required
                />
              </div>

              <div className="portal-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !ticketTitle.trim() || !ticketDescription.trim()}
                  className="px-5 py-2 bg-[#eb6a47] hover:bg-[#db5936] disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Support Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EndUserPortal;
