import React, { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Building2,
  Users,
  Ticket,
  Globe,
  MapPin,
  ShieldCheck,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';
import { SlaBadge } from '../../components/shared/SlaBadge';
import { MOCK_TICKETS, MOCK_USERS } from '../../services/fallback/mockData';
import type { OrganisationItem } from './OrganisationsScreen';

export interface OrganisationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  organisation: OrganisationItem | null;
  initialTab?: 'tickets' | 'contacts' | 'overview';
  onSelectTicket?: (ticket: any) => void;
}

export const OrganisationDetailModal: React.FC<OrganisationDetailModalProps> = ({
  isOpen,
  onClose,
  organisation,
  initialTab = 'tickets',
  onSelectTicket,
}) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'contacts' | 'overview'>(initialTab);
  const [ticketFilter, setTicketFilter] = useState<string>('ALL');

  // Reset active tab whenever the modal opens or organisation changes
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setTicketFilter('ALL');
    }
  }, [isOpen, initialTab, organisation?.id]);

  // Resolve contacts for this organisation
  const orgContacts = useMemo(() => {
    if (!organisation) return [];
    // 1. Check matching mock users
    const matched = MOCK_USERS.filter(
      (u) =>
        u.defaultOrganisation?.toLowerCase() === organisation.name.toLowerCase() ||
        (u as any).organisationId?.toLowerCase() === organisation.id.toLowerCase()
    );

    if (matched.length > 0) return matched;

    // 2. Generate contextual contacts based on organisation details
    const domain = organisation.domain || 'org.com';
    const mockList = [
      {
        id: `${organisation.id}-U01`,
        fullName: 'Alex Rivera',
        email: `alex.rivera@${domain}`,
        phone: '+1 (555) 234-5678',
        role: 'Administrator',
        defaultSite: organisation.primarySite,
        status: 'Active',
        department: 'Executive IT & Operations',
      },
      {
        id: `${organisation.id}-U02`,
        fullName: 'Sarah Jenkins',
        email: `sarah.j@${domain}`,
        phone: '+1 (555) 345-6789',
        role: 'Team Lead',
        defaultSite: organisation.primarySite,
        status: 'Active',
        department: 'Infrastructure & DevOps',
      },
      {
        id: `${organisation.id}-U03`,
        fullName: 'Marcus Vance',
        email: `marcus.v@${domain}`,
        phone: '+1 (555) 456-7890',
        role: 'Support Agent',
        defaultSite: organisation.primarySite,
        status: 'Active',
        department: 'Service Desk Operations',
      },
      {
        id: `${organisation.id}-U04`,
        fullName: 'David Kim',
        email: `david.kim@${domain}`,
        phone: '+1 (555) 567-8901',
        role: 'End User',
        defaultSite: organisation.primarySite,
        status: 'Active',
        department: 'Engineering & Delivery',
      },
      {
        id: `${organisation.id}-U05`,
        fullName: 'Priya Nair',
        email: `priya.nair@${domain}`,
        phone: '+1 (555) 678-9012',
        role: 'End User',
        defaultSite: organisation.primarySite,
        status: 'Active',
        department: 'Product Management',
      },
    ];

    return mockList.slice(0, Math.max(organisation.contactCount, 2));
  }, [organisation]);

  // Resolve tickets for this organisation
  const orgTickets = useMemo(() => {
    if (!organisation) return [];
    // Check if tickets match by organisation name
    const matched = MOCK_TICKETS.filter(
      (t) =>
        t.organisation?.toLowerCase() === organisation.name.toLowerCase() ||
        (t as any).organisationId?.toLowerCase() === organisation.id.toLowerCase()
    );

    if (matched.length > 0) return matched;

    // Contextual fallback tickets for organisation
    const baseTickets = [
      {
        id: `INC-${organisation.id.replace('ORG-', '2024-')}`,
        ticketType: 'Incident',
        summary: `VPN Gateway latency affecting remote office network at ${organisation.primarySite}`,
        priority: 'Critical',
        status: 'Active',
        organisation: organisation.name,
        category: 'Network & Connectivity',
        assignedTeam: '1st Line Support',
        assignedAgent: { fullName: 'Alex Rivera' },
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        slaTimeLeft: -45,
        slaFormatted: '-00:45 (Breached)',
      },
      {
        id: `REQ-${organisation.id.replace('ORG-', '2024-0')}`,
        ticketType: 'Service Request',
        summary: `Enterprise workstation & MFA token provisioning for engineering hire`,
        priority: 'High',
        status: 'Active',
        organisation: organisation.name,
        category: 'Hardware>Laptop',
        assignedTeam: '1st Line Support',
        assignedAgent: { fullName: 'Sarah Jenkins' },
        createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        slaTimeLeft: 120,
        slaFormatted: '2h SLA',
      },
      {
        id: `INC-${organisation.id.replace('ORG-', '2024-9')}`,
        ticketType: 'Incident',
        summary: `SSL Certificate auto-renewal failure on external gateway domain`,
        priority: 'Medium',
        status: 'On Hold',
        organisation: organisation.name,
        category: 'Infrastructure & Cloud',
        assignedTeam: '2nd Line Support',
        assignedAgent: { fullName: 'Marcus Vance' },
        createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
        slaTimeLeft: 240,
        slaFormatted: '4h SLA',
      },
    ];

    return baseTickets.slice(0, Math.max(organisation.openTickets, 1));
  }, [organisation]);

  const filteredTickets = useMemo(() => {
    if (ticketFilter === 'ALL') return orgTickets;
    return orgTickets.filter((t) => t.status?.toLowerCase() === ticketFilter.toLowerCase());
  }, [orgTickets, ticketFilter]);

  if (!organisation) return null;

  const initials = organisation.name.slice(0, 2).toUpperCase();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in" />
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-5 md:p-6 overflow-y-auto pointer-events-none">
          <Dialog.Content className="w-full max-w-4xl max-h-[calc(100vh-48px)] my-2 sm:my-4 overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
          <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#13273e] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-slate-700/20">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 truncate tracking-tight">
                    {organisation.name}
                  </h2>
                  <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    @{organisation.id}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      organisation.tier === 'Enterprise'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : organisation.tier === 'Premium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {organisation.tier}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      organisation.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {organisation.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Globe size={12} className="text-slate-400" />
                    <span className="font-mono text-[#C96F55] font-medium">{organisation.domain}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{organisation.primarySite}</span>
                  </span>
                  <span>•</span>
                  <span>{organisation.region} Region</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 border-b border-slate-100 bg-white px-6 py-3 shrink-0">
            <div className="border-r border-slate-100 pr-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Open Tickets</span>
              <span className="text-lg font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Ticket size={16} className="text-[#C96F55]" />
                {orgTickets.length}
              </span>
            </div>
            <div className="border-r border-slate-100 px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Registered Contacts</span>
              <span className="text-lg font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Users size={16} className="text-blue-500" />
                {orgContacts.length}
              </span>
            </div>
            <div className="border-r border-slate-100 px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Service Level</span>
              <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mt-1">
                <ShieldCheck size={16} className="text-emerald-500" />
                {organisation.tier} Tier (24/7 SLA)
              </span>
            </div>
            <div className="pl-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Primary HQ Location</span>
              <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mt-1 truncate">
                <MapPin size={16} className="text-amber-500 shrink-0" />
                <span className="truncate">{organisation.primarySite}</span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 bg-slate-50/50 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
                activeTab === 'tickets'
                  ? 'border-[#C96F55] text-[#C96F55] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Ticket size={14} />
              <span>Open Tickets</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'tickets' ? 'bg-[#C96F55]/10 text-[#C96F55]' : 'bg-slate-200 text-slate-600'
              }`}>
                {orgTickets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
                activeTab === 'contacts'
                  ? 'border-[#C96F55] text-[#C96F55] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Users size={14} />
              <span>Contacts List</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'contacts' ? 'bg-[#C96F55]/10 text-[#C96F55]' : 'bg-slate-200 text-slate-600'
              }`}>
                {orgContacts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
                activeTab === 'overview'
                  ? 'border-[#C96F55] text-[#C96F55] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Building2 size={14} />
              <span>Organisation Details</span>
            </button>
          </div>

          {/* Modal Tab Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-white min-h-[320px]">
            {/* TAB 1: TICKETS */}
            {activeTab === 'tickets' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {['ALL', 'Active', 'Pending', 'On Hold'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setTicketFilter(status)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                          ticketFilter === status
                            ? 'bg-[#C96F55] text-white border-[#C96F55] shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {status === 'ALL' ? 'All Statuses' : status}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs text-slate-400">
                    Showing {filteredTickets.length} open {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
                  </span>
                </div>

                {filteredTickets.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="py-2.5 px-3">Ticket ID</th>
                          <th className="py-2.5 px-3">Summary</th>
                          <th className="py-2.5 px-3">Priority</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">SLA Time Left</th>
                          <th className="py-2.5 px-3">Assigned Agent</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTickets.map((ticket) => {
                          const agentName =
                            typeof ticket.assignedAgent === 'object'
                              ? ticket.assignedAgent?.fullName || 'Unassigned'
                              : ticket.assignedAgent || (ticket as any).assignedAgentId || 'Unassigned';

                          return (
                            <tr
                              key={ticket.id}
                              className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                              onClick={() => onSelectTicket && onSelectTicket(ticket)}
                            >
                              <td className="py-3 px-3 font-mono font-bold text-[#C96F55] whitespace-nowrap">
                                {ticket.id}
                              </td>
                              <td className="py-3 px-3 max-w-xs">
                                <span className="font-medium text-slate-900 block truncate" title={ticket.summary}>
                                  {ticket.summary}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  {ticket.ticketType || 'Incident'} • {ticket.category || 'General Support'}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    ticket.priority === 'Critical'
                                      ? 'bg-red-100 text-red-800'
                                      : ticket.priority === 'High'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {ticket.priority}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    ticket.status === 'Active'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : ticket.status === 'On Hold'
                                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {ticket.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <SlaBadge
                                  ticketId={ticket.id}
                                  slaTimeLeft={ticket.slaTimeLeft}
                                  slaFormatted={ticket.slaFormatted}
                                  resolutionTargetAt={(ticket as any).resolutionTargetAt}
                                  priority={ticket.priority}
                                  status={ticket.status}
                                  variant="restrained"
                                />
                              </td>
                              <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                {agentName}
                              </td>
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSelectTicket) onSelectTicket(ticket);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C96F55] hover:underline"
                                >
                                  <span>View</span>
                                  <ArrowRight size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <Ticket size={28} className="mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-600">No tickets found for this filter</p>
                    <p className="text-xs text-slate-400 mt-1">There are currently no {ticketFilter} tickets recorded for this organisation.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CONTACTS */}
            {activeTab === 'contacts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    Registered Contacts for {organisation.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {orgContacts.length} active contacts
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Contact Name</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Site Location</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orgContacts.map((contact) => {
                        const contactInitials = contact.fullName.slice(0, 2).toUpperCase();
                        return (
                          <tr key={contact.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                                  {contactInitials}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-900 block">{contact.fullName}</span>
                                  <span className="text-[10px] text-slate-400 block font-mono">{contact.id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-slate-600 flex items-center gap-1.5">
                                <Mail size={12} className="text-slate-400" />
                                {contact.email}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  contact.role === 'Administrator'
                                    ? 'bg-purple-100 text-purple-800'
                                    : contact.role === 'Team Lead'
                                    ? 'bg-blue-100 text-blue-800'
                                    : contact.role === 'Support Agent'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {contact.role}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                              {contact.defaultSite || organisation.primarySite}
                            </td>
                            <td className="py-3 px-3 text-slate-500 whitespace-nowrap font-mono">
                              <span className="flex items-center gap-1.5">
                                <Phone size={11} className="text-slate-400" />
                                {contact.phone}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {contact.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Building2 size={14} className="text-[#C96F55]" />
                      <span>Company & Identity</span>
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Legal Name</span>
                        <span className="font-semibold text-slate-800">{organisation.name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Client Tenant ID</span>
                        <span className="font-mono font-semibold text-slate-800">@{organisation.id}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Primary Domain</span>
                        <span className="font-mono text-[#C96F55] font-semibold">{organisation.domain}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Account Status</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-purple-600" />
                      <span>Contract & SLA Service Tier</span>
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Service Level Tier</span>
                        <span className="font-bold text-purple-700">{organisation.tier} Tier</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Target Response SLA</span>
                        <span className="font-semibold text-slate-800">15 minutes (Critical) / 1 hour (Standard)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Target Resolution SLA</span>
                        <span className="font-semibold text-slate-800">4 hours (Critical) / 24 hours (Standard)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Dedicated Support</span>
                        <span className="font-semibold text-slate-800">2nd Line Support Assigned</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MapPin size={14} className="text-blue-500" />
                    <span>Locations & Operating Regions</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Primary Site</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">{organisation.primarySite}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Region Group</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">{organisation.region} Region</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Tenant Isolation</span>
                      <span className="text-sm font-bold text-emerald-700 mt-1 block">Dedicated Partition</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400">
              Showing directory details for <strong className="text-slate-700">{organisation.name}</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </div>
    </Dialog.Portal>
    </Dialog.Root>
  );
};
