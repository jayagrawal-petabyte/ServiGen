/**
 * In-memory data store for the Dashboard module.
 * Provides KPI aggregation, mood check-in, team/category breakdown,
 * and new ticket panel data per SCR-002, SCR-014, SCR-015.
 *
 * Isolated repository pattern — async accessors allow future migration
 * to Supabase/Prisma without changing the service layer.
 */

// ─── KPI Seed Data ────────────────────────────────────────────────────────────

const kpiData = {
  openIncidents: 42,
  slaBreaches: 7,
  avgResolutionTimeMinutes: 185,
  lastUpdatedAt: '2026-10-03T02:00:00.000Z',
};

// ─── Mood Check-in Store ──────────────────────────────────────────────────────

const moodEntries = [
  { agentId: 'agent-001', mood: 'Good', submittedAt: '2026-10-03T08:00:00.000Z' },
  { agentId: 'agent-002', mood: 'Neutral', submittedAt: '2026-10-03T07:45:00.000Z' },
];

// ─── Personalized Summary Seed Data (SCR-002) ─────────────────────────────────

// Pending approvals awaiting each agent's action
const agentApprovals = [
  { agentId: 'agent-001', pendingCount: 3 },
  { agentId: 'agent-002', pendingCount: 1 },
];

// Work items assigned to each agent (e.g. linked tasks from tickets)
const agentAssignments = [
  { agentId: 'agent-001', totalCount: 4 },
  { agentId: 'agent-002', totalCount: 2 },
];

// Standalone tasks (checklist / follow-up items) for each agent
const agentTasks = [
  { agentId: 'agent-001', totalCount: 2 },
  { agentId: 'agent-002', totalCount: 0 },
];

// ─── Team Breakdown Seed Data ─────────────────────────────────────────────────

const teamBreakdown = [
  { team: '1st Line Support', openIncidents: 24, slaBreach: 3 },
  { team: '2nd Line Support', openIncidents: 12, slaBreach: 3 },
  { team: 'Major Incidents', openIncidents: 6, slaBreach: 1 },
];

// ─── Category Breakdown Seed Data ─────────────────────────────────────────────

const categoryBreakdown = [
  { category: 'Network', count: 15 },
  { category: 'Hardware', count: 10 },
  { category: 'Software', count: 9 },
  { category: 'Access & Identity', count: 5 },
  { category: 'Email & Collaboration', count: 3 },
];

// ─── New Tickets Seed Data ────────────────────────────────────────────────────

const newTickets = [
  {
    id: 'INC-2001',
    summary: 'Printer not responding on 3rd floor',
    priority: 'Low',
    ticketType: 'Incident',
    organisation: 'Acme Corp',
    createdAt: '2026-10-03T07:55:00.000Z',
  },
  {
    id: 'REQ-2002',
    summary: 'Software licence request for Adobe Creative Suite',
    priority: 'Medium',
    ticketType: 'Service Request',
    organisation: 'Globex Corp',
    createdAt: '2026-10-03T07:40:00.000Z',
  },
  {
    id: 'INC-2003',
    summary: 'SSL certificate expiry warning on prod API gateway',
    priority: 'High',
    ticketType: 'Incident',
    organisation: 'Initech',
    createdAt: '2026-10-03T07:20:00.000Z',
  },
  {
    id: 'INC-2004',
    summary: 'Payroll system unavailable before month-end run',
    priority: 'Critical',
    ticketType: 'Incident',
    organisation: 'Massive Dynamic',
    createdAt: '2026-10-03T06:50:00.000Z',
  },
];

// ─── Accessor Functions ───────────────────────────────────────────────────────

/**
 * Return the current KPI snapshot (SCR-014)
 */
const getKpis = async () => ({ ...kpiData });

/**
 * Return all mood entries, optionally scoped to a single agent (SCR-014)
 */
const getMoodEntries = async (agentId = null) => {
  if (agentId) {
    return moodEntries.filter((e) => e.agentId === agentId);
  }
  return [...moodEntries];
};

const db = require('../../config/db');

/**
 * Save a new mood check-in for an agent. Replaces any existing entry for today (SCR-014)
 */
const saveMoodEntry = async (agentId, mood) => {
  const existingIndex = moodEntries.findIndex((e) => e.agentId === agentId);
  const entry = { agentId, mood, submittedAt: new Date().toISOString() };
  if (existingIndex >= 0) {
    moodEntries[existingIndex] = entry;
  } else {
    moodEntries.push(entry);
  }

  if (process.env.NODE_ENV !== 'test') {
    try {
      await db.agentMood.create({
        data: {
          agentId,
          mood,
        },
      });
    } catch (_err) {
      // Database connection fallback
    }
  }

  return entry;
};

/**
 * Return incidents-by-team breakdown (SCR-015)
 */
const getTeamBreakdown = async () => [...teamBreakdown];

/**
 * Return incidents-by-category breakdown (SCR-015)
 */
const getCategoryBreakdown = async () => [...categoryBreakdown];

/**
 * Return all new tickets — sorting and limiting are handled by the service layer.
 * BI-7 FIX: Previously sliced before sorting in the service, so the returned
 * "latest N" tickets could be wrong. The service now sorts all records first,
 * then truncates to the requested limit.
 */
const getNewTickets = async () => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const records = await db.ticket.findMany({
        include: { organisation: true },
        orderBy: { createdAt: 'desc' },
      });
      if (records && records.length > 0) {
        return records.map((t) => ({
          id: t.id,
          summary: t.summary,
          priority: t.priority,
          ticketType: t.ticketType,
          organisation: t.organisation?.name || 'Acme Corp',
          createdAt: t.createdAt.toISOString(),
        }));
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  return [...newTickets];
};

/**
 * Return raw summary data for a given agent (SCR-002)
 * Ticket status counts are derived at the service layer from the my-work model.
 */
const getAgentSummaryData = async (agentId) => {
  const approvals = agentApprovals.find((a) => a.agentId === agentId);
  const assignments = agentAssignments.find((a) => a.agentId === agentId);
  const tasks = agentTasks.find((a) => a.agentId === agentId);

  return {
    approvals: { pending: approvals ? approvals.pendingCount : 0 },
    assignments: { total: assignments ? assignments.totalCount : 0 },
    tasks: { total: tasks ? tasks.totalCount : 0 },
  };
};

module.exports = {
  getKpis,
  getMoodEntries,
  saveMoodEntry,
  getTeamBreakdown,
  getCategoryBreakdown,
  getNewTickets,
  getAgentSummaryData,
};
