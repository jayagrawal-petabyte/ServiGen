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
  pendingApprovals?: number;
  myAssignments?: number;
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
      const kpiData = res?.data ?? res;
      if (kpiData && typeof kpiData === 'object' && !Array.isArray(kpiData)) {
        return kpiData as DashboardKpis;
      }
      throw new Error('Failed to retrieve dashboard KPIs');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mood value translation between frontend display labels and backend model enums
   */
  moodToBackend(mood: string): string {
    const map: Record<string, string> = {
      'Great': 'Great',
      'Good': 'Good',
      'Okay': 'Neutral',
      'Not Good': 'Struggling',
      'Stressed': 'Overwhelmed',
      'Neutral': 'Neutral',
      'Struggling': 'Struggling',
      'Overwhelmed': 'Overwhelmed',
    };
    return map[mood] || mood;
  },

  moodToFrontend(mood: string): string {
    const map: Record<string, string> = {
      'Great': 'Great',
      'Good': 'Good',
      'Neutral': 'Okay',
      'Struggling': 'Not Good',
      'Overwhelmed': 'Stressed',
      'Okay': 'Okay',
      'Not Good': 'Not Good',
      'Stressed': 'Stressed',
    };
    return map[mood] || mood;
  },

  /**
   * Fetch agent mood check-in
   */
  async getMood(): Promise<string | null> {
    try {
      const res = await api.get('/api/dashboard/mood');
      const moodData = res?.data ?? res;
      if (moodData) {
        const raw = (moodData as any).mood || (typeof moodData === 'string' ? moodData : null);
        if (typeof raw === 'string') {
          return dashboardService.moodToFrontend(raw);
        }
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
      const backendMood = dashboardService.moodToBackend(mood);
      const res = await api.post('/api/dashboard/mood', { mood: backendMood });
      return res?.success === true || res?.status === 'ok' || !!(res?.data ?? res);
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
      const teamData = res?.data ?? res;
      if (Array.isArray(teamData)) {
        return (teamData as BackendTeamIncident[]).map((t) => ({
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
      const catData = res?.data ?? res;
      if (Array.isArray(catData)) {
        return (catData as BackendCategoryItem[]).map((c) => ({
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
      const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
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
      const summaryData = res?.data ?? res;
      if (summaryData && typeof summaryData === 'object' && !Array.isArray(summaryData)) {
        return summaryData as DashboardSummary;
      }
    } catch {
      // Fallback
    }
    return null;
  },
};

export default dashboardService;
