import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { usePersistentState } from '../../utils/persistentState';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
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
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);

  // New Organisation Form
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDomain, setNewOrgDomain] = useState('');
  const [newOrgTier, setNewOrgTier] = useState<'Enterprise' | 'Standard' | 'Premium'>('Enterprise');
  const [newOrgRegion, setNewOrgRegion] = useState<'APAC' | 'EMEA' | 'Americas'>('APAC');
  const [newOrgSite, setNewOrgSite] = useState('Bangalore HQ');

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
      const matchesStatus = selectedStatus === 'ALL' || org.status === selectedStatus;

      return matchesSearch && matchesRegion && matchesTier && matchesStatus;
    });
  }, [organisations, searchQuery, selectedRegion, selectedTier, selectedStatus]);

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

  const totalContacts = useMemo(
    () => organisations.reduce((sum, o) => sum + (o.contactCount || 0), 0),
    [organisations]
  );
  const totalEnterprise = useMemo(
    () => organisations.filter((o) => o.tier === 'Enterprise').length,
    [organisations]
  );

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col bg-[#fffaf7]">
      {/* ── Top Navbar ── */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-10 min-h-[50px] sticky top-0">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">Organisations</span>
        </div>
        <GlobalNavbarActions />
      </header>

      <div className="org-users-page flex-1">
        {/* Header Section */}
        <div className="org-users-header-row">
          <div className="org-users-title-col">
            <h1>Organisations Directory</h1>
            <p className="mt-1 text-xs text-gray-500">
              Manage client organisations, company domains, service tiers, and sites across EMEA, APAC &amp; Americas
            </p>
          </div>

          <div className="org-users-header-right">
            <div className="org-users-actions-row">
              <button
                type="button"
                className="org-btn-refresh"
                onClick={() => setSearchQuery('')}
                title="Reset filters"
              >
                <span>🔄</span>
                <span>Reset</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  className="org-btn-add-user"
                  onClick={() => setIsAddOrgModalOpen(true)}
                  title="Add a new client organisation"
                >
                  <span>+</span>
                  <span>Add Organisation</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white border border-gray-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Organisations</span>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{organisations.length}</p>
            </div>
            <span className="text-2xl">🏢</span>
          </div>
          <div className="bg-white border border-gray-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Enterprise Accounts</span>
              <p className="text-xl font-bold text-purple-700 mt-0.5">{totalEnterprise}</p>
            </div>
            <span className="text-2xl">👑</span>
          </div>
          <div className="bg-white border border-gray-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Managed Contacts</span>
              <p className="text-xl font-bold text-[#eb6a47] mt-0.5">{totalContacts}</p>
            </div>
            <span className="text-2xl">👥</span>
          </div>
          <div className="bg-white border border-gray-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Regions Active</span>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">3 Regions</p>
            </div>
            <span className="text-2xl">🌐</span>
          </div>
        </div>

        {/* Region Tabs */}
        <div className="org-region-tabs-row">
          {['ALL', 'APAC', 'EMEA', 'Americas'].map((reg) => (
            <button
              key={reg}
              type="button"
              className={`org-region-tab-btn ${selectedRegion === reg ? 'active' : ''}`}
              onClick={() => setSelectedRegion(reg)}
            >
              {reg === 'ALL' ? 'All Regions' : `${reg} Region`}
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="org-filters-bar">
          <div className="org-search-box">
            <input
              type="text"
              className="org-search-input"
              placeholder="Search by organisation name, domain, primary site, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="org-filter-select"
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
          >
            <option value="ALL">All Service Tiers</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
          </select>

          <select
            className="org-filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
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
                filteredOrganisations.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#13273e] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {org.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block text-xs">{org.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono font-semibold">{org.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-[#0284c7] font-medium font-mono text-xs hover:underline cursor-pointer">
                        {org.domain}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          org.tier === 'Enterprise'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : org.tier === 'Premium'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {org.tier}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-700 font-medium text-xs">{org.primarySite}</span>
                    </td>
                    <td>
                      <span className="text-slate-700 font-semibold text-xs">{org.region}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => navigate(`/contacts?organisation=${encodeURIComponent(org.name)}`)}
                        className="text-[#eb6a47] font-bold text-xs hover:underline cursor-pointer flex items-center gap-1"
                        title={`View ${org.contactCount} contacts for ${org.name}`}
                      >
                        <span>{org.contactCount} Contacts</span>
                        <span>→</span>
                      </button>
                    </td>
                    <td>
                      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                        {org.openTickets} Open
                      </span>
                    </td>
                    <td>
                      <span className={`org-status-pill ${org.status.toLowerCase()}`}>
                        {org.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No organisations match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
                    className="org-btn-refresh"
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
