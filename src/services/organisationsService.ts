
import { api, logServiceError } from './apiClient';
import { MOCK_USERS } from './fallback/mockData';
import type { User } from '../pages/Auth/types';

export interface OrganisationsApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

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

  let region: User['region'] = 'APAC';
  const reg = (raw.region || '').toUpperCase();
  if (reg === 'EMEA' || reg === 'AMERICAS' || reg === 'APAC') {
    region = (reg === 'AMERICAS' ? 'Americas' : reg) as User['region'];
  } else if (raw.defaultSite?.includes('London') || raw.site?.includes('Frankfurt') || raw.site?.includes('London')) {
    region = 'EMEA';
  } else if (raw.defaultSite?.includes('New York') || raw.site?.includes('San Jose')) {
    region = 'Americas';
  }

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

export async function fetchOrganisationUsers(organisationId?: string): Promise<User[]> {
  if (organisationId && organisationId !== 'ALL') {
    try {
      const res = await api.get(`/api/organisations/${encodeURIComponent(organisationId)}/users`);
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      if (list.length > 0) {
        return list.map(normalizeOrganisationUser);
      }
    } catch (err: any) {
      if (err?.statusCode !== 403 && err?.statusCode !== 404) {
        console.warn('[organisationsService] Specific org fetch failed, querying directory endpoint:', err);
      }
    }
  }

  try {
    const res = await api.get('/api/users');
    const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    if (rawList.length > 0) {
      return rawList.map(normalizeOrganisationUser);
    }
  } catch (err: any) {
    logServiceError('organisations.fetchOrganisationUsers', err);
  }

  return MOCK_USERS.map(normalizeOrganisationUser);
}

export async function fetchOrganisationUserById(
  userId: string,
  organisationId?: string
): Promise<User | null> {
  if (organisationId && organisationId !== 'ALL') {
    try {
      const res = await api.get(
        `/api/organisations/${encodeURIComponent(organisationId)}/users/${encodeURIComponent(userId)}`
      );
      const user = res?.data || res;
      if (user && (user.id || user.username)) {
        return normalizeOrganisationUser(user);
      }
    } catch (error) {
      logServiceError('organisations.request', error);
    }
  }

  const res = await api.get(`/api/users/${encodeURIComponent(userId)}`);
  const user = res?.data || res;
  if (user && (user.id || user.username)) {
    return normalizeOrganisationUser(user);
  }

  return null;
}

export async function createOrganisationUser(userData: Partial<User>): Promise<User> {
  const payload = {
    username: userData.username,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    phoneNumber: userData.phone,
    role: userData.role,
    organisationId: userData.defaultOrganisation,
    site: userData.defaultSite,
    region: userData.region,
  };

  const res = await api.post('/api/users', payload);
  const created = res?.data || res;
  return normalizeOrganisationUser(created);
}
