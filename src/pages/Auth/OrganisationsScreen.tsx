import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from './AuthContext';
import { usePersistentState } from '../../utils/persistentState';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { RefreshButton } from '../../components/shared/RefreshButton';
import { ResetButton } from '../../components/shared/ResetButton';
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
    <div className="flex-1 w-full min-h-screen flex flex-col bg-[#FFF9F5]">
      {/* ── Top Navbar ── */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-40 min-h-[50px] sticky top-0 overflow-visible">
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
              <RefreshButton
                onClick={handleResetFilters}
                title="Refresh organisations directory"
              />
              {isAdmin && (
                <button
                  type="button"
                  className="org-btn-add-user"
                  onClick={() => setIsAddOrgModalOpen(true)}
                  title="Add a new client organisation"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Organisation</span>
                </button>
              )}
            </div>
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
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
          >
            <option value="ALL">All Default Sites</option>
            {primarySites.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
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

        {/* Organisations Table matching Contacts image */}
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
