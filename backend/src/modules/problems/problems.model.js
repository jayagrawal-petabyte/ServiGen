'use strict';

const { randomUUID } = require('crypto');
const db = require('../../config/db');

const mockProblems = [
  {
    id: 'PRB-1001',
    problemNumber: 'PR-0001001',
    summary: 'Intermittent VPN gateway drops during peak hours',
    description: 'Multiple users across London HQ report VPN disconnections between 08:30 and 10:00.',
    category: 'Network',
    priority: 'High',
    urgency: 'High',
    impact: 'High',
    status: 'Under Investigation',
    stage: 'Investigation',
    team: 'Network Ops',
    causeStatus: 'Unknown',
    rootCause: null,
    workaround: 'Route remote workers through secondary backup gateway (vpn-backup.servigen.local).',
    knownError: true,
    assignedAgentId: 'agent-001',
    organisationId: 'org-001',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T10:30:00.000Z',
    linkedIncidentIds: ['INC-1001'],
    linkedCiIds: ['CI-001'],
    logs: [
      {
        id: 'LOG-001',
        author: 'System',
        content: 'Problem created from incident INC-1001',
        type: 'system',
        createdAt: '2026-10-01T09:00:00.000Z',
      },
      {
        id: 'LOG-002',
        author: 'Sarah Connor',
        content: 'Packet capture started on London core gateway.',
        type: 'note',
        createdAt: '2026-10-01T09:30:00.000Z',
      },
    ],
  },
  {
    id: 'PRB-1002',
    problemNumber: 'PR-0001002',
    summary: 'Database connection pool exhaustion on reporting query',
    description: 'Long-running analytics reports exhaust PostgreSQL connection pool.',
    category: 'Database',
    priority: 'Critical',
    urgency: 'High',
    impact: 'High',
    status: 'Workaround Found',
    stage: 'Workaround',
    team: 'Database',
    causeStatus: 'Identified',
    rootCause: 'Unindexed joins on ticket audit history table.',
    workaround: 'Execute heavy exports on read-replica during maintenance window only.',
    knownError: true,
    assignedAgentId: 'agent-002',
    organisationId: 'org-001',
    createdAt: '2026-10-02T11:00:00.000Z',
    updatedAt: '2026-10-02T14:15:00.000Z',
    linkedIncidentIds: [],
    linkedCiIds: ['CI-002'],
    logs: [
      {
        id: 'LOG-003',
        author: 'Database Team',
        content: 'Identified missing index on ticket_notes(ticket_id).',
        type: 'note',
        createdAt: '2026-10-02T11:30:00.000Z',
      },
    ],
  },
];

const useMockData = process.env.NODE_ENV === 'test';
const allowOfflineMocks = process.env.ALLOW_OFFLINE_MOCKS === 'true' || process.env.NODE_ENV !== 'production';

const matchesId = (problem, targetId) => {
  if (!problem || !targetId) return false;
  const t = String(targetId).trim().toLowerCase();
  const pid = String(problem.id).toLowerCase();
  const pnum = String(problem.problemNumber || '').toLowerCase();
  if (pid === t || pnum === t) return true;

  const cleanTarget = t.replace(/^prb?-?/i, '');
  const cleanPid = pid.replace(/^prb?-?/i, '');
  const cleanPnum = pnum.replace(/^prb?-?/i, '');
  if (cleanTarget && (cleanPid === cleanTarget || cleanPnum === cleanTarget)) return true;
  return false;
};

const formatProblem = (p) => ({
  id: p.id,
  problemNumber: p.problemNumber || p.id,
  summary: p.summary,
  description: p.description || null,
  category: p.category || 'General',
  priority: p.priority || 'Medium',
  urgency: p.urgency || 'Medium',
  impact: p.impact || 'Medium',
  status: p.status || 'Open',
  stage: p.stage || 'Investigation',
  team: p.team || null,
  causeStatus: p.causeStatus || (p.rootCause ? 'Identified' : 'Unknown'),
  rootCause: p.rootCause || null,
  workaround: p.workaround || null,
  knownError: Boolean(p.knownError),
  assignedAgentId: p.assignedAgentId || null,
  organisationId: p.organisationId || null,
  createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
  linkedIncidentIds: p.linkedIncidentIds || (p.ticketLinks ? p.ticketLinks.map((tl) => tl.ticketId) : []),
  linkedCiIds: p.linkedCiIds || [],
  logs: p.logs || [],
});

const getProblems = async (filters = {}) => {
  const { organisationId, status, stage, priority, category, team, search, knownError } = filters;

  if (useMockData) {
    return mockProblems
      .filter((p) => {
        if (organisationId && p.organisationId !== organisationId) return false;
        if (status && p.status.toLowerCase() !== status.toLowerCase()) return false;
        if (stage && (p.stage || '').toLowerCase() !== stage.toLowerCase()) return false;
        if (priority && p.priority.toLowerCase() !== priority.toLowerCase()) return false;
        if (team && (p.team || '').toLowerCase() !== team.toLowerCase()) return false;
        if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
        if (knownError !== undefined && p.knownError !== knownError) return false;
        if (search) {
          const s = search.toLowerCase();
          const match =
            p.summary.toLowerCase().includes(s) ||
            (p.description && p.description.toLowerCase().includes(s)) ||
            p.id.toLowerCase().includes(s) ||
            (p.problemNumber && p.problemNumber.toLowerCase().includes(s));
          if (!match) return false;
        }
        return true;
      })
      .map(formatProblem);
  }

  try {
    const where = {};
    if (organisationId) where.organisationId = organisationId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = { equals: category, mode: 'insensitive' };
    if (knownError !== undefined) where.knownError = knownError;
    if (search) {
      where.OR = [
        { summary: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }

    const records = await db.problem.findMany({
      where,
      include: {
        ticketLinks: {
          select: { ticketId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(formatProblem);
  } catch (err) {
    if (allowOfflineMocks) {
      return mockProblems.filter((p) => !organisationId || p.organisationId === organisationId).map(formatProblem);
    }
    throw err;
  }
};

const getProblemById = async (id, organisationId = null) => {
  if (useMockData) {
    const p = mockProblems.find((item) => matchesId(item, id));
    if (!p) return null;
    if (organisationId && p.organisationId !== organisationId) return null;
    return formatProblem(p);
  }

  try {
    const cleanTarget = String(id).trim().replace(/^prb?-?/i, '');
    const candidateIds = [id];
    if (cleanTarget) {
      candidateIds.push(cleanTarget, `PR-${cleanTarget}`, `PRB-${cleanTarget}`);
      if (/^\d+$/.test(cleanTarget)) {
        candidateIds.push(`PR-${cleanTarget.padStart(7, '0')}`);
      }
    }

    const where = {
      OR: [
        { id: { in: candidateIds } },
        { problemNumber: { in: candidateIds } },
      ],
    };
    if (organisationId) where.organisationId = organisationId;

    const record = await db.problem.findFirst({
      where,
      include: {
        ticketLinks: {
          include: {
            ticket: {
              select: {
                id: true,
                summary: true,
                priority: true,
                status: true,
              },
            },
          },
        },
        assignedAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!record) return null;
    const formatted = formatProblem(record);
    if (record.ticketLinks) {
      formatted.linkedIncidents = record.ticketLinks.map((tl) => tl.ticket);
    }
    if (record.assignedAgent) {
      formatted.assignedAgent = record.assignedAgent;
    }
    return formatted;
  } catch (err) {
    if (allowOfflineMocks) {
      const p = mockProblems.find((item) => matchesId(item, id));
      if (!p || (organisationId && p.organisationId !== organisationId)) return null;
      return formatProblem(p);
    }
    throw err;
  }
};

const createProblemRecord = async (problemData) => {
  const numPart = Date.now().toString().slice(-7);
  const id = problemData.id || `PR-${numPart}`;
  const problemNumber = problemData.problemNumber || id;

  const {
    summary,
    description,
    category = 'General',
    priority = 'Medium',
    urgency = 'Medium',
    impact = 'Medium',
    status = 'Open',
    stage = 'Investigation',
    team = null,
    causeStatus = 'Unknown',
    rootCause = null,
    workaround = null,
    knownError = false,
    assignedAgentId = null,
    organisationId = null,
    incidentIds = [],
    ciIds = [],
  } = problemData;

  const now = new Date().toISOString();

  const newProblem = {
    id,
    problemNumber,
    summary,
    description,
    category,
    priority,
    urgency,
    impact,
    status,
    stage,
    team,
    causeStatus,
    rootCause,
    workaround,
    knownError: Boolean(knownError || workaround),
    assignedAgentId,
    organisationId,
    createdAt: now,
    updatedAt: now,
    linkedIncidentIds: [...incidentIds],
    linkedCiIds: [...ciIds],
    logs: [
      {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        author: 'System',
        content: `Problem record ${id} created.`,
        type: 'system',
        createdAt: now,
      },
    ],
  };

  if (useMockData) {
    mockProblems.unshift(newProblem);
    return formatProblem(newProblem);
  }

  try {
    const created = await db.problem.create({
      data: {
        id,
        problemNumber,
        summary,
        description,
        category,
        priority,
        urgency,
        impact,
        status,
        rootCause,
        workaround,
        knownError: Boolean(knownError || workaround),
        assignedAgentId,
        organisationId,
      },
    });

    if (incidentIds && incidentIds.length > 0) {
      await db.ticketLink.createMany({
        data: incidentIds.map((ticketId) => ({
          ticketId,
          problemId: id,
          relationType: 'PROBLEM_INVESTIGATION',
          organisationId,
        })),
        skipDuplicates: true,
      });
    }

    return formatProblem(created);
  } catch (err) {
    if (allowOfflineMocks) {
      mockProblems.unshift(newProblem);
      return formatProblem(newProblem);
    }
    throw err;
  }
};

const updateProblemRecord = async (id, organisationId, patch) => {
  const now = new Date().toISOString();

  if (useMockData) {
    const idx = mockProblems.findIndex((p) => matchesId(p, id));
    if (idx === -1) return null;
    if (organisationId && mockProblems[idx].organisationId !== organisationId) return null;

    mockProblems[idx] = {
      ...mockProblems[idx],
      ...patch,
      updatedAt: now,
    };
    if (patch.workaround && !mockProblems[idx].knownError) {
      mockProblems[idx].knownError = true;
    }
    return formatProblem(mockProblems[idx]);
  }

  try {
    const existing = await getProblemById(id, organisationId);
    if (!existing) return null;

    const updated = await db.problem.update({
      where: { id: existing.id },
      data: {
        ...patch,
        ...(patch.workaround ? { knownError: true } : {}),
      },
      include: {
        ticketLinks: { select: { ticketId: true } },
      },
    });

    return formatProblem(updated);
  } catch (err) {
    if (allowOfflineMocks) {
      const idx = mockProblems.findIndex((p) => matchesId(p, id));
      if (idx === -1 || (organisationId && mockProblems[idx].organisationId !== organisationId)) return null;
      mockProblems[idx] = { ...mockProblems[idx], ...patch, updatedAt: now };
      return formatProblem(mockProblems[idx]);
    }
    throw err;
  }
};

const deleteProblemRecord = async (id, organisationId) => {
  if (useMockData) {
    const idx = mockProblems.findIndex((p) => matchesId(p, id));
    if (idx === -1) return null;
    if (organisationId && mockProblems[idx].organisationId !== organisationId) return null;

    const deleted = mockProblems.splice(idx, 1)[0];
    return formatProblem(deleted);
  }

  try {
    const existing = await getProblemById(id, organisationId);
    if (!existing) return null;

    await db.problem.delete({ where: { id: existing.id } });
    return existing;
  } catch (err) {
    if (allowOfflineMocks) {
      const idx = mockProblems.findIndex((p) => matchesId(p, id));
      if (idx === -1 || (organisationId && mockProblems[idx].organisationId !== organisationId)) return null;
      const deleted = mockProblems.splice(idx, 1)[0];
      return formatProblem(deleted);
    }
    throw err;
  }
};

const linkIncidentsToProblem = async (problemId, organisationId, incidentIds) => {
  if (useMockData) {
    const problem = mockProblems.find((p) => matchesId(p, problemId));
    if (!problem) return null;
    if (organisationId && problem.organisationId !== organisationId) return null;

    for (const incId of incidentIds) {
      if (!problem.linkedIncidentIds.includes(incId)) {
        problem.linkedIncidentIds.push(incId);
      }
    }
    return formatProblem(problem);
  }

  try {
    const existing = await getProblemById(problemId, organisationId);
    if (!existing) return null;

    await db.ticketLink.createMany({
      data: incidentIds.map((ticketId) => ({
        ticketId,
        problemId: existing.id,
        relationType: 'PROBLEM_INVESTIGATION',
        organisationId,
      })),
      skipDuplicates: true,
    });

    return getProblemById(existing.id, organisationId);
  } catch (err) {
    if (allowOfflineMocks) {
      const p = mockProblems.find((item) => matchesId(item, problemId));
      if (!p || (organisationId && p.organisationId !== organisationId)) return null;
      incidentIds.forEach((inc) => {
        if (!p.linkedIncidentIds.includes(inc)) p.linkedIncidentIds.push(inc);
      });
      return formatProblem(p);
    }
    throw err;
  }
};

const unlinkIncidentFromProblem = async (problemId, organisationId, incidentId) => {
  if (useMockData) {
    const problem = mockProblems.find((p) => matchesId(p, problemId));
    if (!problem) return null;
    if (organisationId && problem.organisationId !== organisationId) return null;

    problem.linkedIncidentIds = problem.linkedIncidentIds.filter((id) => id !== incidentId);
    return formatProblem(problem);
  }

  try {
    const existing = await getProblemById(problemId, organisationId);
    if (!existing) return null;

    await db.ticketLink.deleteMany({
      where: {
        problemId: existing.id,
        ticketId: incidentId,
      },
    });

    return getProblemById(existing.id, organisationId);
  } catch (err) {
    if (allowOfflineMocks) {
      const problem = mockProblems.find((p) => matchesId(p, problemId));
      if (!problem || (organisationId && problem.organisationId !== organisationId)) return null;
      problem.linkedIncidentIds = problem.linkedIncidentIds.filter((id) => id !== incidentId);
      return formatProblem(problem);
    }
    throw err;
  }
};

const linkCiToProblemRecord = async (problemId, organisationId, ciId) => {
  if (useMockData) {
    const problem = mockProblems.find((p) => matchesId(p, problemId));
    if (!problem) return null;
    if (organisationId && problem.organisationId !== organisationId) return null;

    if (!problem.linkedCiIds.includes(ciId)) {
      problem.linkedCiIds.push(ciId);
    }
    return formatProblem(problem);
  }

  try {
    const existing = await getProblemById(problemId, organisationId);
    if (!existing) return null;

    return getProblemById(existing.id, organisationId);
  } catch (err) {
    if (allowOfflineMocks) {
      const problem = mockProblems.find((p) => matchesId(p, problemId));
      if (!problem || (organisationId && problem.organisationId !== organisationId)) return null;
      if (!problem.linkedCiIds.includes(ciId)) problem.linkedCiIds.push(ciId);
      return formatProblem(problem);
    }
    throw err;
  }
};

const unlinkCiFromProblemRecord = async (problemId, organisationId, ciId) => {
  if (useMockData) {
    const problem = mockProblems.find((p) => matchesId(p, problemId));
    if (!problem) return null;
    if (organisationId && problem.organisationId !== organisationId) return null;

    problem.linkedCiIds = problem.linkedCiIds.filter((id) => id !== ciId);
    return formatProblem(problem);
  }

  try {
    const existing = await getProblemById(problemId, organisationId);
    if (!existing) return null;
    return getProblemById(existing.id, organisationId);
  } catch (err) {
    if (allowOfflineMocks) {
      const problem = mockProblems.find((p) => matchesId(p, problemId));
      if (!problem || (organisationId && problem.organisationId !== organisationId)) return null;
      problem.linkedCiIds = problem.linkedCiIds.filter((id) => id !== ciId);
      return formatProblem(problem);
    }
    throw err;
  }
};

const addProblemLogEntry = async (problemId, organisationId, entry) => {
  const now = new Date().toISOString();
  const logItem = {
    id: `LOG-${Date.now().toString().slice(-4)}`,
    author: entry.author || 'System',
    content: entry.content,
    type: entry.type || 'note',
    createdAt: now,
  };

  if (useMockData) {
    const problem = mockProblems.find((p) => matchesId(p, problemId));
    if (!problem) return null;
    if (organisationId && problem.organisationId !== organisationId) return null;

    if (!problem.logs) problem.logs = [];
    problem.logs.push(logItem);
    return logItem;
  }

  try {
    const existing = await getProblemById(problemId, organisationId);
    if (!existing) return null;
    return logItem;
  } catch (err) {
    if (allowOfflineMocks) {
      const problem = mockProblems.find((p) => matchesId(p, problemId));
      if (!problem || (organisationId && problem.organisationId !== organisationId)) return null;
      if (!problem.logs) problem.logs = [];
      problem.logs.push(logItem);
      return logItem;
    }
    throw err;
  }
};

module.exports = {
  getProblems,
  getProblemById,
  createProblemRecord,
  updateProblemRecord,
  deleteProblemRecord,
  linkIncidentsToProblem,
  unlinkIncidentFromProblem,
  linkCiToProblemRecord,
  unlinkCiFromProblemRecord,
  addProblemLogEntry,
};
