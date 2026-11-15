import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Globe,
  Compass,
  Building2,
  Landmark,
  Layers,
  ShieldCheck,
  Award,
  Sparkles,
  Activity,
  CheckCircle2,
  XCircle,
  MapPin,
  Search,
  X,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { usePersistentState } from '../../utils/persistentState';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { RefreshButton } from '../../components/shared/RefreshButton';
import './OrganisationUsersScreen.css';

export interface OrganisationItem {
  id: string;
  name: string;
  domain: string;
  tier: 'Enterprise' | 'Standard' | 'Premium';
  region: 'APAC' | 'EMEA' | 'Americas';
  primarySite: string;
  openTickets: number;
  contactCount: number;
  status: 'Active' | 'Inactive';
}

const DEFAULT_ORGANISATIONS: OrganisationItem[] = [
  {
    id: 'ORG-001',
    name: 'ServiGen Global Tech',
    domain: 'servigen.io',
    tier: 'Enterprise',
    region: 'APAC',
    primarySite: 'Bangalore HQ',
    openTickets: 5,
    contactCount: 14,
    status: 'Active',
  },
  {
    id: 'ORG-002',
    name: 'Acme Corp',
    domain: 'acme.com',
    tier: 'Enterprise',
    region: 'EMEA',
    primarySite: 'London UK Branch',
    openTickets: 2,
    contactCount: 8,
    status: 'Active',
  },
  {
    id: 'ORG-003',
    name: 'Globex Corporation',
    domain: 'globex.com',
    tier: 'Standard',
    region: 'Americas',
    primarySite: 'New York HQ',
    openTickets: 3,
    contactCount: 6,
    status: 'Active',
  },
  {
    id: 'ORG-004',
    name: 'Petabyte Corp',
    domain: 'petabyte.io',
    tier: 'Enterprise',
    region: 'Americas',
    primarySite: 'San Jose US Office',
    openTickets: 4,
    contactCount: 9,
    status: 'Active',
  },
  {
    id: 'ORG-005',
    name: 'Global Finance Corp',
    domain: 'globalfinance.com',
    tier: 'Enterprise',
    region: 'EMEA',
    primarySite: 'Frankfurt Tech Center',
    openTickets: 1,
    contactCount: 5,
    status: 'Active',
  },
  {
    id: 'ORG-006',
    name: 'Apex Global',
    domain: 'apexglobal.net',
    tier: 'Standard',
    region: 'APAC',
    primarySite: 'Hyderabad Hub',
    openTickets: 0,
    contactCount: 4,
    status: 'Active',
  },
];

const REGION_ITEMS = [
  { id: 'ALL', label: 'All Regions', Icon: Globe },
  { id: 'APAC', label: 'APAC Region', Icon: Compass },
  { id: 'EMEA', label: 'EMEA Region', Icon: Building2 },
  { id: 'Americas', label: 'Americas Region', Icon: Landmark },
] as const;

const TIER_ITEMS = [
  { id: 'ALL', label: 'All Service Tiers', Icon: Layers },
  { id: 'Enterprise', label: 'Enterprise', Icon: ShieldCheck },
  { id: 'Standard', label: 'Standard', Icon: Award },
  { id: 'Premium', label: 'Premium', Icon: Sparkles },
] as const;

const STATUS_ITEMS = [
  { id: 'ALL', label: 'All Statuses', Icon: Activity },
  { id: 'Active', label: 'Active', Icon: CheckCircle2 },
  { id: 'Inactive', label: 'Inactive', Icon: XCircle },
] as const;

export const OrganisationsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isAdmin =
    currentUser?.role === 'Administrator' ||
    currentUser?.role === 'System Manager' ||
    (currentUser?.role as any) === 'Admin';

  const [organisations, setOrganisations] = usePersistentState<OrganisationItem[]>(
    'servigen_organisations_directory_v2',
    DEFAULT_ORGANISATIONS
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedSite, setSelectedSite] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);

  // New Organisation Form
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDomain, setNewOrgDomain] = useState('');
  const [newOrgTier, setNewOrgTier] = useState<'Enterprise' | 'Standard' | 'Premium'>('Enterprise');
  const [newOrgRegion, setNewOrgRegion] = useState<'APAC' | 'EMEA' | 'Americas'>('APAC');
  const [newOrgSite, setNewOrgSite] = useState('Bangalore HQ');

  const primarySites = useMemo(() => {
    const set = new Set(organisations.map((o) => o.primarySite));
    return Array.from(set);
  }, [organisations]);

  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const siteDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (siteDropdownRef.current && !siteDropdownRef.current.contains(e.target as Node)) {
        setIsSiteDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedRegion !== 'ALL' ||
    selectedTier !== 'ALL' ||
    selectedSite !== 'ALL' ||
    selectedStatus !== 'ALL';

  const filteredOrganisations = useMemo(() => {
    return organisations.filter((org) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        org.name.toLowerCase().includes(q) ||
        org.domain.toLowerCase().includes(q) ||
        org.primarySite.toLowerCase().includes(q) ||
        org.id.toLowerCase().includes(q);

      const matchesRegion = selectedRegion === 'ALL' || org.region === selectedRegion;
      const matchesTier = selectedTier === 'ALL' || org.tier === selectedTier;
      const matchesSite = selectedSite === 'ALL' || org.primarySite === selectedSite;
      const matchesStatus = selectedStatus === 'ALL' || org.status === selectedStatus;

      return matchesSearch && matchesRegion && matchesTier && matchesSite && matchesStatus;
    });
  }, [organisations, searchQuery, selectedRegion, selectedTier, selectedSite, selectedStatus]);

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const newOrg: OrganisationItem = {
      id: `ORG-${String(organisations.length + 1).padStart(3, '0')}`,
      name: newOrgName.trim(),
      domain: newOrgDomain.trim() || `${newOrgName.toLowerCase().replace(/\s+/g, '')}.com`,
      tier: newOrgTier,
      region: newOrgRegion,
      primarySite: newOrgSite,
      openTickets: 0,
      contactCount: 0,
      status: 'Active',
    };

    setOrganisations([newOrg, ...organisations]);
    setIsAddOrgModalOpen(false);
    setNewOrgName('');
    setNewOrgDomain('');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRegion('ALL');
    setSelectedTier('ALL');
    setSelectedSite('ALL');
    setSelectedStatus('ALL');
  };

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col bg-[#FFF9F5] overflow-hidden">
      {/* ── Top Navbar ── */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-40 min-h-[50px] sticky top-0 overflow-visible">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">Organisations</span>
        </div>
        <GlobalNavbarActions />
      </header>

      {/* ── Two-Column Layout with Left Sidebar & Right Content ── */}
      <div className="org-page-layout">
        {/* Left Sidebar */}
        <aside className="org-side">
          {/* Search box */}
          <div className="org-side-search">
            <input
              type="text"
              placeholder="Search organisations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="org-side-search-btn"
                title="Clear search"
              >
                <X size={14} />
              </button>
            ) : (
              <span className="org-side-search-icon">
                <Search size={14} />
              </span>
            )}
          </div>

          {/* Regions Nav */}
          <div className="org-side-section">
            <h3 className="org-side-heading">Regions</h3>
            <div className="org-side-nav-group">
              {REGION_ITEMS.map((item) => {
                const Icon = item.Icon;
                const isActive = selectedRegion === item.id;
                const count =
                  item.id === 'ALL'
                    ? organisations.length
                    : organisations.filter((o) => o.region === item.id).length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`org-side-nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedRegion(item.id)}
                  >
                    <span className="org-side-nav-icon">
                      <Icon size={16} strokeWidth={2.2} />
                    </span>
                    <span className="org-side-nav-label">{item.label}</span>
                    <span className="org-side-nav-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service Tiers Nav */}
          <div className="org-side-section">
            <h3 className="org-side-heading">Service Tiers</h3>
            <div className="org-side-nav-group">
              {TIER_ITEMS.map((item) => {
                const Icon = item.Icon;
                const isActive = selectedTier === item.id;
                const count =
                  item.id === 'ALL'
                    ? organisations.length
                    : organisations.filter((o) => o.tier === item.id).length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`org-side-nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedTier(item.id)}
                  >
                    <span className="org-side-nav-icon">
                      <Icon size={16} strokeWidth={2.2} />
                    </span>
                    <span className="org-side-nav-label">{item.label}</span>
                    <span className="org-side-nav-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Nav */}
          <div className="org-side-section">
            <h3 className="org-side-heading">Status</h3>
            <div className="org-side-nav-group">
              {STATUS_ITEMS.map((item) => {
                const Icon = item.Icon;
                const isActive = selectedStatus === item.id;
                const count =
                  item.id === 'ALL'
                    ? organisations.length
                    : organisations.filter((o) => o.status === item.id).length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`org-side-nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedStatus(item.id)}
                  >
                    <span className="org-side-nav-icon">
                      <Icon size={16} strokeWidth={2.2} />
                    </span>
                    <span className="org-side-nav-label">{item.label}</span>
                    <span className="org-side-nav-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Sites Dropdown */}
          <div className="org-side-section" ref={siteDropdownRef}>
            <h3 className="org-side-heading">Default Site</h3>
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setIsSiteDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between gap-2 rounded-full border border-slate-200 bg-white py-1.5 px-3 text-[12.5px] font-medium text-slate-700 outline-none hover:border-slate-300 hover:bg-slate-50/70 focus:border-[#C96F55] focus:ring-2 focus:ring-[#C96F55]/15 cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">
                    {selectedSite === 'ALL'
                      ? `All Default Sites (${organisations.length})`
                      : `${selectedSite} (${organisations.filter((o) => o.primarySite === selectedSite).length})`}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 shrink-0 transition-transform duration-200 ${isSiteDropdownOpen ? 'rotate-180 text-[#C96F55]' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isSiteDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSite('ALL');
                      setIsSiteDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                      selectedSite === 'ALL'
                        ? 'bg-[#C96F55]/10 text-[#C96F55] font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>All Default Sites</span>
                    <span className="text-[11px] opacity-70">({organisations.length})</span>
                  </button>
                  {primarySites.map((site) => {
                    const count = organisations.filter((o) => o.primarySite === site).length;
                    const isSelected = selectedSite === site;
                    return (
                      <button
                        key={site}
                        type="button"
                        onClick={() => {
                          setSelectedSite(site);
                          setIsSiteDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-[#C96F55]/10 text-[#C96F55] font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{site}</span>
                        <span className="text-[11px] opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="org-side-reset-btn"
              onClick={handleResetFilters}
            >
              <RotateCcw size={13} />
              <span>Reset All Filters</span>
            </button>
          )}

          {/* Add Organisation Sidebar Button */}
          {isAdmin && (
            <button
              type="button"
              className="org-side-add-btn"
              onClick={() => setIsAddOrgModalOpen(true)}
              title="Add a new client organisation"
            >
              <Plus size={16} />
              <span>Add Organisation</span>
            </button>
          )}
        </aside>

        {/* Right Main Content */}
        <main className="org-main">
          {/* Header Section */}
          <div className="org-main-header">
            <div>
              <h1 className="org-main-title">Organisations Directory</h1>
              <p className="org-main-subtitle">
                Manage client organisations, company domains, service tiers, and sites across EMEA, APAC &amp; Americas
              </p>
            </div>

            <div className="org-main-actions">
              <span className="org-main-range">
                Showing {filteredOrganisations.length} of {organisations.length} organisations
              </span>
              <RefreshButton
                onClick={handleResetFilters}
                title="Refresh organisations directory"
              />
              {isAdmin && (
                <button
                  type="button"
                  className="org-btn-add-primary"
                  onClick={() => setIsAddOrgModalOpen(true)}
                  title="Add a new client organisation"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Organisation</span>
                </button>
              )}
            </div>
          </div>

          {/* Organisations Table */}
          <div className="org-table-wrapper">
            <table className="org-users-table">
              <thead>
                <tr>
                  <th>ORGANISATION NAME</th>
                  <th>DOMAIN</th>
                  <th>SERVICE TIER</th>
                  <th>PRIMARY SITE / HQ</th>
                  <th>REGION</th>
                  <th>REGISTERED CONTACTS</th>
                  <th>OPEN TICKETS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrganisations.length > 0 ? (
                  filteredOrganisations.map((org) => {
                    const initials = org.name.slice(0, 2).toUpperCase();
                    return (
                      <tr key={org.id}>
                        <td>
                          <div className="org-user-identity">
                            <div className="org-user-avatar">{initials}</div>
                            <div className="org-user-name-box">
                              <span className="org-user-fullname">{org.name}</span>
                              <span className="org-user-handle">@{org.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>{org.domain}</td>
                        <td>
                          <span className={`org-status-pill tier-${org.tier.toLowerCase()}`}>
                            {org.tier}
                          </span>
                        </td>
                        <td>{org.primarySite}</td>
                        <td>{org.region}</td>
                        <td>{org.contactCount} Contacts</td>
                        <td>{org.openTickets} Open</td>
                        <td>
                          <span className={`org-status-pill ${org.status.toLowerCase()}`}>
                            {org.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>No organisations match the current filters.</span>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          style={{
                            background: '#C96F55',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 999,
                            padding: '6px 14px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        {/* Add Organisation Modal */}
        {isAddOrgModalOpen && (
          <div className="org-modal-backdrop" onClick={() => setIsAddOrgModalOpen(false)}>
            <div className="org-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="org-modal-header">
                <h2>Add New Organisation</h2>
                <button
                  type="button"
                  className="org-modal-close"
                  onClick={() => setIsAddOrgModalOpen(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateOrg}>
                <div className="org-modal-body">
                  <div className="org-modal-field">
                    <label>Organisation / Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corporation"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                    />
                  </div>

                  <div className="org-modal-field">
                    <label>Corporate Domain</label>
                    <input
                      type="text"
                      placeholder="e.g. acme.com"
                      value={newOrgDomain}
                      onChange={(e) => setNewOrgDomain(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="org-modal-field">
                      <label>Service Tier</label>
                      <select value={newOrgTier} onChange={(e) => setNewOrgTier(e.target.value as any)}>
                        <option value="Enterprise">Enterprise</option>
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                      </select>
                    </div>
                    <div className="org-modal-field">
                      <label>Region</label>
                      <select value={newOrgRegion} onChange={(e) => setNewOrgRegion(e.target.value as any)}>
                        <option value="APAC">APAC</option>
                        <option value="EMEA">EMEA</option>
                        <option value="Americas">Americas</option>
                      </select>
                    </div>
                  </div>

                  <div className="org-modal-field">
                    <label>Primary Site / Headquarters</label>
                    <input
                      type="text"
                      value={newOrgSite}
                      onChange={(e) => setNewOrgSite(e.target.value)}
                    />
                  </div>
                </div>

                <div className="org-modal-footer">
                  <button
                    type="button"
                    className="org-btn-cancel"
                    onClick={() => setIsAddOrgModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="org-btn-add-user">
                    Save Organisation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganisationsScreen;
