import { ProblemItem, ProblemLogEntry, ProblemStage, ProblemStatus } from '../types/problem.types';

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

export const problemsService = {
  getProblems: (): ProblemItem[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_PROBLEMS;
  },

  saveProblems: (problems: ProblemItem[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(problems));
    } catch {
      // ignore
    }
  },

  getProblemById: (id: string): ProblemItem | undefined => {
    const list = problemsService.getProblems();
    const cleanId = id.replace(/^PR-/, '');
    return list.find((p) => p.id === cleanId || p.prefixId === id || p.id === id);
  },

  createProblem: (data: Partial<ProblemItem>): ProblemItem => {
    const list = problemsService.getProblems();
    const rawNum = Math.floor(2152 + Math.random() * 500);
    const id = String(rawNum).padStart(7, '0');
    const prefixId = `PR-${id}`;
    const nowStr = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const newProblem: ProblemItem = {
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
      childCis: [],
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

    const updated = [newProblem, ...list];
    problemsService.saveProblems(updated);
    return newProblem;
  },

  updateProblem: (id: string, updates: Partial<ProblemItem>): ProblemItem | undefined => {
    const list = problemsService.getProblems();
    let updatedItem: ProblemItem | undefined;

    const next = list.map((item) => {
      if (item.id === id || item.prefixId === id) {
        updatedItem = { ...item, ...updates };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem) {
      problemsService.saveProblems(next);
    }
    return updatedItem;
  },

  addLogEntry: (id: string, author: string, content: string, type: ProblemLogEntry['type'] = 'note'): ProblemItem | undefined => {
    const list = problemsService.getProblems();
    let updatedItem: ProblemItem | undefined;
    const nowStr = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

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

    if (updatedItem) {
      problemsService.saveProblems(next);
    }
    return updatedItem;
  },
};
