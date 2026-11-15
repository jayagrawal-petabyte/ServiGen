/**
 * My Work API Service
 * Connects frontend My Work personal queue and ticket management screens
 * to live /api/my-work backend endpoints with offline fallback resilience.
 */

import { api, logServiceError } from './apiClient';
import { MOCK_MY_WORK_TICKETS, MOCK_TICKETS } from './fallback/mockData';

export type TicketStatus = 'Active' | 'Pending' | 'Actioned' | 'On Hold';

export interface MyWorkBackendTicket {
  id: string;
  summary: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: TicketStatus;
  ticketType: string;
  organisation: string;
  site: string;
  assignedAgentId: string;
  slaTimeLeft: number;
  timeRecord: number;
  holdReason: string | null;
  holdDuration: string | null;
  slaFormatted: string;
  needsEscalation: boolean;
  escalationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MyWorkTicket {
  id: string;
  priority: string;
  organisation: string;
  summary: string;
  timeRecord: string;
  status: TicketStatus | string;
  holdReason?: string | null;
  slaFormatted?: string;
  slaTimeLeft?: number;
  needsEscalation?: boolean;
  assignedAgent?: string;
  assignedAgentId?: string;
  assignedTeam?: string;
  ticketType?: string;
  createdAt?: string;
}

export interface TimeLog {
  id: number;
  date: string;
  duration: string;
  note: string;
}

/**
 * Format minutes into readable "Xh Ym" string
 */
export function formatMinutes(minutes: number | string | undefined | null): string {
  if (minutes == null) return '0m';
  if (typeof minutes === 'string') {
    const trimmed = minutes.trim();
    if (
      trimmed.toLowerCase().includes('nan') ||
      trimmed === '' ||
      trimmed === 'undefined' ||
      trimmed === 'null'
    ) {
      return '0m';
    }
    // Clean string format like "2h 30m", "2h", "45m", "01:30"
    if (
      /^\d+\s*h(\s*\d+\s*m)?$/i.test(trimmed) ||
      /^\d+\s*m$/i.test(trimmed) ||
      /^\d+:\d+$/.test(trimmed)
    ) {
      return trimmed;
    }
    const parsed = parseFloat(trimmed);
    if (isNaN(parsed) || parsed <= 0) return '0m';
    minutes = parsed;
  }
  const num = Number(minutes);
  if (isNaN(num) || num <= 0) return '0m';
  const hours = Math.floor(num / 60);
  const remaining = Math.round(num % 60);
  if (hours > 0 && remaining > 0) return `${hours}h ${remaining}m`;
  if (hours > 0) return `${hours}h`;
  return `${remaining}m`;
}

/**
 * Parse human duration (e.g. "1h 30m", "45m", "2h", "15") into minutes
 */
export function parseDurationToMinutes(durationStr: string): number {
  if (!durationStr || !durationStr.trim()) return 0;
  const str = durationStr.trim().toLowerCase();

  let minutes = 0;
  const hourMatch = str.match(/(\d+)\s*h/);
  if (hourMatch) {
    minutes += parseInt(hourMatch[1], 10) * 60;
  }

  const minMatch = str.match(/(\d+)\s*m/);
  if (minMatch) {
    minutes += parseInt(minMatch[1], 10);
  }

  // If simple numeric string without units
  if (!hourMatch && !minMatch && /^\d+$/.test(str)) {
    minutes = parseInt(str, 10);
  }

  return minutes || 15;
}

/**
 * Map backend priority to frontend "P1 - Critical" label
 */
export function formatPriority(priority: string): string {
  switch (priority?.toLowerCase()) {
    case 'critical':
    case 'p1':
      return 'P1 - Critical';
    case 'high':
    case 'p2':
      return 'P2 - High';
    case 'medium':
    case 'p3':
      return 'P3 - Medium';
    case 'low':
    case 'p4':
      return 'P4 - Low';
    default:
      return priority || 'P3 - Medium';
  }
}

export const myWorkService = {
  /**
   * Fetch personal tickets for current acting agent
   */
  async getMyWorkTickets(filters?: {
    status?: string;
    priority?: string;
    agentId?: string;
  }): Promise<MyWorkTicket[]> {
    try {
      // Do not send agentId — backend resolves it from the JWT token
      const params: Record<string, string | undefined> = {};
      if (filters?.agentId) {
        // Only admins pass an explicit agentId to inspect another agent's queue
        params.agentId = filters.agentId;
      }
      if (filters?.status && filters.status !== 'All') {
        params.status = filters.status;
      }
      if (filters?.priority && filters.priority !== 'All') {
        const rawPriority = filters.priority.replace(/^P\d+\s*-\s*/i, '').trim();
        params.priority = rawPriority;
      }

      const res = await api.get('/api/my-work', { params });
      const ticketList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : null;
      if (ticketList && ticketList.length > 0) {
        return (ticketList as MyWorkBackendTicket[]).map((t) => ({
          id: t.id,
          priority: formatPriority(t.priority),
          organisation: t.organisation || 'ServiGen Internal',
          summary: t.summary,
          timeRecord: formatMinutes(t.timeRecord),
          status: t.status,
          holdReason: t.holdReason,
          slaFormatted: t.slaFormatted,
          slaTimeLeft: t.slaTimeLeft,
          needsEscalation: t.needsEscalation,
        }));
      }
    } catch (error) {
      logServiceError('myWork.getMyWorkTickets', error);
    }

    return MOCK_MY_WORK_TICKETS;
  },

  /**
   * Fetch all tickets across organization (combining /api/tickets and /api/my-work)
   */
  async getAllTickets(): Promise<MyWorkTicket[]> {
    try {
      const res = await api.get('/api/tickets');
      const ticketList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.tickets)
        ? res.tickets
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : null;

      if (ticketList && ticketList.length > 0) {
        const orgTickets: MyWorkTicket[] = ticketList.map((t: any) => ({
          id: t.id,
          priority: formatPriority(t.priority),
          organisation: t.organisation || 'ServiGen Internal',
          summary: t.summary || t.title || 'Untitled Ticket',
          timeRecord: formatMinutes(t.timeRecord || t.timeRecordedMinutes || t.timeRecorded || 0),
          status: t.status || 'Active',
          holdReason: t.holdReason || null,
          slaFormatted:
            t.slaFormatted ||
            (typeof t.slaTimeLeft === 'number' && !isNaN(t.slaTimeLeft)
              ? `${Math.abs(t.slaTimeLeft)}m`
              : 'Within SLA'),
          slaTimeLeft: typeof t.slaTimeLeft === 'number' ? t.slaTimeLeft : 60,
          needsEscalation: Boolean(t.needsEscalation),
          assignedAgent: typeof t.assignedAgent === 'string'
            ? t.assignedAgent
            : t.assignedAgent?.fullName || t.assignedAgent?.name || 'Unassigned',
          assignedAgentId: t.assignedAgentId || t.assignedAgent?.id,
          assignedTeam: t.assignedTeam || '1st Line Support',
          ticketType: t.ticketType || 'Incident',
          createdAt: t.createdAt,
        }));

        try {
          const myTickets = await this.getMyWorkTickets();
          const map = new Map<string, MyWorkTicket>();
          orgTickets.forEach((t) => map.set(t.id, t));
          myTickets.forEach((t) => map.set(t.id, t));
          return Array.from(map.values());
        } catch {
          return orgTickets;
        }
      }
    } catch (error) {
      logServiceError('myWork.getAllTickets', error);
    }

    // Fallback: merge MOCK_TICKETS with MOCK_MY_WORK_TICKETS
    const fallbackOrg: MyWorkTicket[] = (MOCK_TICKETS || []).map((t: any) => ({
      id: t.id,
      priority: formatPriority(t.priority),
      organisation: t.organisation || 'ServiGen Internal',
      summary: t.summary || t.title || 'Untitled Ticket',
      timeRecord: formatMinutes(t.timeRecord || 0),
      status: t.status || 'Active',
      holdReason: t.holdReason || null,
      slaFormatted: t.slaFormatted || 'Within SLA',
      slaTimeLeft: typeof t.slaTimeLeft === 'number' ? t.slaTimeLeft : 60,
      needsEscalation: Boolean(t.needsEscalation),
      assignedAgent: typeof t.assignedAgent === 'string'
        ? t.assignedAgent
        : t.assignedAgent?.fullName || 'Alex Rivera',
      assignedTeam: t.assignedTeam || '1st Line Support',
      ticketType: t.ticketType || 'Incident',
      createdAt: t.createdAt,
    }));

    const map = new Map<string, MyWorkTicket>();
    fallbackOrg.forEach((t) => map.set(t.id, t));
    MOCK_MY_WORK_TICKETS.forEach((t: any) => {
      map.set(t.id, {
        ...t,
        assignedAgent: 'Adam Admin',
        assignedTeam: '1st Line Support',
        ticketType: 'Service Request',
      });
    });
    return Array.from(map.values());
  },

  /**
   * Update ticket status and optional hold reason
   */
  async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    holdReason?: string
  ): Promise<MyWorkTicket | null> {
    try {
      const res = await api.patch(`/api/my-work/${ticketId}/status`, {
        status,
        holdReason: status === 'On Hold' ? holdReason || 'Awaiting third-party response' : null,
      });

      const updateData = res?.data ?? res;
      if (updateData && (updateData as any).id) {
        const t = updateData as MyWorkBackendTicket;
        return {
          id: t.id,
          priority: formatPriority(t.priority),
          organisation: t.organisation,
          summary: t.summary,
          timeRecord: formatMinutes(t.timeRecord),
          status: t.status,
          holdReason: t.holdReason,
          slaFormatted: t.slaFormatted,
          slaTimeLeft: t.slaTimeLeft,
          needsEscalation: t.needsEscalation,
        };
      }
    } catch (error) {
      logServiceError('myWork.updateTicketStatus', error);
      // Fallback
    }

    return null;
  },

  /**
   * Log spent time in minutes against a ticket
   */
  async logTime(
    ticketId: string,
    minutesSpent: number
  ): Promise<MyWorkTicket | null> {
    try {
      const res = await api.post(`/api/my-work/${ticketId}/time`, {
        minutesSpent,
      });

      const logData = res?.data ?? res;
      if (logData && (logData as any).id) {
        const t = logData as MyWorkBackendTicket;
        return {
          id: t.id,
          priority: formatPriority(t.priority),
          organisation: t.organisation,
          summary: t.summary,
          timeRecord: formatMinutes(t.timeRecord),
          status: t.status,
          holdReason: t.holdReason,
          slaFormatted: t.slaFormatted,
          needsEscalation: t.needsEscalation,
        };
      }
    } catch (error) {
      logServiceError('myWork.logTime', error);
      // Fallback
    }

    return null;
  },
};

export default myWorkService;
