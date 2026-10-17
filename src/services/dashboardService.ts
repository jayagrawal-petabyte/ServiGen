/**
 * Dashboard API Service
 * Connects frontend dashboard components to live /api/dashboard endpoints
 * with fallback resilience for offline / mock testing.
 */

import { api } from './apiClient';
import {
  type DashboardTicket,
  type TeamIncident,
  type CategoryItem,
  DASHBOARD_STATS,
  TEAM_INCIDENTS,
  CATEGORY_DATA,
  DASHBOARD_TICKETS,
  DashboardPriority,
} from '../pages/Dashboard/dashboard.data';
import { MOCK_TICKET_CATALOG } from '../components/TicketDetailModal/ticketDetails.data';

export interface DashboardKpis {
  openIncidents: number;
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
    } catch {
      // Fallback
    }

    return {
      openIncidents: 61,
      slaBreaches: 7,
      avgResolutionTimeMinutes: 185,
      avgResolutionTimeFormatted: '3h 5m',
    };
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
    return TEAM_INCIDENTS;
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
    return CATEGORY_DATA;
  },

  /**
   * Fetch new triage tickets for the dashboard panel
   */
  async getNewTickets(): Promise<DashboardTicket[]> {
    try {
      const res = await api.get('/api/dashboard/new-tickets', { params: { limit: 30 } });
      if (res?.success && Array.isArray(res.data)) {
        return (res.data as BackendTicketItem[]).map((t) => {
          const catalog = MOCK_TICKET_CATALOG[t.id];
          return {
            id: t.id,
            type: catalog?.type || t.ticketType || 'Incident',
            summary: catalog?.summary || t.summary,
            agent: catalog?.agent || 'Unassigned',
            priority: (catalog?.priority || t.priority || 'Medium') as DashboardPriority,
            status: catalog?.status || 'Open',
            requester: catalog?.requester || t.organisation,
            department: catalog?.department,
            category: catalog?.category,
            createdAt: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            description: catalog?.description || `${t.summary} — logged via ${t.organisation}`,
          };
        });
      }
    } catch {
      // Fallback
    }
    return DASHBOARD_TICKETS;
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
