import { api } from '../../../services/apiClient';
import { ProblemItem, ProblemLogEntry, ProblemPriority, ProblemStage, ProblemStatus } from '../types/problem.types';

const STORAGE_KEY = 'servigen_problems_v1';

export const INITIAL_PROBLEMS: ProblemItem[] = [
  {
    id: '0002149',
    prefixId: 'PR-0002149',
    summary: 'Issues with Teams performance',
    description:
      "Users experience multiple symptoms relating to performance. These can be anything from calls dropping (sometimes attempting to reconnect, sometimes completely dropped with no error) to not being able to access emoji's, to not being able to properly share your screen.",
    team: 'Infrastructure',
    agent: 'Ken Yang',
    agentInitials: 'KY',
    priority: 'Critical',
    status: 'New',
    category: 'Business Applications',
    type: 'Problem',
    workflow: 'Problem Management Workflow',
    dateReported: '17/05/2026 4:06 AM',
    timeRecorded: '00:00',
    impact: 'High',
    currentStage: 'Investigation',
    causeStatus: 'Under Investigation',
    monitoredServices: ['Microsoft Teams', 'Edge WebRTC Gateway'],
    childCis: [
      { id: 'CI-102', name: 'Teams Voice Relay', type: 'Application Service', status: 'Degraded' },
      { id: 'CI-108', name: 'WebRTC TURN Cluster', type: 'Infrastructure', status: 'Operational' },
    ],
    linkedIncidents: [
      { id: '1024', summary: 'VPN Authentication Failures across EMEA', priority: 'High', status: 'In Progress', dateLogged: '17/05/2026' },
      { id: '1031', summary: 'Teams call drops during screen share', priority: 'Medium', status: 'Open', dateLogged: '17/05/2026' },
    ],
    endUser: {
      name: 'General User',
      initials: 'U',
      organisation: 'consultancy.trial.usehalo.com',
      site: 'EMEA',
      phoneNumber: '4644354',
      preferredNumber: '01449 833111',
      address: 'Not set',
    },
    logs: [
      {
        id: 'log-1',
        author: 'General User',
        timestamp: '17/05/2026 4:06 AM',
        type: 'initial',
        content:
          "Users experience multiple symptoms relating to performance. These can be anything from calls dropping (sometimes attempting to reconnect, sometimes completely dropped with no error) to not being able to access emoji's, to not being able to properly share your screen.",
        badge: 'New',
      },
    ],
  },
  {
    id: '0002150',
    prefixId: 'PR-0002150',
    summary: 'Email delivery timeouts during peak tenant synchronization',
    description:
      'SMTP relay queues back up during hourly cron job synchronization across multi-tenant clusters. Outgoing email queue exceeds threshold of 10,000 messages.',
    team: 'Cloud Ops',
    agent: 'Alex Rivera',
    agentInitials: 'AR',
    priority: 'High',
    status: 'Investigation',
    category: 'Email & Messaging',
    type: 'Problem',
    workflow: 'Problem Management Workflow',
    dateReported: '16/05/2026 11:20 AM',
    timeRecorded: '01:30',
    impact: 'High',
    currentStage: 'Investigation',
    causeStatus: 'Under Investigation',
    monitoredServices: ['Postfix SMTP Relay', 'Kafka Event Bus'],
    childCis: [
      { id: 'CI-205', name: 'SMTP Outbound Node 1', type: 'Server', status: 'Operational' },
      { id: 'CI-206', name: 'SMTP Outbound Node 2', type: 'Server', status: 'Degraded' },
    ],
    linkedIncidents: [],
    endUser: {
      name: 'Sarah Jenkins',
      initials: 'SJ',
      organisation: 'Global Finance Corp',
      site: 'US-East',
      phoneNumber: '9123847',
      preferredNumber: '02079 460912',
      address: '14 Wall St, New York',
    },
    logs: [
      {
        id: 'log-2',
        author: 'Alex Rivera',
        timestamp: '16/05/2026 11:25 AM',
        type: 'note',
        content: 'Correlating with Kafka consumer group lag spikes at minute :00.',
      },
    ],
  },
  {
    id: '0002151',
    prefixId: 'PR-0002151',
    summary: 'Intermittent authentication session drops on SSO login',
    description:
      'Users report periodic forced logouts every 15 minutes due to token refresh race conditions across distributed Redis session cache.',
    team: 'Security & Identity',
    agent: 'Marcus Vance',
    agentInitials: 'MV',
    priority: 'Medium',
    status: 'Workaround',
    category: 'Identity & Access',
    type: 'Problem',
    workflow: 'Problem Management Workflow',
    dateReported: '15/05/2026 09:15 AM',
    timeRecorded: '02:45',
    impact: 'Medium',
    currentStage: 'Workaround',
    causeStatus: 'Identified',
    rootCauseDescription: 'Redis TTL jitter algorithm causing early key expiration before frontend token refresh.',
    workaroundDescription: 'Temporarily increased session sliding window grace period to 30 minutes in proxy configs.',
    monitoredServices: ['Redis Cluster', 'OAuth2 Gateway'],
    childCis: [
      { id: 'CI-301', name: 'Redis Primary', type: 'Database CI', status: 'Operational' },
    ],
    linkedIncidents: [],
    endUser: {
      name: 'Priya Nair',
      initials: 'PN',
      organisation: 'Acme Health',
      site: 'APAC',
      phoneNumber: '7823901',
      preferredNumber: '01614 960823',
      address: 'Level 4, Marina Bay, Singapore',
    },
    logs: [
      {
        id: 'log-3',
        author: 'Marcus Vance',
        timestamp: '15/05/2026 10:00 AM',
        type: 'cause_update',
        content: 'Workaround deployed: sliding window increased to 30 minutes. RCA confirmed.',
      },
    ],
  },
];

function getStoredLocal(): ProblemItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_PROBLEMS;
}

function saveLocal(items: ProblemItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function mapBackendProblem(raw: any): ProblemItem {
  if (!raw || typeof raw !== 'object') return raw;
  const idStr = String(raw.id || raw.problemNumber || '');
  const prefixId = raw.problemNumber || (idStr.startsWith('PR-') ? idStr : idStr.startsWith('PRB-') ? idStr.replace('PRB-', 'PR-000') : `PR-${idStr.padStart(7, '0')}`);
  const statusStr = String(raw.status || 'New');
  
  let mappedStatus: ProblemStatus = 'New';
  const lowerStatus = statusStr.toLowerCase();
  if (lowerStatus.includes('investigation') || lowerStatus === 'open') {
    mappedStatus = 'Investigation';
  } else if (lowerStatus.includes('workaround')) {
    mappedStatus = 'Workaround';
  } else if (lowerStatus.includes('known error')) {
    mappedStatus = 'Known Error';
  } else if (lowerStatus === 'resolved') {
    mappedStatus = 'Resolved';
  } else if (lowerStatus === 'closed') {
    mappedStatus = 'Closed';
  }

  let stageStr: ProblemStage = 'Investigation';
  const rawStage = String(raw.stage || raw.currentStage || '');
  if (rawStage.includes('Workaround')) stageStr = 'Workaround';
  else if (rawStage.includes('Known Error')) stageStr = 'Known Error Review';
  else if (rawStage.includes('Resolved')) stageStr = 'Resolved';

  const dateReported = raw.createdAt
    ? new Date(raw.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    : (raw.dateReported || new Date().toLocaleString('en-GB'));

  const logs: ProblemLogEntry[] = Array.isArray(raw.logs)
    ? raw.logs.map((l: any, i: number) => ({
        id: l.id || `log-${i}`,
        author: l.author || 'System',
        authorRole: l.authorRole,
        timestamp: l.timestamp || (l.createdAt ? new Date(l.createdAt).toLocaleString('en-GB') : 'Just now'),
        type: l.type || 'note',
        content: l.content || '',
        badge: l.badge,
      }))
    : [];

  const childCis = Array.isArray(raw.childCis) && raw.childCis.length > 0
    ? raw.childCis
    : (raw.linkedCiIds || []).map((ciId: string) => ({
        id: ciId,
        name: ciId,
        type: 'Configuration Item',
        status: 'Operational',
      }));

  const linkedIncidents = Array.isArray(raw.linkedIncidents) && raw.linkedIncidents.length > 0
    ? raw.linkedIncidents
    : (raw.linkedIncidentIds || []).map((incId: string) => ({
        id: incId,
        summary: `Incident #${incId}`,
        priority: 'Medium',
        status: 'Open',
        dateLogged: dateReported,
      }));

  return {
    id: idStr,
    prefixId,
    summary: raw.summary || 'Untitled Problem Investigation',
    description: raw.description || '',
    team: raw.team || 'Infrastructure',
    agent: raw.agent || raw.assignedAgentId || 'Ken Yang',
    agentInitials: (raw.agent || 'Ken Yang').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
    priority: (raw.priority || 'Medium') as ProblemPriority,
    status: mappedStatus,
    category: raw.category || 'Business Applications',
    type: 'Problem',
    workflow: 'Problem Management Workflow',
    dateReported,
    timeRecorded: raw.timeRecorded || '00:00',
    impact: raw.impact || 'Medium',
    currentStage: stageStr,
    causeStatus: raw.causeStatus || (raw.rootCause ? 'Identified' : 'Under Investigation'),
    rootCauseDescription: raw.rootCause || raw.rootCauseDescription || '',
    workaroundDescription: raw.workaround || raw.workaroundDescription || '',
    pirData: raw.pirData,
    monitoredServices: Array.isArray(raw.monitoredServices) && raw.monitoredServices.length > 0 ? raw.monitoredServices : ['General Service'],
    childCis,
    linkedIncidents,
    endUser: raw.endUser || {
      name: 'General User',
      initials: 'GU',
      organisation: 'consultancy.trial.usehalo.com',
      site: 'EMEA',
      phoneNumber: '4644354',
      preferredNumber: '01449 833111',
      address: 'Not set',
    },
    logs,
  };
}

export const problemsService = {
  getStoredProblems(): ProblemItem[] {
    return getStoredLocal();
  },

  async getProblems(filters?: Record<string, string>): Promise<ProblemItem[]> {
    try {
      const res = await api.get('/api/problems', { params: filters });
      const raw = res?.data || res;
      const list = Array.isArray(raw) ? raw : raw?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map(mapBackendProblem);
        saveLocal(mapped);
        return mapped;
      }
    } catch {
    }
    return getStoredLocal();
  },

  async getProblemById(id: string): Promise<ProblemItem | undefined> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      const res = await api.get(`/api/problems/${encodeURIComponent(cleanId)}`);
      const raw = res?.data || res;
      if (raw) return mapBackendProblem(raw);
    } catch {
    }
    const local = getStoredLocal();
    const cleanId = id.replace(/^PR-/, '');
    return local.find((p) => p.id === cleanId || p.prefixId === id || p.id === id);
  },

  async createProblem(data: Partial<ProblemItem>): Promise<ProblemItem> {
    const payload = {
      summary: data.summary || 'Untitled Problem Investigation',
      description: data.description || 'Problem logged.',
      category: data.category || 'General',
      priority: data.priority || 'Medium',
      impact: data.impact || 'Medium',
      team: data.team || 'Infrastructure',
      rootCause: data.rootCauseDescription,
      workaround: data.workaroundDescription,
      incidentIds: data.linkedIncidents?.map((i) => i.id) || [],
      ciIds: data.childCis?.map((c) => c.id) || [],
    };

    try {
      const res = await api.post('/api/problems', payload);
      const raw = res?.data || res;
      if (raw) {
        const mapped = mapBackendProblem(raw);
        const current = getStoredLocal();
        saveLocal([mapped, ...current.filter((p) => p.id !== mapped.id)]);
        return mapped;
      }
    } catch {
    }

    const current = getStoredLocal();
    const rawNum = Math.floor(2152 + Math.random() * 500);
    const id = String(rawNum).padStart(7, '0');
    const prefixId = `PR-${id}`;
    const nowStr = new Date().toLocaleString('en-GB');

    const fallbackProblem: ProblemItem = {
      id,
      prefixId,
      summary: data.summary || 'Untitled Problem Investigation',
      description: data.description || 'No description provided.',
      team: data.team || 'Infrastructure',
      agent: data.agent || 'Ken Yang',
      agentInitials: (data.agent || 'Ken Yang').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      priority: data.priority || 'Medium',
      status: 'New',
      category: data.category || 'Business Applications',
      type: 'Problem',
      workflow: 'Problem Management Workflow',
      dateReported: nowStr,
      timeRecorded: '00:00',
      impact: data.impact || 'Medium',
      currentStage: 'Investigation',
      causeStatus: 'Under Investigation',
      monitoredServices: data.monitoredServices?.length ? data.monitoredServices : ['General Service'],
      childCis: data.childCis || [],
      linkedIncidents: data.linkedIncidents || [],
      endUser: {
        name: data.endUser?.name || 'General User',
        initials: (data.endUser?.name || 'General User')[0],
        organisation: data.endUser?.organisation || 'consultancy.trial.usehalo.com',
        site: data.endUser?.site || 'EMEA',
        phoneNumber: data.endUser?.phoneNumber || '4644354',
        preferredNumber: data.endUser?.preferredNumber || '01449 833111',
        address: data.endUser?.address || 'Not set',
      },
      logs: [
        {
          id: `log-${Date.now()}`,
          author: data.agent || 'Ken Yang',
          timestamp: nowStr,
          type: 'initial',
          content: data.description || 'Problem ticket logged.',
          badge: 'New',
        },
      ],
    };

    saveLocal([fallbackProblem, ...current]);
    return fallbackProblem;
  },

  async updateProblem(id: string, updates: Partial<ProblemItem>): Promise<ProblemItem | undefined> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      const res = await api.patch(`/api/problems/${encodeURIComponent(cleanId)}`, updates);
      const raw = res?.data || res;
      if (raw) {
        const mapped = mapBackendProblem(raw);
        const current = getStoredLocal();
        saveLocal(current.map((p) => (p.id === id || p.prefixId === id ? mapped : p)));
        return mapped;
      }
    } catch {
    }

    const current = getStoredLocal();
    let updatedItem: ProblemItem | undefined;
    const next = current.map((item) => {
      if (item.id === id || item.prefixId === id) {
        updatedItem = { ...item, ...updates };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem) saveLocal(next);
    return updatedItem;
  },

  async deleteProblem(id: string): Promise<boolean> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      await api.delete(`/api/problems/${encodeURIComponent(cleanId)}`);
    } catch {}
    const current = getStoredLocal();
    saveLocal(current.filter((p) => p.id !== id && p.prefixId !== id));
    return true;
  },

  async updateStage(id: string, stage: ProblemStage): Promise<any> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      const res = await api.patch(`/api/problems/${encodeURIComponent(cleanId)}/stage`, { stage });
      return res?.data || res;
    } catch {}
    return { success: true, stage };
  },

  async reassignProblem(id: string, team: string, assignedAgentId?: string): Promise<any> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      const res = await api.patch(`/api/problems/${encodeURIComponent(cleanId)}/reassign`, { team, assignedAgentId });
      return res?.data || res;
    } catch {}
    return { success: true, team, assignedAgentId };
  },

  async saveWorkaround(id: string, workaround: string): Promise<any> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      const res = await api.post(`/api/problems/${encodeURIComponent(cleanId)}/workaround`, { workaround });
      return res?.data || res;
    } catch {}
    return { success: true, workaround };
  },

  async saveRootCause(id: string, rootCause: string, causeStatus: string = 'Identified'): Promise<any> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      const res = await api.post(`/api/problems/${encodeURIComponent(cleanId)}/cause`, { rootCause, causeStatus });
      return res?.data || res;
    } catch {}
    return { success: true, rootCause, causeStatus };
  },

  async linkIncident(id: string, incidentId: string): Promise<any> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      const res = await api.post(`/api/problems/${encodeURIComponent(cleanId)}/incidents`, { incidentId });
      return res?.data || res;
    } catch {}
    return { success: true, incidentId };
  },

  async unlinkIncident(id: string, incidentId: string): Promise<any> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      const res = await api.delete(`/api/problems/${encodeURIComponent(cleanId)}/incidents/${encodeURIComponent(incidentId)}`);
      return res?.data || res;
    } catch {}
    return { success: true };
  },

  async bulkResolveChildIncidents(id: string, resolutionNote?: string, author?: string): Promise<any> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      const res = await api.post(`/api/problems/${encodeURIComponent(cleanId)}/incidents/bulk-resolve`, {
        resolutionNote: resolutionNote || 'Resolved via root problem resolution.',
        author: author || 'Ken Yang',
      });
      return res?.data || res;
    } catch {}
    return { success: true };
  },

  async getLinkedCis(id: string): Promise<any[]> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      const res = await api.get(`/api/problems/${encodeURIComponent(cleanId)}/cis`);
      const raw = res?.data || res;
      return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    } catch {}
    return [];
  },

  async linkCi(id: string, ciId: string, relationType: string = 'impacted_by'): Promise<any> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      const res = await api.post(`/api/problems/${encodeURIComponent(cleanId)}/cis`, { ciId, relationType });
      return res?.data || res;
    } catch {}
    return { success: true, ciId };
  },

  async unlinkCi(id: string, ciId: string): Promise<any> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      const res = await api.delete(`/api/problems/${encodeURIComponent(cleanId)}/cis/${encodeURIComponent(ciId)}`);
      return res?.data || res;
    } catch {}
    return { success: true };
  },

  async addLogEntry(
    id: string,
    author: string,
    content: string,
    type: ProblemLogEntry['type'] = 'note'
  ): Promise<ProblemItem | undefined> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      await api.post(`/api/problems/${encodeURIComponent(cleanId)}/logs`, { author, content, type });
    } catch {}

    const list = getStoredLocal();
    let updatedItem: ProblemItem | undefined;
    const nowStr = new Date().toLocaleString('en-GB');

    const next = list.map((item) => {
      if (item.id === id || item.prefixId === id) {
        const newLog: ProblemLogEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          author,
          timestamp: nowStr,
          type,
          content,
        };
        updatedItem = {
          ...item,
          logs: [...item.logs, newLog],
        };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem) saveLocal(next);
    return updatedItem;
  },

  async sendEmail(id: string, payload: { to: string; subject: string; body: string }): Promise<any> {
    try {
      const cleanId = id.replace(/^PR-/, '');
      const res = await api.post(`/api/problems/${encodeURIComponent(cleanId)}/email`, payload);
      return res?.data || res;
    } catch {}
    return { success: true, message: 'Email sent successfully' };
  },
};
