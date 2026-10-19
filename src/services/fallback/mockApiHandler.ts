/**
 * ServiGen Offline Mock API Handler
 * Intercepts requests when the backend (Render) is offline, sleeping, or returning 5xx errors.
 * Provides realistic in-memory state mutations (stage updates, feed updates, ticket status, time logs)
 * so the frontend behaves as a fully functional, self-sufficient application for demos.
 */

import {
  MOCK_KPIS,
  MOCK_SUMMARY,
  MOCK_TEAM_INCIDENTS,
  MOCK_CATEGORY_INCIDENTS,
  MOCK_TICKETS,
  MOCK_MAJOR_INCIDENTS,
  MOCK_MY_WORK_TICKETS,
  MOCK_APPROVALS,
  MOCK_USERS,
  MOCK_PROJECTS,
  MOCK_CHANGE_REQUESTS,
  MOCK_CONFIG_ITEMS,
  MOCK_SERVICES,
  MOCK_CALENDAR_EVENTS,
} from './mockData';
import { STAGE_LABELS, StageLabel } from '../majorIncidents.lifecycle';
import type { MajorIncident } from '../../pages/MajorIncidents/types/majorIncident.types';

// In-memory state containers initialized with fixtures
let mutableMajorIncidents: MajorIncident[] = JSON.parse(JSON.stringify(MOCK_MAJOR_INCIDENTS));
let mutableTickets: any[] = JSON.parse(JSON.stringify(MOCK_TICKETS));
let mutableMyWork: any[] = JSON.parse(JSON.stringify(MOCK_MY_WORK_TICKETS));
let mutableApprovals: any[] = JSON.parse(JSON.stringify(MOCK_APPROVALS));
let currentAgentMood = 'Good';
let currentAgentPresence = 'available';

/**
 * Normalise any endpoint path by removing query strings and standardizing slashes
 */
function cleanPath(endpoint: string): string {
  const noQuery = endpoint.split('?')[0].trim();
  return noQuery.startsWith('/') ? noQuery : `/${noQuery}`;
}

/**
 * Handle offline / mock API requests
 * Returns the mocked payload if the route is recognized, or undefined if unknown.
 */
export function handleOfflineRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  params?: Record<string, any>
): any | undefined {
  const path = cleanPath(endpoint);
  const upperMethod = (method || 'GET').toUpperCase();

  // Parse body if it's a string
  let parsedBody = body;
  if (typeof body === 'string') {
    try {
      parsedBody = JSON.parse(body);
    } catch {
      parsedBody = {};
    }
  }

  // 1. Health & Status
  if (path === '/api/health' || path === '/health') {
    return { success: true, status: 'ok', mode: 'offline-demo', connected: false };
  }
  if (path === '/api/health/db') {
    return {
      reachable: true,
      connected: false,
      readFallbackEnabled: true,
      writeFallbackEnabled: true,
      mockFallbackEnabled: true,
      env: 'demo',
      counts: { tickets: mutableTickets.length, majorIncidents: mutableMajorIncidents.length },
    };
  }

  // 2. Auth Session
  if (path === '/api/auth/session') {
    return {
      success: true,
      data: MOCK_USERS[0],
    };
  }
  if (path === '/api/auth/refresh') {
    return {
      success: true,
      data: {
        token: `mock_jwt_token_${Date.now()}`,
        user: MOCK_USERS[0],
      },
    };
  }

  // 3. Dashboard KPIs & Summary
  if (path === '/api/dashboard/kpis') {
    return {
      success: true,
      data: {
        ...MOCK_KPIS,
        openIncidents: mutableTickets.filter((t) => t.status === 'Active' || t.status === 'Open').length,
        majorIncidents: mutableMajorIncidents.filter((m) => {
          const last = m.lifecycleStages[m.lifecycleStages.length - 1];
          return !last?.isActive && !last?.isCompleted;
        }).length,
      },
    };
  }
  if (path === '/api/dashboard/summary') {
    return {
      success: true,
      data: MOCK_SUMMARY,
    };
  }
  if (path === '/api/dashboard/mood') {
    if (upperMethod === 'POST') {
      currentAgentMood = parsedBody?.mood || 'Good';
      return { success: true, mood: currentAgentMood };
    }
    return { success: true, data: { mood: currentAgentMood } };
  }
  if (path === '/api/dashboard/incidents-by-team') {
    return { success: true, data: MOCK_TEAM_INCIDENTS };
  }
  if (path === '/api/dashboard/incidents-by-category') {
    return { success: true, data: MOCK_CATEGORY_INCIDENTS };
  }
  if (path === '/api/dashboard/new-tickets') {
    return { success: true, data: mutableTickets };
  }

  // 4. Tickets & Incidents
  if (path === '/api/tickets' || path === '/api/incidents') {
    if (upperMethod === 'POST') {
      const newId = `INC-2024-${String(mutableTickets.length + 1).padStart(3, '0')}`;
      const newTicket = {
        id: newId,
        ticketType: parsedBody?.ticketType || 'Incident',
        summary: parsedBody?.summary || parsedBody?.title || 'New Incident',
        priority: parsedBody?.priority || 'Medium',
        status: 'Active',
        organisation: parsedBody?.organisation || 'Petabyte Corp',
        category: parsedBody?.category || 'Software & Applications',
        assignedAgent: parsedBody?.assignedAgent || { firstName: 'Alex', lastName: 'Rivera' },
        createdAt: new Date().toISOString(),
        description: parsedBody?.description || '',
        slaTimeLeft: 120,
        slaFormatted: '2h SLA',
      };
      mutableTickets = [newTicket, ...mutableTickets];
      return { success: true, data: newTicket };
    }
    return { success: true, data: mutableTickets };
  }

  // Ticket status PATCH: /api/tickets/:id/status
  const ticketStatusMatch = path.match(/^\/api\/tickets\/([^/]+)\/status$/);
  if (ticketStatusMatch && upperMethod === 'PATCH') {
    const ticketId = ticketStatusMatch[1];
    const newStatus = parsedBody?.status || 'Active';
    const found = mutableTickets.find((t) => t.id === ticketId);
    if (found) {
      found.status = newStatus;
    }
    return { success: true, data: { id: ticketId, status: newStatus } };
  }

  // Specific incident sub-routes
  if (path.startsWith('/api/incidents/')) {
    if (path.includes('first-line')) {
      return { success: true, data: mutableTickets.slice(0, 4) };
    }
    if (path.includes('second-line')) {
      return { success: true, data: mutableTickets.slice(4, 8) };
    }
    if (path.includes('analytics/priority')) {
      return {
        success: true,
        data: [
          { priority: 'Critical', count: 3 },
          { priority: 'High', count: 5 },
          { priority: 'Medium', count: 8 },
          { priority: 'Low', count: 2 },
        ],
      };
    }
    if (path.includes('analytics/category')) {
      return { success: true, data: MOCK_CATEGORY_INCIDENTS };
    }
    if (path.includes('recent') || path.includes('new')) {
      return { success: true, data: mutableTickets.slice(0, 5), items: mutableTickets.slice(0, 5) };
    }
  }

  // 5. Major Incidents with 6-stage lifecycle
  if (path === '/api/major-incidents') {
    if (upperMethod === 'POST') {
      const newId = `MI-${1000 + mutableMajorIncidents.length + 1}`;
      const activeIdx = 0; // Starts at 'Started'
      const newMI: MajorIncident = {
        id: newId,
        title: parsedBody?.title || 'New Major Incident',
        priority: parsedBody?.priority || 'High',
        product: parsedBody?.product || 'Core Infrastructure',
        resolutionTarget: parsedBody?.resolutionTarget || '0d 4h 0m',
        responseTarget: '15m SLA',
        assignee: parsedBody?.assignee || 'Alex Rivera',
        lifecycleStages: STAGE_LABELS.map((label, idx) => ({
          label,
          isActive: idx === activeIdx,
          isCompleted: false,
          timestamp: idx === activeIdx ? new Date().toISOString() : undefined,
        })),
        startedAt: new Date().toISOString(),
        updates: [
          {
            id: `${newId}-U1`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: 'Alex Rivera',
            authorRole: 'Admin',
            type: 'comment',
            content: parsedBody?.description || 'Incident declared.',
          },
        ],
      };
      mutableMajorIncidents = [newMI, ...mutableMajorIncidents];
      return { success: true, data: newMI };
    }
    return { success: true, data: mutableMajorIncidents };
  }

  // Single Major Incident: /api/major-incidents/:id
  const miMatch = path.match(/^\/api\/major-incidents\/([^/]+)$/);
  if (miMatch) {
    const miId = miMatch[1];
    const incident = mutableMajorIncidents.find((m) => m.id === miId);

    if (upperMethod === 'GET') {
      return { success: true, data: incident || mutableMajorIncidents[0] };
    }

    if (upperMethod === 'PATCH') {
      if (incident) {
        // If status or stage was updated
        if (parsedBody?.status) {
          const nextStatus = parsedBody.status as StageLabel;
          const stageIdx = STAGE_LABELS.indexOf(nextStatus);
          if (stageIdx >= 0) {
            incident.lifecycleStages = STAGE_LABELS.map((label, idx) => ({
              label,
              isActive: idx === stageIdx,
              isCompleted: idx < stageIdx,
              timestamp: idx <= stageIdx ? new Date().toISOString() : undefined,
            }));
          }
        }
        if (parsedBody?.priority) incident.priority = parsedBody.priority;
        if (parsedBody?.assignee) incident.assignee = parsedBody.assignee;
      }
      return { success: true, data: incident || { id: miId, ...parsedBody } };
    }
  }

  // Major Incident Updates / Feed: /api/major-incidents/:id/updates
  const miUpdatesMatch = path.match(/^\/api\/major-incidents\/([^/]+)\/updates$/);
  if (miUpdatesMatch && upperMethod === 'POST') {
    const miId = miUpdatesMatch[1];
    const incident = mutableMajorIncidents.find((m) => m.id === miId);
    const newUpdate = {
      id: `${miId}-U${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: parsedBody?.author || 'Alex Rivera',
      authorRole: parsedBody?.authorRole || 'Admin',
      type: parsedBody?.type || 'comment',
      content: parsedBody?.content || '',
    };
    if (incident) {
      incident.updates = [...(incident.updates || []), newUpdate];
    }
    return { success: true, data: newUpdate };
  }

  // 6. My Work personal queue
  if (path === '/api/my-work') {
    return { success: true, data: mutableMyWork };
  }
  const myWorkStatusMatch = path.match(/^\/api\/my-work\/([^/]+)\/status$/);
  if (myWorkStatusMatch && upperMethod === 'PATCH') {
    const ticketId = myWorkStatusMatch[1];
    const found = mutableMyWork.find((t) => t.id === ticketId);
    if (found) {
      if (parsedBody?.status) found.status = parsedBody.status;
      if (parsedBody?.holdReason !== undefined) found.holdReason = parsedBody.holdReason;
    }
    return { success: true, data: { id: ticketId, ...parsedBody } };
  }
  const myWorkTimeMatch = path.match(/^\/api\/my-work\/([^/]+)\/time$/);
  if (myWorkTimeMatch && upperMethod === 'POST') {
    const ticketId = myWorkTimeMatch[1];
    return { success: true, data: { id: ticketId, logged: true } };
  }

  // 7. Approvals
  if (path === '/api/approvals') {
    return { success: true, data: mutableApprovals };
  }

  // 8. Users & Presence
  if (path === '/api/users') {
    return { success: true, data: MOCK_USERS };
  }
  if (path === '/api/users/presence') {
    if (upperMethod === 'PATCH') {
      currentAgentPresence = parsedBody?.presence || 'available';
      return { success: true, presence: currentAgentPresence };
    }
    return { success: true, presence: currentAgentPresence };
  }

  // 9. Calendar
  if (path === '/api/calendar') {
    return { success: true, data: MOCK_CALENDAR_EVENTS };
  }

  // 10. Projects
  if (path === '/api/projects' || path === '/api/projects/active') {
    return { success: true, data: MOCK_PROJECTS };
  }

  // 11. Change Requests
  if (path === '/api/change-requests' || path === '/api/change-requests/active') {
    return { success: true, data: MOCK_CHANGE_REQUESTS };
  }

  // 12. CMDB
  if (path.startsWith('/api/cmdb')) {
    return { success: true, data: MOCK_CONFIG_ITEMS };
  }

  // 13. Services Catalogue
  if (path === '/api/services' || path === '/api/services/categories') {
    return { success: true, data: MOCK_SERVICES };
  }

  return undefined;
}
