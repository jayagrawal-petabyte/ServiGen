'use strict';

const { randomUUID } = require('crypto');
const db = require('../../config/db');

const mockProblems = [
  {
    id: 'PRB-1001',
    problemNumber: 'PRB-1001',
    summary: 'Intermittent VPN gateway drops during peak hours',
    description: 'Multiple users across London HQ report VPN disconnections between 08:30 and 10:00.',
    category: 'Network',
    priority: 'High',
    urgency: 'High',
    impact: 'High',
    status: 'Under Investigation',
    rootCause: null,
    workaround: 'Route remote workers through secondary backup gateway (vpn-backup.servigen.local).',
    knownError: true,
    assignedAgentId: 'agent-001',
    organisationId: 'org-001',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T10:30:00.000Z',
    linkedIncidentIds: ['INC-1001'],
  },
  {
    id: 'PRB-1002',
    problemNumber: 'PRB-1002',
    summary: 'Database connection pool exhaustion on reporting query',
    description: 'Long-running analytics reports exhaust PostgreSQL connection pool.',
    category: 'Database',
    priority: 'Critical',
    urgency: 'High',
    impact: 'High',
    status: 'Workaround Found',
    rootCause: 'Unindexed joins on ticket audit history table.',
    workaround: 'Execute heavy exports on read-replica during maintenance window only.',
    knownError: true,
    assignedAgentId: 'agent-002',
    organisationId: 'org-001',
    createdAt: '2026-10-02T11:00:00.000Z',
    updatedAt: '2026-10-02T14:15:00.000Z',
    linkedIncidentIds: [],
  },
];

const useMockData = process.env.NODE_ENV === 'test';
const allowOfflineMocks = process.env.ALLOW_OFFLINE_MOCKS === 'true';

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
  rootCause: p.rootCause || null,
  workaround: p.workaround || null,
  knownError: Boolean(p.knownError),
  assignedAgentId: p.assignedAgentId || null,
  organisationId: p.organisationId || null,
  createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
  linkedIncidentIds: p.linkedIncidentIds || (p.ticketLinks ? p.ticketLinks.map((tl) => tl.ticketId) : []),
});

const getProblems = async (filters = {}) => {
  const { organisationId, status, priority, category, knownError } = filters;

  if (useMockData) {
    return mockProblems
      .filter((p) => {
        if (organisationId && p.organisationId !== organisationId) return false;
        if (status && p.status !== status) return false;
        if (priority && p.priority !== priority) return false;
        if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
        if (knownError !== undefined && p.knownError !== knownError) return false;
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
    const p = mockProblems.find((item) => item.id === id);
    if (!p) return null;
    if (organisationId && p.organisationId !== organisationId) return null;
    return formatProblem(p);
  }

  try {
    const where = { id };
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
      const p = mockProblems.find((item) => item.id === id);
      if (!p || (organisationId && p.organisationId !== organisationId)) return null;
      return formatProblem(p);
    }
    throw err;
  }
};

const createProblemRecord = async (problemData) => {
  const {
    id = `PRB-${Date.now().toString().slice(-4)}`,
    summary,
    description,
    category = 'General',
    priority = 'Medium',
    urgency = 'Medium',
    impact = 'Medium',
    status = 'Open',
    rootCause = null,
    workaround = null,
    knownError = false,
    assignedAgentId = null,
    organisationId = null,
    incidentIds = [],
  } = problemData;

  const now = new Date().toISOString();

  if (useMockData) {
    const newProblem = {
      id,
      problemNumber: id,
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
      createdAt: now,
      updatedAt: now,
      linkedIncidentIds: [...incidentIds],
    };
    mockProblems.unshift(newProblem);
    return formatProblem(newProblem);
  }

  try {
    const created = await db.problem.create({
      data: {
        id,
        problemNumber: id,
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
      const newProblem = {
        id,
        problemNumber: id,
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
        createdAt: now,
        updatedAt: now,
        linkedIncidentIds: [...incidentIds],
      };
      mockProblems.unshift(newProblem);
      return formatProblem(newProblem);
    }
    throw err;
  }
};

const updateProblemRecord = async (id, organisationId, patch) => {
  const now = new Date().toISOString();

  if (useMockData) {
    const idx = mockProblems.findIndex((p) => p.id === id);
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
    const where = { id };
    if (organisationId) where.organisationId = organisationId;

    const existing = await db.problem.findFirst({ where });
    if (!existing) return null;

    const updated = await db.problem.update({
      where: { id },
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
      const idx = mockProblems.findIndex((p) => p.id === id);
      if (idx === -1 || (organisationId && mockProblems[idx].organisationId !== organisationId)) return null;
      mockProblems[idx] = { ...mockProblems[idx], ...patch, updatedAt: now };
      return formatProblem(mockProblems[idx]);
    }
    throw err;
  }
};

const linkIncidentsToProblem = async (problemId, organisationId, incidentIds) => {
  if (useMockData) {
    const problem = mockProblems.find((p) => p.id === problemId);
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
    const where = { id: problemId };
    if (organisationId) where.organisationId = organisationId;

    const problem = await db.problem.findFirst({ where });
    if (!problem) return null;

    await db.ticketLink.createMany({
      data: incidentIds.map((ticketId) => ({
        ticketId,
        problemId,
        relationType: 'PROBLEM_INVESTIGATION',
        organisationId,
      })),
      skipDuplicates: true,
    });

    return getProblemById(problemId, organisationId);
  } catch (err) {
    if (allowOfflineMocks) {
      const p = mockProblems.find((item) => item.id === problemId);
      if (!p || (organisationId && p.organisationId !== organisationId)) return null;
      incidentIds.forEach((inc) => {
        if (!p.linkedIncidentIds.includes(inc)) p.linkedIncidentIds.push(inc);
      });
      return formatProblem(p);
    }
    throw err;
  }
};

module.exports = {
  getProblems,
  getProblemById,
  createProblemRecord,
  updateProblemRecord,
  linkIncidentsToProblem,
};
