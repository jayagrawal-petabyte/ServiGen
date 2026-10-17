'use strict';

const db = require('../src/config/db');
const fs = require('fs');
const path = require('path');

// Parse minutes from SLA string like "-88:01", "-64:00", "+12:30", "05:05"
function parseSlaMinutes(slaStr) {
  if (!slaStr) return -60;
  const isNeg = slaStr.startsWith('-');
  const clean = slaStr.replace(/^[-+]/, '');
  const parts = clean.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const mins = parseInt(parts[1], 10) || 0;
  const total = hours * 60 + mins;
  return isNeg ? -total : total;
}

// Parse date string like "20/07/2026"
function parseDateLogged(dateStr) {
  if (!dateStr) return new Date('2026-07-20T10:00:00Z');
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return new Date(`${year}-${month}-${day}T09:00:00Z`);
  }
  return new Date('2026-07-20T10:00:00Z');
}

async function seedSupportTeams() {
  console.log('[seedSupportTeams] Seeding support teams, agents, and live tickets...');

  // 1. Teams
  const team1 = await db.team.upsert({
    where: { name: '1st Line Support' },
    update: {},
    create: { id: 'team-001', name: '1st Line Support' },
  });

  const team2 = await db.team.upsert({
    where: { name: '2nd Line Support' },
    update: {},
    create: { id: 'team-002', name: '2nd Line Support' },
  });

  const team3 = await db.team.upsert({
    where: { name: 'Infrastructure' },
    update: {},
    create: { id: 'team-003', name: 'Infrastructure' },
  });

  // 2. Agents
  const agentsData = [
    { id: 'agent-demo', firstName: 'Demo', lastName: 'User', email: 'demouser@servigen.local' },
    { id: 'agent-james', firstName: 'James', lastName: 'Brown', email: 'jbrown@servigen.local' },
    { id: 'agent-jennifer', firstName: 'Jennifer', lastName: 'Williams', email: 'jwilliams@servigen.local' },
    { id: 'agent-david', firstName: 'David', lastName: 'Chen', email: 'dchen@servigen.local' },
    { id: 'agent-elena', firstName: 'Elena', lastName: 'Rostova', email: 'erostova@servigen.local' },
  ];

  for (const a of agentsData) {
    await db.user.upsert({
      where: { email: a.email },
      update: {
        firstName: a.firstName,
        lastName: a.lastName,
        role: 'Service Agent',
        organisationId: 'org-001',
      },
      create: {
        id: a.id,
        email: a.email,
        username: a.id,
        passwordHash: '$2a$10$Qbs0WP3.81gyx1EPvvyC9ep.ARyvKxWrGKFQJFmZU2UOA4kF7FW6.',
        firstName: a.firstName,
        lastName: a.lastName,
        role: 'Service Agent',
        organisationId: 'org-001',
      },
    });
  }

  // 3. Team Memberships
  const memberships = [
    { teamId: team1.id, userId: 'agent-001' },
    { teamId: team1.id, userId: 'agent-demo' },
    { teamId: team1.id, userId: 'agent-james' },
    { teamId: team1.id, userId: 'agent-jennifer' },

    { teamId: team2.id, userId: 'support-001' },
    { teamId: team2.id, userId: 'agent-demo' },
    { teamId: team2.id, userId: 'agent-david' },
    { teamId: team2.id, userId: 'agent-elena' },

    { teamId: team3.id, userId: 'agent-demo' },
    { teamId: team3.id, userId: 'agent-jennifer' },
  ];

  for (const m of memberships) {
    await db.teamMembership.upsert({
      where: { teamId_userId: { teamId: m.teamId, userId: m.userId } },
      update: {},
      create: { teamId: m.teamId, userId: m.userId },
    });
  }

  // 4. Extract tickets from teamIncidents.data.ts
  const dataFilePath = path.resolve(__dirname, '../../src/pages/TeamIncidents/teamIncidents.data.ts');
  const sourceCode = fs.readFileSync(dataFilePath, 'utf8');

  // Match objects inside INITIAL_ALL_TEAM_INCIDENTS
  const blockRegex = /\{\s*id:\s*"([^"]+)",\s*sla:\s*"([^"]+)",\s*summary:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*agent:\s*"([^"]+)",\s*priority:\s*"([^"]+)",\s*status:\s*"([^"]+)",\s*type:\s*"([^"]+)",\s*team:\s*"([^"]+)"(?:,\s*isStarred:\s*(true|false))?,\s*dateLogged:\s*"([^"]+)",?\s*\}/g;

  let match;
  let count = 0;

  const agentNameToId = {
    'Demo User': 'agent-demo',
    'James Brown': 'agent-james',
    'Jennifer Williams': 'agent-jennifer',
    'David Chen': 'agent-david',
    'Elena Rostova': 'agent-elena',
    'Alex Agent': 'agent-001',
  };

  const teamNameToId = {
    '1st Line Support': team1.id,
    '2nd Line Support': team2.id,
    'Infrastructure': team3.id,
  };

  while ((match = blockRegex.exec(sourceCode)) !== null) {
    const [
      _,
      id,
      sla,
      summary,
      category,
      agent,
      priority,
      status,
      type,
      team,
      isStarred,
      dateLogged,
    ] = match;

    const assignedAgentId = agentNameToId[agent] || null;
    const teamId = teamNameToId[team] || team1.id;
    const slaMinutes = parseSlaMinutes(sla);
    const createdAt = parseDateLogged(dateLogged);

    // Map status to canonical DB status ('Active', 'Actioned', 'Pending', 'On Hold')
    let dbStatus = 'Active';
    if (status === 'In Progress') dbStatus = 'Actioned';
    else if (status === 'On Hold') dbStatus = 'On Hold';
    else if (status === 'Pending') dbStatus = 'Pending';
    else dbStatus = 'Active';

    // Upsert ticket
    await db.ticket.upsert({
      where: { id },
      update: {
        summary,
        priority,
        status: dbStatus,
        ticketType: type || 'Incident',
        organisationId: 'org-001',
        siteName: 'London HQ',
        assignedAgentId,
        teamId,
        assignedTeam: team,
        slaTimeLeft: slaMinutes,
        updatedAt: new Date(),
      },
      create: {
        id,
        summary,
        description: summary,
        priority,
        status: dbStatus,
        ticketType: type || 'Incident',
        organisationId: 'org-001',
        siteName: 'London HQ',
        assignedAgentId,
        teamId,
        assignedTeam: team,
        slaTimeLeft: slaMinutes,
        createdAt,
        updatedAt: createdAt,
      },
    });

    // Upsert incident detail
    await db.incident.upsert({
      where: { ticketId: id },
      update: {
        category,
        impact: priority === 'Critical' ? 'High' : 'Low',
        urgency: priority === 'Critical' ? 'High' : 'Low',
      },
      create: {
        ticketId: id,
        category,
        impact: priority === 'Critical' ? 'High' : 'Low',
        urgency: priority === 'Critical' ? 'High' : 'Low',
      },
    });

    count++;
  }

  console.log(`[seedSupportTeams] Successfully seeded ${count} tickets into SQLite DB!`);
}

seedSupportTeams()
  .catch((err) => {
    console.error('[seedSupportTeams] Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
