/**
 * My Work API Service
 * Connects frontend My Work personal queue and ticket management screens
 * to live /api/my-work backend endpoints with offline fallback resilience.
 */

import { api } from './apiClient';

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
  status: TicketStatus;
  holdReason?: string | null;
  slaFormatted?: string;
  slaTimeLeft?: number;
  needsEscalation?: boolean;
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
export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
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
      const agentId = filters?.agentId || 'agent-001';
      const params: Record<string, string | undefined> = {
        agentId,
      };
      if (filters?.status && filters.status !== 'All') {
        params.status = filters.status;
      }
      if (filters?.priority && filters.priority !== 'All') {
        const rawPriority = filters.priority.replace(/^P\d+\s*-\s*/i, '').trim();
        params.priority = rawPriority;
      }

      const res = await api.get('/api/my-work', { params });
      if (res?.success && Array.isArray(res.data)) {
        return (res.data as MyWorkBackendTicket[]).map((t) => ({
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
    } catch {
      // Backend unavailable or offline fallback
    }

    return [];
  },

  /**
   * Update ticket status and optional hold reason
   */
  async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    holdReason?: string,
    agentId = 'agent-001'
  ): Promise<MyWorkTicket | null> {
    try {
      const res = await api.patch(`/api/my-work/${ticketId}/status`, {
        status,
        holdReason: status === 'On Hold' ? holdReason || 'Awaiting third-party response' : null,
      }, {
        params: { agentId },
      });

      if (res?.success && res.data) {
        const t = res.data as MyWorkBackendTicket;
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
    } catch {
      // Fallback
    }

    return null;
  },

  /**
   * Log spent time in minutes against a ticket
   */
  async logTime(
    ticketId: string,
    minutesSpent: number,
    agentId = 'agent-001'
  ): Promise<MyWorkTicket | null> {
    try {
      const res = await api.post(`/api/my-work/${ticketId}/time`, {
        minutesSpent,
      }, {
        params: { agentId },
      });

      if (res?.success && res.data) {
        const t = res.data as MyWorkBackendTicket;
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
    } catch {
      // Fallback
    }

    return null;
  },
};

export default myWorkService;
