import React, { useState, useMemo } from 'react';
import { User } from './types';
import { MOCK_ORGANISATION_USERS } from './mockAuthData';

interface OrganisationUsersScreenProps {
  users?: User[];
  onAddUserClick?: () => void;
}

export const OrganisationUsersScreen: React.FC<OrganisationUsersScreenProps> = ({
  users = MOCK_ORGANISATION_USERS,
  onAddUserClick,
}) => {
  const [userList, setUserList] = useState<User[]>(users);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('ALL');
  const [selectedOrganisation, setSelectedOrganisation] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
      const matchesSearch =
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.networkLogin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSite = selectedSite === 'ALL' || user.defaultSite === selectedSite;
      const matchesOrg = selectedOrganisation === 'ALL' || user.defaultOrganisation === selectedOrganisation;
      const matchesRegion = selectedRegion === 'ALL' || user.region === selectedRegion;
      const matchesStatus = selectedStatus === 'ALL' || user.status === selectedStatus;
      const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;

      return matchesSearch && matchesSite && matchesOrg && matchesRegion && matchesStatus && matchesRole;
    });
  }, [userList, searchQuery, selectedSite, selectedOrganisation, selectedRegion, selectedStatus, selectedRole]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="figma-users-page">
      {/* Header Section */}
      <div className="users-screen-header">
        <div className="users-title-section">
          <h1>Organisations - Users List (SCR-020 / SCR-031)</h1>
          <p>Manage organisation users, sites, emails, contact numbers, and domain logins across EMEA, APAC & Americas</p>
        </div>

        <div className="users-header-actions">
          <button className="users-btn-secondary" onClick={handleRefresh}>
            🔄 Refresh
          </button>
          <button
            className="users-btn-primary"
            onClick={() => {
              if (onAddUserClick) {
                onAddUserClick();
              }
            }}
          >
            + Add User
          </button>
        </div>
      </div>

      {/* Region Tabs (EMEA, APAC, Americas, ALL) */}
      <div className="region-tab-bar">
        {['ALL', 'APAC', 'EMEA', 'Americas'].map((reg) => (
          <button
            key={reg}
            className={`region-tab-btn ${selectedRegion === reg ? 'active' : ''}`}
            onClick={() => setSelectedRegion(reg)}
          >
            {reg === 'ALL' ? 'All Regions' : `${reg} Region`}
          </button>
        ))}
      </div>

      {/* Search and Filter Controls */}
      <div className="users-filter-bar">
        <div className="search-input-box">
          <input
            type="text"
            className="users-search-input"
            placeholder="Search by name, username, email, site, or domain login..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="users-filter-select"
          value={selectedOrganisation}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedOrganisation(e.target.value)}
        >
          <option value="ALL">All Organisations</option>
          {organisations.map((org) => (
            <option key={org} value={org}>
              {org}
            </option>
          ))}
        </select>

        <select
          className="users-filter-select"
          value={selectedSite}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSite(e.target.value)}
        >
          <option value="ALL">All Default Sites</option>
          {sites.map((site) => (
            <option key={site} value={site}>
              {site}
            </option>
          ))}
        </select>

        <select
          className="users-filter-select"
          value={selectedRole}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRole(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          <option value="Administrator">Administrator</option>
          <option value="Team Lead">Team Lead</option>
          <option value="System Manager">System Manager</option>
          <option value="Support Agent">Support Agent</option>
          <option value="End User">End User</option>
        </select>

        <select
          className="users-filter-select"
          value={selectedStatus}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="users-table-card">
        {isLoading ? (
          <div className="users-empty-state">
            <p>Loading organisation user directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="users-empty-state">
            <h3>No users found</h3>
            <p>Try clearing search or changing filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username / Name</th>
                  <th>First Name</th>
                  <th>Default Organisation</th>
                  <th>Default Site</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>Network Login</th>
                  <th>Region</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell-name">
                        <div className="user-avatar">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </div>
                        <div>
                          <div className="user-full-name">{user.fullName}</div>
                          <div className="user-username-handle">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.firstName}</td>
                    <td>{user.defaultOrganisation}</td>
                    <td>{user.defaultSite}</td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>
                      <code className="network-login-code">{user.networkLogin}</code>
                    </td>
                    <td>
                      <span className="region-badge">{user.region}</span>
                    </td>
                    <td>
                      <span className={`status-badge status-${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganisationUsersScreen;
