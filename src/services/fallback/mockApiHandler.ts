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
  MOCK_ARTICLES,
  MOCK_ON_HOLD_TICKETS,
  MOCK_ACTIVE_TICKETS,
  MOCK_CLOSED_TICKETS,
  MOCK_CUSTOM_LISTS,
} from './mockData';
import { STAGE_LABELS, StageLabel } from '../majorIncidents.lifecycle';
import type { MajorIncident } from '../../pages/MajorIncidents/types/majorIncident.types';

// In-memory state containers initialized with fixtures
let mutableMajorIncidents: MajorIncident[] = JSON.parse(JSON.stringify(MOCK_MAJOR_INCIDENTS));
let mutableTickets: any[] = JSON.parse(JSON.stringify(MOCK_TICKETS));
let mutableMyWork: any[] = JSON.parse(JSON.stringify(MOCK_MY_WORK_TICKETS));
let mutableApprovals: any[] = JSON.parse(JSON.stringify(MOCK_APPROVALS));
let mutableArticles: any[] = JSON.parse(JSON.stringify(MOCK_ARTICLES));
let mutableOnHoldTickets: any[] = JSON.parse(JSON.stringify(MOCK_ON_HOLD_TICKETS));
let mutableActiveTickets: any[] = JSON.parse(JSON.stringify(MOCK_ACTIVE_TICKETS));
let mutableClosedTickets: any[] = JSON.parse(JSON.stringify(MOCK_CLOSED_TICKETS));
let mutableCustomLists: any[] = JSON.parse(JSON.stringify(MOCK_CUSTOM_LISTS));
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

  // 2. Auth Session & Login
  if (path === '/api/auth/login' || path === '/auth/login') {
    const ident = parsedBody?.username || parsedBody?.email || 'agent001';
    const found =
      MOCK_USERS.find(
        (u) =>
          u.username.toLowerCase() === String(ident).toLowerCase() ||
          u.email.toLowerCase() === String(ident).toLowerCase()
      ) || MOCK_USERS[0];
    const token = `mock_jwt_token_${found.username}_${Date.now()}`;
    return {
      success: true,
      message: 'Login successful',
      token,
      data: {
        ...found,
        token,
      },
    };
  }
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
        assignedTeam: parsedBody?.assignedTeam || '1st Line Support',
        assignedAgent: parsedBody?.assignedAgent || { id: 'USR-001', firstName: 'Alex', lastName: 'Rivera', fullName: 'Alex Rivera' },
        createdAt: new Date().toISOString(),
        description: parsedBody?.description || '',
        slaTimeLeft: 120,
        slaFormatted: '2h SLA',
      };
      mutableTickets = [newTicket, ...mutableTickets];
      return { success: true, data: newTicket };
    }

    let filtered = mutableTickets;
    if (params?.ticketType) {
      filtered = filtered.filter(
        (t) => t.ticketType?.toLowerCase() === String(params.ticketType).toLowerCase()
      );
    }
    if (params?.status) {
      filtered = filtered.filter(
        (t) => t.status?.toLowerCase() === String(params.status).toLowerCase()
      );
    }
    return {
      success: true,
      data: filtered,
      tickets: filtered,
      items: filtered,
      total: filtered.length,
      page: 1,
      totalPages: 1,
    };
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
    // Check support agents endpoints FIRST
    if (path.includes('/agents')) {
      const agents = [
        { id: 'USR-001', firstName: 'Alex', lastName: 'Rivera', email: 'agent001@servigen.local', availability: 'Available' },
        { id: 'USR-002', firstName: 'Sarah', lastName: 'Jenkins', email: 'support001@servigen.local', availability: 'Available' },
        { id: 'USR-004', firstName: 'Marcus', lastName: 'Vance', email: 'marcus.vance@servigen.local', availability: 'Busy' },
        { id: 'USR-005', firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@servigen.local', availability: 'Available' },
      ];
      return {
        success: true,
        agents,
        data: agents,
      };
    }

    if (path.includes('first-line') || path.includes('second-line')) {
      const isSecond = path.includes('second-line');
      const targetTeam = isSecond ? '2nd Line Support' : '1st Line Support';
      const items = mutableTickets.filter(
        (t) => (t.assignedTeam || t.team) === targetTeam || (!t.assignedTeam && !isSecond)
      );
      const formatted = items.map((t) => ({
        ...t,
        ticketId: t.id,
        assignedTeam: targetTeam,
        slaTimeLeft: typeof t.slaTimeLeft === 'number' ? t.slaTimeLeft : 60,
        slaFormatted: t.slaFormatted || '1h SLA',
      }));
      return {
        success: true,
        incidents: formatted,
        data: formatted,
        items: formatted,
        total: formatted.length,
        page: 1,
        totalPages: 1,
      };
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

  // 6. My Work personal queue & On Hold views
  if (path === '/api/my-work') {
    return { success: true, data: mutableMyWork };
  }
  if (path === '/api/my-work/on-hold') {
    return {
      success: true,
      data: mutableOnHoldTickets,
      tickets: mutableOnHoldTickets,
      items: mutableOnHoldTickets,
      pagination: { total: mutableOnHoldTickets.length, page: 1, limit: 50, totalPages: 1 },
    };
  }
  if (path === '/api/my-work/active') {
    return {
      success: true,
      data: mutableActiveTickets,
      tickets: mutableActiveTickets,
      items: mutableActiveTickets,
      pagination: { total: mutableActiveTickets.length, page: 1, limit: 50, totalPages: 1 },
    };
  }
  if (path === '/api/my-work/actioned' || path === '/api/my-work/closed') {
    return {
      success: true,
      data: mutableClosedTickets,
      tickets: mutableClosedTickets,
      items: mutableClosedTickets,
      pagination: { total: mutableClosedTickets.length, page: 1, limit: 50, totalPages: 1 },
    };
  }
  if (path === '/api/my-work/summary') {
    return {
      success: true,
      data: {
        active: mutableActiveTickets.length,
        onHold: mutableOnHoldTickets.length,
        actioned: mutableClosedTickets.length,
        pending: mutableOnHoldTickets.length,
        total: mutableActiveTickets.length + mutableOnHoldTickets.length + mutableClosedTickets.length,
      },
      tickets: {
        active: mutableActiveTickets.length,
        onHold: mutableOnHoldTickets.length,
        actioned: mutableClosedTickets.length,
        pending: mutableOnHoldTickets.length,
      },
    };
  }
  const myWorkStatusMatch = path.match(/^\/api\/my-work\/([^/]+)\/status$/);
  if (myWorkStatusMatch && upperMethod === 'PATCH') {
    const ticketId = myWorkStatusMatch[1];
    const allWork = [...mutableMyWork, ...mutableOnHoldTickets, ...mutableActiveTickets, ...mutableClosedTickets];
    const found = allWork.find((t) => t.id === ticketId);
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

  // 8. Users & Presence & Organisation Users
  if (path.startsWith('/api/organisations/') && path.includes('/users')) {
    return {
      success: true,
      data: MOCK_USERS,
      users: MOCK_USERS,
      items: MOCK_USERS,
    };
  }
  if (path === '/api/users' || path.startsWith('/api/users/')) {
    if (path === '/api/users/presence') {
      if (upperMethod === 'PATCH') {
        currentAgentPresence = parsedBody?.presence || 'available';
        return { success: true, presence: currentAgentPresence };
      }
      return { success: true, presence: currentAgentPresence };
    }
    const singleUserMatch = path.match(/^\/api\/users\/([^/]+)$/);
    if (singleUserMatch) {
      const uId = singleUserMatch[1];
      const found = MOCK_USERS.find((u) => u.id === uId || u.username === uId);
      return { success: true, data: found || MOCK_USERS[0] };
    }
    return {
      success: true,
      data: MOCK_USERS,
      users: MOCK_USERS,
      items: MOCK_USERS,
    };
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

  // 14. Articles & Knowledge Articles
  if (path === '/api/articles' || path === '/api/knowledge/articles' || path === '/api/knowledge') {
    if (upperMethod === 'POST') {
      const newId = `000${3650 + mutableArticles.length + 1}`;
      const newArticle = {
        id: newId,
        title: parsedBody?.title || 'New Knowledge Article',
        content: parsedBody?.content || parsedBody?.body || '',
        category: parsedBody?.category || 'General',
        priority: parsedBody?.priority || 'Medium',
        status: parsedBody?.status || 'Draft',
        approvalStatus: parsedBody?.approvalStatus || 'Draft',
        author: parsedBody?.author || 'Alex Rivera',
        createdAt: new Date().toISOString(),
        slaDueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      };
      mutableArticles = [newArticle, ...mutableArticles];
      return { success: true, data: newArticle };
    }
    return {
      success: true,
      data: mutableArticles,
      items: mutableArticles,
      articles: mutableArticles,
      total: mutableArticles.length,
      page: 1,
      totalPages: 1,
    };
  }

  const singleArticleMatch = path.match(/^\/api\/(?:knowledge\/)?articles\/([^/]+)$/);
  if (singleArticleMatch) {
    const artId = singleArticleMatch[1];
    const found = mutableArticles.find((a) => a.id === artId);
    if (upperMethod === 'PATCH') {
      if (found) {
        if (parsedBody?.title) found.title = parsedBody.title;
        if (parsedBody?.content) found.content = parsedBody.content;
        if (parsedBody?.category) found.category = parsedBody.category;
        if (parsedBody?.priority) found.priority = parsedBody.priority;
        if (parsedBody?.status) found.status = parsedBody.status;
      }
      return { success: true, data: found || { id: artId, ...parsedBody } };
    }
    return { success: true, data: found || mutableArticles[0] };
  }

  // 15. Custom Lists Builder
  if (path === '/api/list-builder/lists' || path === '/api/lists') {
    if (upperMethod === 'POST') {
      const newList = {
        id: `list-${Date.now()}`,
        name: parsedBody?.name || 'New Custom List',
        description: parsedBody?.description || 'Custom filtered list',
        fields: parsedBody?.fields || ['id', 'summary', 'status', 'priority'],
        status: parsedBody?.status || 'Published',
        scope: parsedBody?.scope || 'Tickets (All Areas)',
        group: parsedBody?.group || 'General',
        sequence: parsedBody?.sequence || 30,
        columnProfile: parsedBody?.columnProfile || 'Default',
        displayType: parsedBody?.displayType || 'Default',
        filterCriteria: parsedBody?.filterCriteria || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mutableCustomLists = [newList, ...mutableCustomLists];
      return { success: true, data: newList };
    }
    return {
      success: true,
      data: mutableCustomLists,
      lists: mutableCustomLists,
      items: mutableCustomLists,
    };
  }

  return undefined;
}
