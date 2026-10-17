/**
 * Servigen Team Incidents Service Layer
 * Corresponds to Servigen API Specification (Team Incident Views: 1st Line & 2nd Line Support)
 *
 * Backend Routes (Mounted at /api/incidents):
 * - GET /api/incidents/support/first-line        : List 1st Line Support open incidents
 * - GET /api/incidents/support/first-line/agents : List 1st Line Support agents
 * - GET /api/incidents/support/first-line/:id   : Get 1st Line Support incident details
 * - GET /api/incidents/support/second-line       : List 2nd Line Support open incidents
 * - GET /api/incidents/support/second-line/agents: List 2nd Line Support agents
 * - GET /api/incidents/support/second-line/:id  : Get 2nd Line Support incident details
 * - PATCH /api/tickets/:id/status               : Update ticket status
 */

import { api, type ApiResponse } from './apiClient';
import type { TeamIncident } from '../pages/TeamIncidents/teamIncidents.data';

export interface SupportAgent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  availability: string;
}

export interface SupportIncidentsResponse {
  incidents: TeamIncident[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Normalizes raw backend ticket data to frontend TeamIncident model
 */
export function normalizeSupportIncident(
  raw: any,
  defaultTeam: '1st Line Support' | '2nd Line Support'
): TeamIncident {
  const teamVal: '1st Line Support' | '2nd Line Support' =
    raw.assignedTeam?.toLowerCase().includes('2nd') || raw.team?.toLowerCase().includes('2nd')
      ? '2nd Line Support'
      : defaultTeam;

  let agentName = 'Unassigned';
  if (raw.assignedAgent) {
    agentName = `${raw.assignedAgent.firstName || ''} ${raw.assignedAgent.lastName || ''}`.trim() || 'Demo User';
  } else if (raw.agent && typeof raw.agent === 'string') {
    agentName = raw.agent;
  } else if (raw.assignedAgentId) {
    agentName = raw.assignedAgentId;
  }

  // Format date logged
  let dateFormatted = '24/07/2026';
  if (raw.createdAt) {
    try {
      const d = new Date(raw.createdAt);
      dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      dateFormatted = '24/07/2026';
    }
  }

  const slaStr = raw.slaFormatted || (typeof raw.slaTimeLeft === 'number' ? `${raw.slaTimeLeft}m` : '-64:00');

  return {
    id: String(raw.ticketId || raw.id || ''),
    sla: slaStr,
    summary: raw.summary || 'Incident ticket',
    category: raw.category || 'General Support',
    agent: agentName,
    priority: raw.priority || 'Medium',
    status: raw.status || 'Active',
    type: raw.ticketType || 'Incident',
    team: teamVal,
    isStarred: Boolean(raw.isStarred),
    dateLogged: dateFormatted,
  };
}

/**
 * Fetch team incidents from backend support endpoints
 */
export async function fetchSupportIncidents(
  teamName: '1st Line Support' | '2nd Line Support',
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
  }
): Promise<SupportIncidentsResponse> {
  const isSecondLine = teamName.toLowerCase().includes('2nd');
  const endpoint = isSecondLine
    ? '/api/incidents/support/second-line'
    : '/api/incidents/support/first-line';

  const queryParams: Record<string, string | number> = {};
  if (params?.page) queryParams.page = params.page;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.status) queryParams.status = params.status;
  if (params?.priority) queryParams.priority = params.priority;
  if (params?.search) queryParams.search = params.search;

  try {
    const res = await api.get(endpoint, { params: queryParams });
    const payload = res?.data || res;
    const rawList = Array.isArray(payload?.incidents) ? payload.incidents : Array.isArray(payload) ? payload : [];

    const normalized = rawList.map((item: any) => normalizeSupportIncident(item, teamName));

    return {
      incidents: normalized,
      total: typeof payload?.total === 'number' ? payload.total : normalized.length,
      page: typeof payload?.page === 'number' ? payload.page : 1,
      totalPages: typeof payload?.totalPages === 'number' ? payload.totalPages : 1,
    };
  } catch (err) {
    console.warn(`[teamIncidentsService] Failed to fetch incidents from ${endpoint}:`, err);
    return {
      incidents: [],
      total: 0,
      page: 1,
      totalPages: 1,
    };
  }
}

/**
 * Fetch assigned support team agents from backend API
 */
export async function fetchSupportAgents(
  teamName: '1st Line Support' | '2nd Line Support'
): Promise<SupportAgent[]> {
  const isSecondLine = teamName.toLowerCase().includes('2nd');
  const endpoint = isSecondLine
    ? '/api/incidents/support/second-line/agents'
    : '/api/incidents/support/first-line/agents';

  try {
    const res = await api.get(endpoint);
    const payload = res?.data || res;
    const rawAgents = Array.isArray(payload?.agents) ? payload.agents : Array.isArray(payload) ? payload : [];
    return rawAgents.map((a: any) => ({
      id: a.id || '',
      firstName: a.firstName || '',
      lastName: a.lastName || '',
      email: a.email || '',
      availability: a.availability || 'Available',
    }));
  } catch (err) {
    console.warn(`[teamIncidentsService] Failed to fetch agents from ${endpoint}:`, err);
    return [];
  }
}

/**
 * Update ticket status via PATCH /api/tickets/:id/status
 */
export async function updateSupportIncidentStatus(
  ticketId: string,
  status: string,
  holdReason?: string
): Promise<boolean> {
  try {
    await api.patch(`/api/tickets/${encodeURIComponent(ticketId)}/status`, {
      status,
      holdReason,
    });
    return true;
  } catch (err) {
    console.warn(`[teamIncidentsService] PATCH status for ${ticketId} failed:`, err);
    return false;
  }
}
