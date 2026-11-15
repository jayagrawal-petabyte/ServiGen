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
  MOCK_CONTRACTS,
  MOCK_PROBLEMS,
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
let mutableConfigItems: any[] = JSON.parse(JSON.stringify(MOCK_CONFIG_ITEMS));
let mutableProjects: any[] = JSON.parse(JSON.stringify(MOCK_PROJECTS));
let mutableContracts: any[] = JSON.parse(JSON.stringify(MOCK_CONTRACTS));
let mutableProblems: any[] = JSON.parse(JSON.stringify(MOCK_PROBLEMS));
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

  // Ticket resolve POST: /api/tickets/:id/resolve
  const ticketResolveMatch = path.match(/^\/api\/tickets\/([^/]+)\/resolve$/);
  if (ticketResolveMatch && upperMethod === 'POST') {
    const ticketId = decodeURIComponent(ticketResolveMatch[1]);
    const found = mutableTickets.find((t) => t.id === ticketId);
    if (found) {
      found.status = 'Resolved';
      (found as any).resolutionCode = parsedBody?.resolutionCode || 'Resolved by First Line Support';
      (found as any).resolutionNotes = parsedBody?.resolutionNotes || '';
      (found as any).rootCauseSummary = parsedBody?.rootCauseSummary || '';
      (found as any).resolvedAt = new Date().toISOString();
    }
    return {
      success: true,
      message: 'Incident resolved successfully',
      data: found || {
        id: ticketId,
        status: 'Resolved',
        ...parsedBody,
        resolvedAt: new Date().toISOString(),
      },
    };
  }

  // Ticket mutations used by the Incidents page and detail modal.
  const ticketAssignMatch = path.match(/^\/api\/tickets\/([^/]+)\/assign$/);
  if (ticketAssignMatch && upperMethod === 'PATCH') {
    const ticketId = decodeURIComponent(ticketAssignMatch[1]);
    const found = mutableTickets.find((t) => t.id === ticketId);
    const agentName = parsedBody?.agentName || parsedBody?.agent || parsedBody?.agentId || 'Unassigned';
    if (found) {
      found.agent = agentName;
      found.assignedAgent = typeof agentName === 'string'
        ? { id: parsedBody?.agentId || agentName, fullName: agentName }
        : agentName;
    }
    return { success: true, data: { id: ticketId, agent: agentName } };
  }

  const ticketMutationMatch = path.match(/^\/api\/tickets\/([^/]+)$/);
  if (ticketMutationMatch && upperMethod === 'PATCH') {
    const ticketId = decodeURIComponent(ticketMutationMatch[1]);
    const found = mutableTickets.find((t) => t.id === ticketId);
    if (found) {
      Object.assign(found, parsedBody || {});
      if (parsedBody?.priority) found.priority = parsedBody.priority;
      if (parsedBody?.responseTargetMet !== undefined) found.responseTargetMet = parsedBody.responseTargetMet;
      if (parsedBody?.resolutionTargetMet !== undefined) found.resolutionTargetMet = parsedBody.resolutionTargetMet;
    }
    return { success: true, data: { id: ticketId, ...(parsedBody || {}) } };
  }

  if (path.match(/^\/api\/tickets\/[^/]+\/(email|supplier)$/) && upperMethod === 'POST') {
    return { success: true, data: { ...parsedBody, recorded: true } };
  }

  if (path.match(/^\/api\/tickets\/[^/]+\/related$/) && upperMethod === 'GET') {
    return { success: true, data: [] };
  }

  if (path === '/api/ai-core/escalation/handoff' && upperMethod === 'POST') {
    return { success: true, data: { id: `HANDOFF-${Date.now()}`, ...parsedBody } };
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
        if (parsedBody?.priority) {
          incident.priority = parsedBody.priority === 'P1' ? 'Critical' : parsedBody.priority === 'P2' ? 'High' : parsedBody.priority;
        }
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
      content: parsedBody?.content || parsedBody?.message || '',
    };
    if (incident) {
      incident.updates = [newUpdate, ...(incident.updates || [])];
      return { success: true, data: incident };
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
    if (upperMethod === 'POST') {
      const event = { id: `CAL-${Date.now()}`, ...parsedBody };
      MOCK_CALENDAR_EVENTS.unshift(event);
      return { success: true, data: event };
    }
    return { success: true, data: MOCK_CALENDAR_EVENTS };
  }

  // 10. Projects
  if (path === '/api/projects' || path === '/api/projects/active') {
    if (upperMethod === 'POST') {
      const generatedId = `PRJ-${Math.floor(100 + Math.random() * 900)}`;
      const newProj = {
        id: generatedId,
        projectId: generatedId,
        name: parsedBody?.name || parsedBody?.title || 'New Project',
        title: parsedBody?.name || parsedBody?.title || 'New Project',
        description: parsedBody?.description || '',
        owner: parsedBody?.owner || 'Alex Rivera',
        status: parsedBody?.status || 'Active',
        statusLabel: parsedBody?.status || 'Active',
        priority: parsedBody?.priority || 'Medium',
        startDate: parsedBody?.startDate || new Date().toISOString().slice(0, 10),
        targetDate: parsedBody?.targetDate || parsedBody?.targetEndDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        targetEndDate: parsedBody?.targetDate || parsedBody?.targetEndDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        hoursSpent: 0,
        hoursBudget: parsedBody?.hoursBudget || 100,
        completionPercent: 0,
        tasks: [],
        subtasks: [],
      };
      mutableProjects = [newProj, ...mutableProjects];
      return { success: true, data: newProj };
    }
    return { success: true, data: mutableProjects };
  }

  const projSubtaskItemMatch = path.match(/^\/api\/projects\/([^/]+)\/subtasks\/([^/]+)$/);
  if (projSubtaskItemMatch) {
    const pId = decodeURIComponent(projSubtaskItemMatch[1]);
    const tId = decodeURIComponent(projSubtaskItemMatch[2]);
    const p = mutableProjects.find((x: any) => x.id === pId);
    if (p) {
      p.tasks = p.tasks || [];
      const tIdx = p.tasks.findIndex((t: any) => t.id === tId);
      if (tIdx !== -1) {
        p.tasks[tIdx] = { ...p.tasks[tIdx], ...parsedBody };
        return { success: true, data: p.tasks[tIdx] };
      }
    }
    return { success: true, data: { id: tId, ...parsedBody } };
  }

  const projSubtasksMatch = path.match(/^\/api\/projects\/([^/]+)\/subtasks$/);
  if (projSubtasksMatch) {
    const pId = decodeURIComponent(projSubtasksMatch[1]);
    const p = mutableProjects.find((x: any) => x.id === pId);
    if (upperMethod === 'POST') {
      const newTask = {
        id: `TSK-${Date.now()}`,
        title: parsedBody?.title || 'New Subtask',
        assignee: parsedBody?.assignee || 'Unassigned',
        dueDate: parsedBody?.dueDate || new Date().toISOString().slice(0, 10),
        done: Boolean(parsedBody?.done),
      };
      if (p) {
        p.tasks = p.tasks || [];
        p.tasks.push(newTask);
      }
      return { success: true, data: newTask };
    }
    return { success: true, data: p?.tasks || [] };
  }

  const singleProjMatch = path.match(/^\/api\/projects\/([^/]+)$/);
  if (singleProjMatch) {
    const pId = decodeURIComponent(singleProjMatch[1]);
    const pIdx = mutableProjects.findIndex((x: any) => x.id === pId);
    if (upperMethod === 'PATCH') {
      if (pIdx !== -1) {
        mutableProjects[pIdx] = {
          ...mutableProjects[pIdx],
          ...parsedBody,
          ...(parsedBody?.name ? { title: parsedBody.name } : {}),
        };
        return { success: true, data: mutableProjects[pIdx] };
      }
      return { success: true, data: { id: pId, ...parsedBody } };
    }
    return { success: true, data: pIdx !== -1 ? mutableProjects[pIdx] : mutableProjects[0] };
  }

  // 11. Change Requests
  if (path === '/api/change-requests' || path === '/api/change-requests/active') {
    return { success: true, data: MOCK_CHANGE_REQUESTS };
  }

  // 12. CMDB
  if (path.startsWith('/api/cmdb')) {
    if (path === '/api/cmdb/configuration-items' && upperMethod === 'POST') {
      const generatedId = parsedBody?.id || `CI-${Math.floor(1000 + Math.random() * 9000)}`;
      const prefix = (parsedBody?.type || 'SRV').slice(0, 3).toUpperCase();
      const generatedTag = parsedBody?.tag || `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
      const newCi = {
        id: generatedId,
        tag: generatedTag,
        name: parsedBody?.name || 'New Configuration Item',
        type: parsedBody?.type || 'Server',
        site: parsedBody?.site || 'London Primary DC (Lon-01)',
        status: parsedBody?.status || 'Active',
        lifecycleState: parsedBody?.lifecycleState || 'Deployed',
        businessOwner: parsedBody?.businessOwner || 'Technology',
        technicalContact: parsedBody?.technicalContact || 'Platform Operations',
        environment: parsedBody?.environment || 'Production',
        ipAddress: parsedBody?.ipAddress || parsedBody?.specifications?.ipAddress || undefined,
        activeIncidentsCount: 0,
        linkedChangesCount: 0,
        lastUpdated: 'Just now',
        criticality: parsedBody?.criticality || 'Tier 2 - Business Operational',
        specifications: parsedBody?.specifications || {},
        relationships: Array.isArray(parsedBody?.relationships) ? parsedBody.relationships : [],
        softwareLicenses: Array.isArray(parsedBody?.softwareLicenses) ? parsedBody.softwareLicenses : [],
      };
      mutableConfigItems = [newCi, ...mutableConfigItems];
      return { success: true, data: newCi };
    }

    const singleCiMatch = path.match(/^\/api\/cmdb\/configuration-items\/([^/]+)$/);
    if (singleCiMatch && upperMethod === 'PATCH') {
      const targetKey = decodeURIComponent(singleCiMatch[1]);
      const idx = mutableConfigItems.findIndex((c) => c.id === targetKey || c.tag === targetKey);
      if (idx !== -1) {
        mutableConfigItems[idx] = {
          ...mutableConfigItems[idx],
          ...parsedBody,
          specifications: {
            ...(mutableConfigItems[idx].specifications || {}),
            ...(parsedBody?.specifications || {}),
          },
        };
        return { success: true, data: mutableConfigItems[idx] };
      }
    }

    const relMatch = path.match(/^\/api\/cmdb\/configuration-items\/([^/]+)\/relationships$/);
    if (relMatch && upperMethod === 'POST') {
      const sourceId = decodeURIComponent(relMatch[1]);
      const source = mutableConfigItems.find((c) => c.id === sourceId || c.tag === sourceId);
      if (source) {
        source.relationships = source.relationships || [];
        const targetId = parsedBody?.targetId || parsedBody?.targetCiId || parsedBody?.targetCiTag;
        const target = mutableConfigItems.find((c) => c.id === targetId || c.tag === targetId);
        const rel = {
          type: parsedBody?.type || 'depends_on',
          targetCiId: target ? target.id : targetId,
          targetCiName: target ? target.name : targetId,
          targetCiTag: target ? target.tag : targetId,
          direction: parsedBody?.direction || 'downstream',
        };
        source.relationships.push(rel);
        return { success: true, data: source.relationships };
      }
    }

    const delRelMatch = path.match(/^\/api\/cmdb\/configuration-items\/([^/]+)\/relationships\/([^/]+)$/);
    if (delRelMatch && upperMethod === 'DELETE') {
      const sourceId = decodeURIComponent(delRelMatch[1]);
      const targetId = decodeURIComponent(delRelMatch[2]);
      const source = mutableConfigItems.find((c) => c.id === sourceId || c.tag === sourceId);
      if (source && source.relationships) {
        source.relationships = source.relationships.filter(
          (r: any) => r.targetCiId !== targetId && r.targetCiTag !== targetId
        );
        return { success: true, data: source.relationships };
      }
    }

    const topoMatch = path.match(/^\/api\/cmdb\/configuration-items\/([^/]+)\/topology$/);
    if (topoMatch) {
      const rootId = decodeURIComponent(topoMatch[1]);
      const root = mutableConfigItems.find((c) => c.id === rootId || c.tag === rootId);
      return {
        success: true,
        data: {
          rootId: root?.id || rootId,
          rootTag: root?.tag,
          nodes: mutableConfigItems.slice(0, 5),
          edges: (root?.relationships || []).map((r: any) => ({
            source: root?.id,
            target: r.targetCiId || r.targetCiTag,
            type: r.type,
            direction: r.direction,
          })),
        },
      };
    }

    return { success: true, data: mutableConfigItems };
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

  // 16. Contracts
  if (path === '/api/contracts' || path === '/api/contracts/expiring-soon') {
    if (upperMethod === 'POST') {
      const newContract = {
        id: `CON-${Math.floor(1000 + Math.random() * 9000)}`,
        contractNumber: `CON-${Math.floor(1000 + Math.random() * 9000)}`,
        title: parsedBody?.title || 'New Contract Agreement',
        vendorName: parsedBody?.vendorName || 'Vendor Solutions',
        vendorEmail: parsedBody?.vendorEmail || null,
        type: parsedBody?.type || parsedBody?.contractType || 'SLA',
        contractType: parsedBody?.type || parsedBody?.contractType || 'SLA',
        status: parsedBody?.status || 'Draft',
        startDate: parsedBody?.startDate || new Date().toISOString(),
        endDate: parsedBody?.endDate || null,
        renewalDate: parsedBody?.renewalDate || null,
        autoRenew: Boolean(parsedBody?.autoRenew),
        value: Number(parsedBody?.contractValue ?? parsedBody?.value ?? 0),
        contractValue: Number(parsedBody?.contractValue ?? parsedBody?.value ?? 0),
        currency: parsedBody?.currency || 'USD',
        notes: parsedBody?.notes || null,
        organisationId: 'org-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        linkedCiIds: Array.isArray(parsedBody?.ciIds) ? parsedBody.ciIds : [],
      };
      mutableContracts = [newContract, ...mutableContracts];
      return { success: true, data: newContract };
    }
    return {
      success: true,
      data: mutableContracts,
      contracts: mutableContracts,
    };
  }

  const contractLinkedCiDelMatch = path.match(/^\/api\/contracts\/([^/]+)\/linked-cis\/([^/]+)$/);
  if (contractLinkedCiDelMatch && upperMethod === 'DELETE') {
    const cId = decodeURIComponent(contractLinkedCiDelMatch[1]);
    const ciId = decodeURIComponent(contractLinkedCiDelMatch[2]);
    const c = mutableContracts.find((x: any) => x.id === cId || x.contractNumber === cId);
    if (c) {
      c.linkedCiIds = (c.linkedCiIds || []).filter((id: string) => id !== ciId);
    }
    return { success: true, message: 'CI unlinked successfully' };
  }

  const contractLinkedCisMatch = path.match(/^\/api\/contracts\/([^/]+)\/linked-cis$/);
  if (contractLinkedCisMatch) {
    const cId = decodeURIComponent(contractLinkedCisMatch[1]);
    const c = mutableContracts.find((x: any) => x.id === cId || x.contractNumber === cId);
    if (upperMethod === 'POST') {
      const ciId = parsedBody?.ciId;
      if (c && ciId) {
        c.linkedCiIds = c.linkedCiIds || [];
        if (!c.linkedCiIds.includes(ciId)) c.linkedCiIds.push(ciId);
      }
      return { success: true, data: { ciId, notes: parsedBody?.notes, linkedAt: new Date().toISOString() } };
    }
    const ciItems = (c?.linkedCiIds || []).map((id: string) => {
      const ciMatch = mutableConfigItems.find((x: any) => x.id === id || x.tag === id);
      return {
        ciId: id,
        name: ciMatch?.name || id,
        category: ciMatch?.type || 'CI',
        status: ciMatch?.status || 'Active',
        notes: '',
        linkedAt: new Date().toISOString(),
      };
    });
    return { success: true, data: ciItems };
  }

  const singleContractMatch = path.match(/^\/api\/contracts\/([^/]+)$/);
  if (singleContractMatch) {
    const cId = decodeURIComponent(singleContractMatch[1]);
    const cIdx = mutableContracts.findIndex((x: any) => x.id === cId || x.contractNumber === cId);
    if (upperMethod === 'DELETE') {
      if (cIdx !== -1) mutableContracts.splice(cIdx, 1);
      return { success: true, message: 'Contract deleted' };
    }
    if (upperMethod === 'PATCH') {
      if (cIdx !== -1) {
        mutableContracts[cIdx] = {
          ...mutableContracts[cIdx],
          ...parsedBody,
          updatedAt: new Date().toISOString(),
        };
        return { success: true, data: mutableContracts[cIdx] };
      }
      return { success: true, data: { id: cId, ...parsedBody } };
    }
    return { success: true, data: cIdx !== -1 ? mutableContracts[cIdx] : mutableContracts[0] };
  }

  // 17. Problems
  if (path === '/api/problems') {
    if (upperMethod === 'POST') {
      const rawNum = Math.floor(1000 + Math.random() * 9000);
      const generatedId = `PRB-${rawNum}`;
      const prefixId = `PR-${String(rawNum).padStart(7, '0')}`;
      const newProb = {
        id: generatedId,
        problemNumber: prefixId,
        prefixId,
        summary: parsedBody?.summary || 'New Problem',
        description: parsedBody?.description || '',
        category: parsedBody?.category || 'General',
        priority: parsedBody?.priority || 'Medium',
        urgency: parsedBody?.urgency || 'Medium',
        impact: parsedBody?.impact || 'Medium',
        status: parsedBody?.status || 'Open',
        stage: parsedBody?.stage || 'Investigation',
        currentStage: parsedBody?.stage || 'Investigation',
        team: parsedBody?.team || 'Infrastructure',
        agent: 'Ken Yang',
        agentInitials: 'KY',
        causeStatus: parsedBody?.causeStatus || 'Under Investigation',
        rootCause: parsedBody?.rootCause || null,
        rootCauseDescription: parsedBody?.rootCause || '',
        workaround: parsedBody?.workaround || null,
        workaroundDescription: parsedBody?.workaround || '',
        knownError: Boolean(parsedBody?.knownError),
        assignedAgentId: parsedBody?.assignedAgentId || 'agent-001',
        organisationId: 'org-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        linkedIncidentIds: Array.isArray(parsedBody?.incidentIds) ? parsedBody.incidentIds : [],
        linkedCiIds: Array.isArray(parsedBody?.ciIds) ? parsedBody.ciIds : [],
        childCis: [],
        linkedIncidents: [],
        logs: [
          {
            id: `LOG-${Date.now()}`,
            author: 'System',
            timestamp: new Date().toLocaleString('en-GB'),
            type: 'initial',
            content: parsedBody?.description || 'Problem created',
          },
        ],
        endUser: {
          name: 'General User',
          initials: 'GU',
          organisation: 'consultancy.trial.usehalo.com',
          site: 'London HQ',
          phoneNumber: '4644354',
          preferredNumber: '01449 833111',
          address: 'Not set',
        },
      };
      mutableProblems = [newProb, ...mutableProblems];
      return { success: true, data: newProb };
    }
    return { success: true, data: mutableProblems, problems: mutableProblems };
  }

  const probStageMatch = path.match(/^\/api\/problems\/([^/]+)\/stage$/);
  if (probStageMatch && upperMethod === 'PATCH') {
    const pId = decodeURIComponent(probStageMatch[1]);
    const p = mutableProblems.find((x: any) => x.id === pId || x.prefixId === pId || x.problemNumber === pId);
    if (p) {
      p.stage = parsedBody?.stage || p.stage;
      p.currentStage = parsedBody?.stage || p.currentStage;
      p.updatedAt = new Date().toISOString();
      return { success: true, data: p };
    }
    return { success: true, data: { id: pId, stage: parsedBody?.stage } };
  }

  const probReassignMatch = path.match(/^\/api\/problems\/([^/]+)\/reassign$/);
  if (probReassignMatch && upperMethod === 'PATCH') {
    const pId = decodeURIComponent(probReassignMatch[1]);
    const p = mutableProblems.find((x: any) => x.id === pId || x.prefixId === pId || x.problemNumber === pId);
    if (p) {
      if (parsedBody?.team) p.team = parsedBody.team;
      if (parsedBody?.assignedAgentId) p.assignedAgentId = parsedBody.assignedAgentId;
      p.updatedAt = new Date().toISOString();
      return { success: true, data: p };
    }
    return { success: true, data: { id: pId, ...parsedBody } };
  }

  const probWorkaroundMatch = path.match(/^\/api\/problems\/([^/]+)\/workaround$/);
  if (probWorkaroundMatch && upperMethod === 'POST') {
    const pId = decodeURIComponent(probWorkaroundMatch[1]);
    const p = mutableProblems.find((x: any) => x.id === pId || x.prefixId === pId || x.problemNumber === pId);
    if (p) {
      p.workaround = parsedBody?.workaround || '';
      p.workaroundDescription = parsedBody?.workaround || '';
      p.updatedAt = new Date().toISOString();
      return { success: true, data: p };
    }
    return { success: true, data: { id: pId, workaround: parsedBody?.workaround } };
  }

  const probCauseMatch = path.match(/^\/api\/problems\/([^/]+)\/cause$/);
  if (probCauseMatch && upperMethod === 'POST') {
    const pId = decodeURIComponent(probCauseMatch[1]);
    const p = mutableProblems.find((x: any) => x.id === pId || x.prefixId === pId || x.problemNumber === pId);
    if (p) {
      p.rootCause = parsedBody?.rootCause || '';
      p.rootCauseDescription = parsedBody?.rootCause || '';
      p.causeStatus = parsedBody?.causeStatus || (p.rootCause ? 'Identified' : 'Under Investigation');
      p.updatedAt = new Date().toISOString();
      return { success: true, data: p };
    }
    return { success: true, data: { id: pId, ...parsedBody } };
  }

  const probBulkResolveMatch = path.match(/^\/api\/problems\/([^/]+)\/incidents\/bulk-resolve$/);
  if (probBulkResolveMatch && upperMethod === 'POST') {
    const pId = decodeURIComponent(probBulkResolveMatch[1]);
    const p = mutableProblems.find((x: any) => x.id === pId || x.prefixId === pId || x.problemNumber === pId);
    const resolvedIds = p?.linkedIncidentIds || [];
    return {
      success: true,
      problemId: pId,
      resolvedIncidentCount: resolvedIds.length,
      resolvedIncidentIds: resolvedIds,
      resolutionNote: parsedBody?.resolutionNote || 'Resolved via problem',
    };
  }

  const probIncidentDelMatch = path.match(/^\/api\/problems\/([^/]+)\/incidents\/([^/]+)$/);
  if (probIncidentDelMatch && upperMethod === 'DELETE') {
    const pId = decodeURIComponent(probIncidentDelMatch[1]);
    const incId = decodeURIComponent(probIncidentDelMatch[2]);
    const p = mutableProblems.find((x: any) => x.id === pId || x.prefixId === pId || x.problemNumber === pId);
    if (p) {
      p.linkedIncidentIds = (p.linkedIncidentIds || []).filter((id: string) => id !== incId);
      p.linkedIncidents = (p.linkedIncidents || []).filter((inc: any) => inc.id !== incId);
    }
    return { success: true, message: 'Incident unlinked' };
  }

  const probIncidentsMatch = path.match(/^\/api\/problems\/([^/]+)\/incidents$/);
  if (probIncidentsMatch) {
    const pId = decodeURIComponent(probIncidentsMatch[1]);
    const p = mutableProblems.find((x: any) => x.id === pId || x.prefixId === pId || x.problemNumber === pId);
    if (upperMethod === 'POST') {
      const incId = parsedBody?.incidentId || (Array.isArray(parsedBody?.incidentIds) ? parsedBody.incidentIds[0] : null);
      if (p && incId) {
        p.linkedIncidentIds = p.linkedIncidentIds || [];
        if (!p.linkedIncidentIds.includes(incId)) p.linkedIncidentIds.push(incId);
      }
      return { success: true, data: p?.linkedIncidentIds || [] };
    }
    return { success: true, data: p?.linkedIncidentIds || [] };
  }

  const probCiDelMatch = path.match(/^\/api\/problems\/([^/]+)\/cis\/([^/]+)$/);
  if (probCiDelMatch && upperMethod === 'DELETE') {
    const pId = decodeURIComponent(probCiDelMatch[1]);
    const ciId = decodeURIComponent(probCiDelMatch[2]);
    const p = mutableProblems.find((x: any) => x.id === pId || x.prefixId === pId || x.problemNumber === pId);
    if (p) {
      p.linkedCiIds = (p.linkedCiIds || []).filter((id: string) => id !== ciId);
      p.childCis = (p.childCis || []).filter((c: any) => c.id !== ciId);
    }
    return { success: true, message: 'CI unlinked' };
  }

  const probCisMatch = path.match(/^\/api\/problems\/([^/]+)\/cis$/);
  if (probCisMatch) {
    const pId = decodeURIComponent(probCisMatch[1]);
    const p = mutableProblems.find((x: any) => x.id === pId || x.prefixId === pId || x.problemNumber === pId);
    if (upperMethod === 'POST') {
      const ciId = parsedBody?.ciId;
      if (p && ciId) {
        p.linkedCiIds = p.linkedCiIds || [];
        if (!p.linkedCiIds.includes(ciId)) p.linkedCiIds.push(ciId);
      }
      return { success: true, data: p?.linkedCiIds || [] };
    }
    return { success: true, data: p?.childCis || (p?.linkedCiIds || []).map((id: string) => ({ id, name: id, type: 'CI', status: 'Active' })) };
  }

  const probLogsMatch = path.match(/^\/api\/problems\/([^/]+)\/logs$/);
  if (probLogsMatch) {
    const pId = decodeURIComponent(probLogsMatch[1]);
    const p = mutableProblems.find((x: any) => x.id === pId || x.prefixId === pId || x.problemNumber === pId);
    if (upperMethod === 'POST') {
      const newEntry = {
        id: `LOG-${Date.now()}`,
        author: parsedBody?.author || 'Ken Yang',
        content: parsedBody?.content || '',
        type: parsedBody?.type || 'note',
        timestamp: new Date().toLocaleString('en-GB'),
        createdAt: new Date().toISOString(),
      };
      if (p) {
        p.logs = p.logs || [];
        p.logs.push(newEntry);
      }
      return { success: true, data: newEntry };
    }
    return { success: true, data: p?.logs || [] };
  }

  const probEmailMatch = path.match(/^\/api\/problems\/([^/]+)\/email$/);
  if (probEmailMatch && upperMethod === 'POST') {
    const pId = decodeURIComponent(probEmailMatch[1]);
    const p = mutableProblems.find((x: any) => x.id === pId || x.prefixId === pId || x.problemNumber === pId);
    if (p) {
      p.logs = p.logs || [];
      p.logs.push({
        id: `LOG-${Date.now()}`,
        author: 'Ken Yang',
        type: 'note',
        content: `Email sent to ${parsedBody?.to || 'user'}: "${parsedBody?.subject}" - ${parsedBody?.body}`,
        timestamp: new Date().toLocaleString('en-GB'),
      });
    }
    return { success: true, message: 'Email update sent to user' };
  }

  const singleProblemMatch = path.match(/^\/api\/problems\/([^/]+)$/);
  if (singleProblemMatch) {
    const pId = decodeURIComponent(singleProblemMatch[1]);
    const pIdx = mutableProblems.findIndex((x: any) => x.id === pId || x.prefixId === pId || x.problemNumber === pId);
    if (upperMethod === 'DELETE') {
      if (pIdx !== -1) mutableProblems.splice(pIdx, 1);
      return { success: true, message: 'Problem deleted' };
    }
    if (upperMethod === 'PATCH') {
      if (pIdx !== -1) {
        mutableProblems[pIdx] = {
          ...mutableProblems[pIdx],
          ...parsedBody,
          updatedAt: new Date().toISOString(),
        };
        return { success: true, data: mutableProblems[pIdx] };
      }
      return { success: true, data: { id: pId, ...parsedBody } };
    }
    return { success: true, data: pIdx !== -1 ? mutableProblems[pIdx] : mutableProblems[0] };
  }

  return undefined;
}
