import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from './types';
import { fetchOrganisationUsers, createOrganisationUser } from '../../services/organisationsService';
import { usePersistentState } from '../../utils/persistentState';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import './OrganisationUsersScreen.css';

interface OrganisationUsersScreenProps {
  users?: User[];
}

export const OrganisationUsersScreen: React.FC<OrganisationUsersScreenProps> = ({
  users,
}) => {
  const navigate = useNavigate();
  const [userList, setUserList] = usePersistentState<User[]>('servigen_org_users_v2', users || []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('ALL');
  const [selectedOrganisation, setSelectedOrganisation] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);

  // Fetch users from live backend on mount or when organization filter changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchOrganisationUsers(selectedOrganisation !== 'ALL' ? selectedOrganisation : undefined)
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setUserList(data);
        }
      })
      .catch((err) => {
        console.warn('[OrganisationUsersScreen] Error fetching users from backend:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedOrganisation]);

  // New User Form State
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+91 98765 ');
  const [newOrg, setNewOrg] = useState('ServiGen Global Tech');
  const [newSite, setNewSite] = useState('Bangalore HQ');
  const [newRegion, setNewRegion] = useState<'APAC' | 'EMEA' | 'Americas'>('APAC');
  const [newRole, setNewRole] = useState<User['role']>('Support Agent');

  // Extract unique sites for filter dropdown
  const sites = useMemo(() => {
    const set = new Set(userList.map((u) => u.defaultSite));
    return Array.from(set);
  }, [userList]);

  // Extract unique organisations for filter dropdown
  const organisations = useMemo(() => {
    const set = new Set(userList.map((u) => u.defaultOrganisation));
    return Array.from(set);
  }, [userList]);

  // Filter users based on search and selected options
  const filteredUsers = useMemo(() => {
    return userList.filter((user) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        user.fullName.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.networkLogin.toLowerCase().includes(q) ||
        user.firstName.toLowerCase().includes(q);

      const matchesSite = selectedSite === 'ALL' || user.defaultSite === selectedSite;
      const matchesOrg = selectedOrganisation === 'ALL' || user.defaultOrganisation === selectedOrganisation;
      const matchesRegion = selectedRegion === 'ALL' || user.region === selectedRegion;
      const matchesStatus = selectedStatus === 'ALL' || user.status === selectedStatus;
      const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;

      return matchesSearch && matchesSite && matchesOrg && matchesRegion && matchesStatus && matchesRole;
    });
  }, [userList, searchQuery, selectedSite, selectedOrganisation, selectedRegion, selectedStatus, selectedRole]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await fetchOrganisationUsers(selectedOrganisation !== 'ALL' ? selectedOrganisation : undefined);
      if (data && data.length > 0) {
        setUserList(data);
      }
    } catch (err) {
      console.warn('[OrganisationUsersScreen] Refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newEmail.trim()) return;

    setCreateUserError(null);
    setIsCreatingUser(true);

    const username = `${newFirstName.toLowerCase().trim()}.${(newLastName[0] || 'a').toLowerCase()}`;
    const newUserPayload: Partial<User> = {
      username,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      defaultSite: newSite,
      defaultOrganisation: newOrg,
      region: newRegion,
      role: newRole,
    };

    try {
      const createdUser = await createOrganisationUser(newUserPayload);
      setUserList((prev) => [createdUser, ...prev]);
      setIsAddUserModalOpen(false);
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
    } catch (err: any) {
      setCreateUserError(
        err?.message ||
        'Backend endpoint POST /api/users is not implemented in the backend API documentation.'
      );
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <div className="org-users-page">
      {/* Header Section */}
      <div className="org-users-header-row">
        <div className="org-users-title-col">
          <h1>Organisations - Users List</h1>
          <p>Manage organisation users, sites, emails, contact numbers, and domain logins across EMEA, APAC &amp; Americas</p>
        </div>

        <div className="org-users-header-right">
          {/* Sub actions */}
          <div className="org-users-actions-row">
            <button
              type="button"
              className="org-btn-refresh"
              onClick={handleRefresh}
              title="Refresh users directory"
            >
              <span>{isLoading ? '⏳' : '🔄'}</span>
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="org-btn-add-user"
              onClick={() => setIsAddUserModalOpen(true)}
              title="Add a new organisation user"
            >
              <span>+</span>
              <span>Add User</span>
            </button>
            <GlobalNavbarActions />
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
            placeholder="Search by name, username, email, site, or domain login..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="org-filter-select"
          value={selectedOrganisation}
          onChange={(e) => setSelectedOrganisation(e.target.value)}
        >
          <option value="ALL">All Organisations</option>
          {organisations.map((org) => (
            <option key={org} value={org}>
              {org}
            </option>
          ))}
        </select>

        <select
          className="org-filter-select"
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
        >
          <option value="ALL">All Default Sites</option>
          {sites.map((site) => (
            <option key={site} value={site}>
              {site}
            </option>
          ))}
        </select>

        <select
          className="org-filter-select"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          <option value="Administrator">Administrator</option>
          <option value="Team Lead">Team Lead</option>
          <option value="System Manager">System Manager</option>
          <option value="Support Agent">Support Agent</option>
          <option value="End User">End User</option>
        </select>

        <select
          className="org-filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Users Table matching image columns */}
      <div className="org-table-wrapper">
        <table className="org-users-table">
          <thead>
            <tr>
              <th>USERNAME / NAME</th>
              <th>FIRST NAME</th>
              <th>DEFAULT ORGANISATION</th>
              <th>DEFAULT SITE</th>
              <th>EMAIL ADDRESS</th>
              <th>PHONE NUMBER</th>
              <th>NETWORK LOGIN</th>
              <th>REGION</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Loading organisation users from backend...
                </td>
              </tr>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}`.toUpperCase();
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="org-user-identity">
                        <div className="org-user-avatar">{initials}</div>
                        <div className="org-user-name-box">
                          <span className="org-user-fullname">{user.fullName}</span>
                          <span className="org-user-handle">@{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td>{user.firstName}</td>
                    <td>{user.defaultOrganisation}</td>
                    <td>{user.defaultSite}</td>
                    <td>
                      <span className="text-[#0284c7] font-medium hover:underline cursor-pointer">
                        {user.email}
                      </span>
                    </td>
                    <td>{user.phone}</td>
                    <td>
                      <code className="org-login-code">{user.networkLogin}</code>
                    </td>
                    <td>
                      <span className="text-slate-700 font-medium">{user.region}</span>
                    </td>
                    <td>
                      <span className={`org-status-pill ${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  No organisation users found from the backend API matching the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="org-modal-backdrop" onClick={() => setIsAddUserModalOpen(false)}>
          <div className="org-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="org-modal-header">
              <h2>Add New Organisation User</h2>
              <button
                type="button"
                className="org-modal-close"
                onClick={() => setIsAddUserModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="org-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="org-modal-field">
                    <label>First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                    />
                  </div>
                  <div className="org-modal-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Doe"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="org-modal-field">
                  <label>Corporate Email</label>
                  <input
                    type="email"
                    required
                    placeholder="john.doe@servigen.io"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>

                <div className="org-modal-field">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="org-modal-field">
                    <label>Default Organisation</label>
                    <select value={newOrg} onChange={(e) => setNewOrg(e.target.value)}>
                      <option value="ServiGen Global Tech">ServiGen Global Tech</option>
                      <option value="ServiGen Enterprise">ServiGen Enterprise</option>
                      <option value="ServiGen Europe">ServiGen Europe</option>
                      <option value="ServiGen Americas Inc.">ServiGen Americas Inc.</option>
                    </select>
                  </div>
                  <div className="org-modal-field">
                    <label>Default Site</label>
                    <select value={newSite} onChange={(e) => setNewSite(e.target.value)}>
                      <option value="Bangalore HQ">Bangalore HQ</option>
                      <option value="Hyderabad Hub">Hyderabad Hub</option>
                      <option value="London UK Branch">London UK Branch</option>
                      <option value="New York HQ">New York HQ</option>
                      <option value="Frankfurt Tech Center">Frankfurt Tech Center</option>
                      <option value="San Jose US Office">San Jose US Office</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="org-modal-field">
                    <label>Region</label>
                    <select value={newRegion} onChange={(e) => setNewRegion(e.target.value as any)}>
                      <option value="APAC">APAC</option>
                      <option value="EMEA">EMEA</option>
                      <option value="Americas">Americas</option>
                    </select>
                  </div>
                  <div className="org-modal-field">
                    <label>Role</label>
                    <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)}>
                      <option value="Support Agent">Support Agent</option>
                      <option value="Administrator">Administrator</option>
                      <option value="Team Lead">Team Lead</option>
                      <option value="System Manager">System Manager</option>
                      <option value="End User">End User</option>
                    </select>
                  </div>
                </div>

                {createUserError && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '12px'
                  }}>
                    ⚠️ {createUserError}
                  </div>
                )}
              </div>

              <div className="org-modal-footer">
                <button
                  type="button"
                  className="org-btn-refresh"
                  onClick={() => setIsAddUserModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="org-btn-add-user" disabled={isCreatingUser}>
                  {isCreatingUser ? 'Saving to Backend...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganisationUsersScreen;
