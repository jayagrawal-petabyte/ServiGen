/**
 * Dashboard API Service
 * Connects frontend dashboard components to live /api/dashboard endpoints
 * with fallback resilience for offline / mock testing.
 */

import { api } from './apiClient';
import type {
  DashboardTicket,
  TeamIncident,
  CategoryItem,
  DashboardPriority,
} from '../pages/Dashboard/dashboard.data';

export interface DashboardKpis {
  openIncidents: number;
  resolvedIncidents?: number;
  majorIncidents?: number;
  unassignedIncidents?: number;
  avgResponseTimeMinutes?: number;
  avgResponseTimeHours?: string;
  slaBreaches: number;
  avgResolutionTimeMinutes: number;
  lastUpdatedAt?: string;
  avgResolutionTimeFormatted: string;
}

export interface DashboardSummary {
  tickets: {
    active: number;
    pending: number;
    actioned: number;
    onHold: number;
    total: number;
  };
  approvals: {
    pending: number;
  };
  assignments: {
    total: number;
  };
  tasks: {
    total: number;
  };
}

export interface BackendTeamIncident {
  team: string;
  openIncidents: number;
  slaBreach?: number;
}

export interface BackendCategoryItem {
  category: string;
  count: number;
}

export interface BackendTicketItem {
  id: string;
  summary: string;
  priority: string;
  ticketType: string;
  organisation: string;
  createdAt?: string;
  assignedAgent?: string | { firstName?: string; lastName?: string };
  status?: string;
  category?: string;
  description?: string;
}

export const dashboardService = {
  /**
   * Fetch aggregated live KPIs
   */
  async getKpis(): Promise<DashboardKpis> {
    try {
      const res = await api.get('/api/dashboard/kpis');
      if (res?.success && res.data) {
        return res.data as DashboardKpis;
      }
      throw new Error('Failed to retrieve dashboard KPIs');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch agent mood check-in
   */
  async getMood(): Promise<string | null> {
    try {
      const res = await api.get('/api/dashboard/mood');
      if (res?.success && res.data) {
        return res.data.mood || null;
      }
    } catch {
      // Fallback
    }
    return null;
  },

  /**
   * Submit agent mood check-in
   */
  async submitMood(mood: string): Promise<boolean> {
    try {
      const res = await api.post('/api/dashboard/mood', { mood });
      return res?.success === true;
    } catch {
      return false;
    }
  },

  /**
   * Fetch incidents grouped by team
   */
  async getIncidentsByTeam(): Promise<TeamIncident[]> {
    try {
      const res = await api.get('/api/dashboard/incidents-by-team');
      if (res?.success && Array.isArray(res.data)) {
        return (res.data as BackendTeamIncident[]).map((t) => ({
          label: t.team,
          value: t.openIncidents,
        }));
      }
    } catch {
      // Fallback
    }
    return [];
  },

  /**
   * Fetch incidents grouped by category
   */
  async getIncidentsByCategory(): Promise<CategoryItem[]> {
    try {
      const res = await api.get('/api/dashboard/incidents-by-category');
      if (res?.success && Array.isArray(res.data)) {
        return (res.data as BackendCategoryItem[]).map((c) => ({
          label: c.category,
          value: c.count,
          displayValue: true,
        }));
      }
    } catch {
      // Fallback
    }
    return [];
  },

  /**
   * Fetch new triage tickets for the dashboard panel
   */
  async getNewTickets(): Promise<DashboardTicket[]> {
    try {
      const res = await api.get('/api/dashboard/new-tickets', { params: { limit: 30 } });
      const rawList = res?.success && Array.isArray(res.data) ? res.data : [];
      if (rawList.length > 0) {
        return (rawList as BackendTicketItem[]).map((t) => {
          let agentName = 'Unassigned';
          if (typeof t.assignedAgent === 'string') {
            agentName = t.assignedAgent;
          } else if (t.assignedAgent && typeof t.assignedAgent === 'object') {
            agentName = `${t.assignedAgent.firstName || ''} ${t.assignedAgent.lastName || ''}`.trim() || 'Unassigned';
          }

          return {
            id: t.id,
            type: t.ticketType || 'Incident',
            summary: t.summary || 'New ticket',
            agent: agentName,
            priority: (t.priority || 'Medium') as DashboardPriority,
            status: t.status || 'Open',
            requester: t.organisation || 'ServiGen Portal',
            category: t.category,
            createdAt: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            description: t.description || `${t.summary} — logged via ${t.organisation || 'portal'}`,
          };
        });
      }

      // Try /api/incidents/new as fallback
      const incRes: any = await api.get('/api/incidents/new', { params: { limit: 10 } });
      const incItems = Array.isArray(incRes?.data?.items) ? incRes.data.items : Array.isArray(incRes?.items) ? incRes.items : [];
      if (incItems.length > 0) {
        return incItems.map((inc: any) => ({
          id: inc.id,
          type: inc.ticketType || 'Incident',
          summary: inc.summary || 'Incident ticket',
          agent: inc.agent || 'Unassigned',
          priority: (inc.priority || 'Medium') as DashboardPriority,
          status: inc.status || 'Active',
          requester: inc.organisation || 'Corporate',
          category: inc.category,
          createdAt: inc.createdAt ? new Date(inc.createdAt).toLocaleDateString('en-GB') : 'Today',
          description: inc.description || inc.summary,
        }));
      }
    } catch {
      // Fallback
    }
    return [];
  },

  /**
   * Fetch agent personalized summary metrics
   */
  async getSummary(): Promise<DashboardSummary | null> {
    try {
      const res = await api.get('/api/dashboard/summary');
      if (res?.success && res.data) {
        return res.data as DashboardSummary;
      }
    } catch {
      // Fallback
    }
    return null;
  },
};

export default dashboardService;
