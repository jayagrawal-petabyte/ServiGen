import { apiClient, ApiError } from '../../../services/apiClient';
import type { Ticket } from '../TicketScreen/OnHoldTicketScreen';

export interface BackendOnHoldTicket {
  id: string;
  summary: string;
  priority: string;
  status: string;
  ticketType: string;
  organisation?: string;
  site?: string;
  assignedAgentId?: string;
  slaTimeLeft?: number | null;
  timeRecord?: number;
  holdReason?: string | null;
  holdStartedAt?: string | null;
  holdDuration?: string | null;
  needsEscalation?: boolean;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
}

const STORAGE_KEY_ONHOLD = 'servigen_onhold_tickets_cache_v2';
const STORAGE_KEY_ACTIVE = 'servigen_active_tickets_cache_v2';
const STORAGE_KEY_ACTIONED = 'servigen_actioned_tickets_cache_v2';

export interface QueueCounts {
  active: number;
  onHold: number;
  actioned: number;
  pending: number;
  total: number;
}

export interface CustomListSummary {
  id: string;
  name: string;
  description?: string;
  scope?: string;
}

/**
 * Adapter: Convert Backend Ticket representation to UI Ticket representation
 */
export function adaptBackendTicket(b: BackendOnHoldTicket): Ticket {
  const priorityColorMap: Record<string, 'red' | 'orange' | 'yellow' | 'green'> = {
    Critical: 'red',
    High: 'orange',
    Medium: 'yellow',
    Low: 'green',
  };

  const orgPart = b.organisation || 'consultancy';
  const sitePart = b.site || 'EMEA';
  const agentPart = b.assignedAgentId || '';
  const org = agentPart ? `${orgPart}/${sitePart}/${agentPart}` : `${orgPart}/${sitePart}`;

  const statusLower = b.status?.toLowerCase() || '';
  let status: 'On H' | 'With' | 'New' | 'Actioned' = 'New';
  if (statusLower === 'on hold' || b.status === 'On H') {
    status = 'On H';
  } else if (statusLower === 'actioned' || statusLower === 'closed') {
    status = 'Actioned';
  } else if (statusLower === 'pending' || b.status === 'With') {
    status = 'With';
  } else if (statusLower === 'active' || statusLower === 'new') {
    status = 'New';
  }

  const type: 'Incident' | 'Service Request' =
    b.ticketType?.toLowerCase().includes('service') ? 'Service Request' : 'Incident';

  return {
    id: b.id,
    priority: b.priority || 'Medium',
    priorityColor: priorityColorMap[b.priority] || 'yellow',
    org,
    summary: b.summary,
    status,
    type,
    description: b.description || b.holdReason || b.summary,
    requester: org,
    createdAt: b.createdAt
      ? new Date(b.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Just now',
    targetSla:
      b.slaTimeLeft != null
        ? `${Math.floor(b.slaTimeLeft / 60)}h ${b.slaTimeLeft % 60}m remaining`
        : status === 'On H'
        ? 'On Hold'
        : 'Within 4 hours',
  };
}

/**
 * Cache helpers for local resilience
 */
function getCachedList(key: string): Ticket[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function setCachedList(key: string, tickets: Ticket[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(tickets));
  } catch {
    // ignore
  }
}

export function getCachedOnHoldTickets(): Ticket[] | null {
  return getCachedList(STORAGE_KEY_ONHOLD);
}

export function setCachedOnHoldTickets(tickets: Ticket[]): void {
  setCachedList(STORAGE_KEY_ONHOLD, tickets);
}

/**
 * Fetch all On-Hold tickets from backend GET /api/my-work/on-hold
 */
export async function fetchOnHoldTickets(fallbackTickets: Ticket[]): Promise<Ticket[]> {
  try {
    const response = await apiClient.get<any>('/api/my-work/on-hold');
    const ticketList: BackendOnHoldTicket[] = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];

    if (ticketList.length > 0) {
      const adapted = ticketList.map(adaptBackendTicket);
      setCachedOnHoldTickets(adapted);
      return adapted;
    }

    const cached = getCachedOnHoldTickets();
    return cached || fallbackTickets;
  } catch (error) {
    console.warn('[OnHoldApi] Live on-hold fetch unavailable, falling back to cache:', error);
    const cached = getCachedOnHoldTickets();
    return cached || fallbackTickets;
  }
}

/**
 * Fetch all Active tickets from backend GET /api/my-work/active
 */
export async function fetchActiveTickets(fallbackTickets: Ticket[] = []): Promise<Ticket[]> {
  try {
    const response = await apiClient.get<any>('/api/my-work/active');
    const ticketList: BackendOnHoldTicket[] = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];

    if (ticketList.length > 0) {
      const adapted = ticketList.map(adaptBackendTicket);
      setCachedList(STORAGE_KEY_ACTIVE, adapted);
      return adapted;
    }

    const cached = getCachedList(STORAGE_KEY_ACTIVE);
    return cached || fallbackTickets;
  } catch (error) {
    console.warn('[OnHoldApi] Live active fetch unavailable, falling back to cache:', error);
    const cached = getCachedList(STORAGE_KEY_ACTIVE);
    return cached || fallbackTickets;
  }
}

/**
 * Fetch all Closed/Actioned tickets from backend GET /api/my-work/actioned
 */
export async function fetchClosedTickets(fallbackTickets: Ticket[] = []): Promise<Ticket[]> {
  try {
    const response = await apiClient.get<any>('/api/my-work/actioned');
    const ticketList: BackendOnHoldTicket[] = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];

    if (ticketList.length > 0) {
      const adapted = ticketList.map(adaptBackendTicket);
      setCachedList(STORAGE_KEY_ACTIONED, adapted);
      return adapted;
    }

    const cached = getCachedList(STORAGE_KEY_ACTIONED);
    return cached || fallbackTickets;
  } catch (error) {
    console.warn('[OnHoldApi] Live closed tickets fetch unavailable, falling back to cache:', error);
    const cached = getCachedList(STORAGE_KEY_ACTIONED);
    return cached || fallbackTickets;
  }
}

/**
 * Fetch queue counts from backend GET /api/dashboard/summary
 */
export async function fetchTicketQueueCounts(): Promise<QueueCounts> {
  try {
    const response = await apiClient.get<any>('/api/dashboard/summary');
    const counts = response?.data?.tickets;
    if (counts && typeof counts.active === 'number') {
      return {
        active: counts.active,
        onHold: counts.onHold ?? 0,
        actioned: counts.actioned ?? 0,
        pending: counts.pending ?? 0,
        total: counts.total ?? 0,
      };
    }
    // Fallback: fetch ticket counts directly from /api/my-work endpoints
    const [activeRes, onHoldRes, actionedRes] = await Promise.all([
      apiClient.get<any>('/api/my-work/active').catch(() => null),
      apiClient.get<any>('/api/my-work/on-hold').catch(() => null),
      apiClient.get<any>('/api/my-work/actioned').catch(() => null),
    ]);

    const activeCount = Array.isArray(activeRes?.data) ? activeRes.data.length : Array.isArray(activeRes) ? activeRes.length : 0;
    const onHoldCount = Array.isArray(onHoldRes?.data) ? onHoldRes.data.length : Array.isArray(onHoldRes) ? onHoldRes.length : 0;
    const actionedCount = Array.isArray(actionedRes?.data) ? actionedRes.data.length : Array.isArray(actionedRes) ? actionedRes.length : 0;

    return {
      active: activeCount,
      onHold: onHoldCount,
      actioned: actionedCount,
      pending: onHoldCount,
      total: activeCount + onHoldCount + actionedCount,
    };
  } catch (error) {
    console.warn('[OnHoldApi] Live queue counts unavailable, defaulting to 0:', error);
    return {
      active: 0,
      onHold: 0,
      actioned: 0,
      pending: 0,
      total: 0,
    };
  }
}

/**
 * Fetch saved custom lists from backend GET /api/list-builder/lists
 */
export async function fetchCustomListsSummary(): Promise<CustomListSummary[]> {
  try {
    const response = await apiClient.get<any>('/api/list-builder/lists');
    const lists = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];

    return lists.map((item: any) => ({
      id: item.id || String(Math.random()),
      name: item.name || 'Untitled List',
      description: item.description,
      scope: item.scope,
    }));
  } catch (error) {
    console.warn('[OnHoldApi] Failed to fetch custom lists from backend:', error);
    return [];
  }
}

/**
 * Update ticket status via PATCH /api/my-work/:ticketId/status
 */
export async function updateOnHoldTicketStatus(
  ticketId: string,
  status: 'On Hold' | 'Active' | 'Pending' | 'Actioned',
  holdReason?: string
): Promise<boolean> {
  try {
    await apiClient.patch(`/api/my-work/${encodeURIComponent(ticketId)}/status`, {
      status,
      holdReason: holdReason || (status === 'On Hold' ? 'Customer investigation in progress' : undefined),
    });
    return true;
  } catch (error) {
    console.warn(`[OnHoldApi] Failed to update status on server for ${ticketId}:`, error);
    return false;
  }
}

/**
 * Bulk update ticket status
 */
export async function bulkUpdateTicketStatus(
  ticketIds: string[],
  status: 'On Hold' | 'Active' | 'Pending'
): Promise<void> {
  const promises = ticketIds.map((id) =>
    updateOnHoldTicketStatus(id, status).catch(() => false)
  );
  await Promise.all(promises);
}

/**
 * Create a new ticket in the backend POST /api/my-work
 */
export async function createNewTicket(ticket: Partial<Ticket> & { summary: string }): Promise<Ticket> {
  let createdTicket: Ticket;
  try {
    const payload = {
      id: ticket.id,
      summary: ticket.summary,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status === 'On H' ? 'On Hold' : ticket.status === 'Actioned' ? 'Actioned' : ticket.status === 'With' ? 'Pending' : 'Active',
      type: ticket.type,
      ticketType: ticket.type,
      org: ticket.org,
    };
    const response = await apiClient.post<any>('/api/my-work', payload);
    const backendTicket = response?.data || response;
    if (backendTicket && backendTicket.id) {
      createdTicket = adaptBackendTicket(backendTicket);
    } else {
      throw new Error('No backend ticket returned');
    }
  } catch (err) {
    console.warn('[OnHoldApi] Failed to create ticket on server, falling back to local object:', err);
    createdTicket = {
      id: ticket.id || `TICK-${Date.now()}`,
      priority: ticket.priority || 'Medium',
      priorityColor: (ticket.priorityColor as any) || 'yellow',
      org: ticket.org || 'consultancy/EMEA/Inesh Agarwal',
      summary: ticket.summary,
      status: ticket.status || 'New',
      type: ticket.type || 'Incident',
      description: ticket.description || ticket.summary,
      createdAt: 'Just now',
      targetSla: ticket.status === 'On H' ? 'On Hold' : 'Within 4 hours',
    };
  }

  // Update local cache so switching views or reloading retains the new ticket immediately
  const targetKey = createdTicket.status === 'On H' ? STORAGE_KEY_ONHOLD : STORAGE_KEY_ACTIVE;
  const existingCache = getCachedList(targetKey) || [];
  setCachedList(targetKey, [createdTicket, ...existingCache.filter((t) => t.id !== createdTicket.id)]);

  return createdTicket;
}

/**
 * Bulk update ticket priority on server
 */
export async function bulkUpdateTicketPriority(ticketIds: string[], priority: string): Promise<void> {
  const promises = ticketIds.map((id) =>
    apiClient.patch(`/api/my-work/${encodeURIComponent(id)}`, { priority }).catch(() => false)
  );
  await Promise.all(promises);
}

/**
 * Bulk assign tickets to an agent on server
 */
export async function bulkAssignTickets(ticketIds: string[], assignedAgentId: string): Promise<void> {
  const promises = ticketIds.map((id) =>
    apiClient.patch(`/api/my-work/${encodeURIComponent(id)}`, { assignedAgentId }).catch(() => false)
  );
  await Promise.all(promises);
}

/**
 * Bulk delete tickets on server
 */
export async function bulkDeleteTickets(ticketIds: string[]): Promise<void> {
  const promises = ticketIds.map((id) =>
    apiClient.delete(`/api/my-work/${encodeURIComponent(id)}`).catch(() => false)
  );
  await Promise.all(promises);
}
