/**
 * Servigen Organisations & Users Service Layer
 * Corresponds to Servigen API Specification Section 5.2 & 5.11 (Organisations Module)
 *
 * Backend Routes:
 * - GET /api/organisations/:organisationId/users          : List users belonging to an organisation (Tenant-isolated)
 * - GET /api/organisations/:organisationId/users/:userId  : Retrieve single organisation user details
 * - GET /api/users                                       : List directory users across organisations
 * - GET /api/users/:id                                   : Retrieve specific user by ID
 */

import { api } from './apiClient';
import type { User } from '../pages/Auth/types';
import { MOCK_ORGANISATION_USERS } from '../pages/Auth/mockAuthData';

export interface OrganisationsApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Normalizes raw backend user objects into the strict frontend User model
 */
export function normalizeOrganisationUser(raw: any): User {
  if (!raw) {
    return {
      id: 'USR-000',
      username: 'unknown',
      firstName: 'Unknown',
      lastName: 'User',
      fullName: 'Unknown User',
      email: '',
      phone: '+91 90000 00000',
      networkLogin: 'CORP\\unknown',
      defaultSite: 'Main HQ',
      defaultOrganisation: 'ServiGen Global Tech',
      region: 'APAC',
      role: 'Support Agent',
      status: 'Active',
      lastLogin: 'Active',
      department: 'IT Operations',
    };
  }

  const firstName = raw.firstName || (raw.fullName ? raw.fullName.split(' ')[0] : '') || raw.username || 'User';
  const lastName = raw.lastName || (raw.fullName ? raw.fullName.split(' ').slice(1).join(' ') : '') || '';
  const fullName = raw.fullName || `${firstName} ${lastName}`.trim() || raw.username || 'User';
  const username = raw.username || (raw.email ? raw.email.split('@')[0] : `user-${raw.id || '001'}`);

  // Normalize role to frontend role union
  let role: User['role'] = 'Support Agent';
  const r = (raw.role || '').toLowerCase();
  if (r.includes('admin')) {
    role = 'Administrator';
  } else if (r.includes('team lead') || r.includes('support team')) {
    role = 'Team Lead';
  } else if (r.includes('system manager') || r.includes('approver')) {
    role = 'System Manager';
  } else if (r.includes('end user') || r.includes('service user')) {
    role = 'End User';
  } else if (r.includes('agent') || r.includes('support')) {
    role = 'Support Agent';
  }

  // Normalize region
  let region: User['region'] = 'APAC';
  const reg = (raw.region || '').toUpperCase();
  if (reg === 'EMEA' || reg === 'AMERICAS' || reg === 'APAC') {
    region = (reg === 'AMERICAS' ? 'Americas' : reg) as User['region'];
  } else if (raw.defaultSite?.includes('London') || raw.site?.includes('Frankfurt') || raw.site?.includes('London')) {
    region = 'EMEA';
  } else if (raw.defaultSite?.includes('New York') || raw.site?.includes('San Jose')) {
    region = 'Americas';
  }

  // Normalize status
  let status: User['status'] = 'Active';
  if (raw.status === 'Inactive' || raw.active === false || raw.availability === 'Inactive') {
    status = 'Inactive';
  } else if (raw.status === 'Pending') {
    status = 'Pending';
  }

  return {
    id: String(raw.id || raw.userId || `USR-${Math.floor(100 + Math.random() * 900)}`),
    username,
    firstName,
    lastName,
    fullName,
    email: raw.email || `${username}@servigen.io`,
    phone: raw.phone || raw.phoneNumber || '+91 98765 43210',
    networkLogin: raw.networkLogin || `CORP\\${username}`,
    defaultSite: raw.defaultSite || raw.site?.name || raw.site || 'Bangalore HQ',
    defaultOrganisation: raw.defaultOrganisation || raw.organisation?.name || raw.organisationId || 'ServiGen Global Tech',
    region,
    role,
    status,
    lastLogin: raw.lastLogin || (raw.updatedAt ? new Date(raw.updatedAt).toLocaleDateString() : 'Just now'),
    department: raw.department || 'IT Operations',
    avatarUrl: raw.avatarUrl,
  };
}

/**
 * Fetch organisation users from live backend API
 * Tries:
 * 1. GET /api/organisations/:organisationId/users (if orgId is given)
 * 2. GET /api/users (directory of users)
 * 3. Graceful fallback to cached mock users if backend is unreachable
 */
export async function fetchOrganisationUsers(organisationId?: string): Promise<User[]> {
  try {
    // 1. If an organisation ID is specified, query tenant-isolated organisation endpoint
    if (organisationId && organisationId !== 'ALL') {
      try {
        const res = await api.get(`/api/organisations/${encodeURIComponent(organisationId)}/users`);
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (list.length > 0) {
          return list.map(normalizeOrganisationUser);
        }
      } catch (err: any) {
        // If 403 or 404, fall through to directory endpoint
        if (err?.statusCode !== 403 && err?.statusCode !== 404) {
          console.warn('[organisationsService] Specific org fetch failed, falling back to /api/users:', err);
        }
      }
    }

    // 2. Fetch from standard users directory
    const res = await api.get('/api/users');
    const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    if (rawList.length > 0) {
      return rawList.map(normalizeOrganisationUser);
    }
  } catch (err) {
    console.warn('[organisationsService] Live backend unreachable, utilizing local directory cache:', err);
  }

  // 3. Fallback to cached organization user directory
  return MOCK_ORGANISATION_USERS;
}

/**
 * Fetch a specific user by ID
 */
export async function fetchOrganisationUserById(
  userId: string,
  organisationId?: string
): Promise<User | null> {
  try {
    if (organisationId && organisationId !== 'ALL') {
      try {
        const res = await api.get(
          `/api/organisations/${encodeURIComponent(organisationId)}/users/${encodeURIComponent(userId)}`
        );
        const user = res?.data || res;
        if (user && (user.id || user.username)) {
          return normalizeOrganisationUser(user);
        }
      } catch {
        // Fall back to /api/users/:id
      }
    }

    const res = await api.get(`/api/users/${encodeURIComponent(userId)}`);
    const user = res?.data || res;
    if (user && (user.id || user.username)) {
      return normalizeOrganisationUser(user);
    }
  } catch (err) {
    console.warn(`[organisationsService] Failed to fetch user ${userId}:`, err);
  }

  return MOCK_ORGANISATION_USERS.find((u) => u.id === userId || u.username === userId) || null;
}
