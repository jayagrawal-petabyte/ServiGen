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
 * Return the latest new tickets, limited by count (SCR-015)
 */
const getNewTickets = async (limit = 10) => newTickets.slice(0, limit);

module.exports = {
  getKpis,
  getMoodEntries,
  saveMoodEntry,
  getTeamBreakdown,
  getCategoryBreakdown,
  getNewTickets,
};
