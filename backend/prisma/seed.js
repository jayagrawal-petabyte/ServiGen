'use strict';

const env = require('../src/config/env');
if (env.isProduction) {
  throw new Error('Sample seed accounts are development-only');
}

const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

async function main() {
  console.log('[servigen:seed] Seeding database...');

  // 1. Seed Organisations
  const acme = await db.organisation.upsert({
    where: { domain: 'acme.com' },
    update: {},
    create: {
      id: 'org-001',
      name: 'Acme Corp',
      domain: 'acme.com',
      tier: 'Enterprise',
    },
  });

  const globex = await db.organisation.upsert({
    where: { domain: 'globex.com' },
    update: {},
    create: {
      id: 'org-002',
      name: 'Globex Corp',
      domain: 'globex.com',
      tier: 'Standard',
    },
  });

  // 2. Seed Sites
  const londonSite = await db.site.upsert({
    where: { id: 'site-london' },
    update: {},
    create: {
      id: 'site-london',
      name: 'London HQ',
      timezone: 'Europe/London',
      organisationId: acme.id,
    },
  });

  const nySite = await db.site.upsert({
    where: { id: 'site-ny' },
    update: {},
    create: {
      id: 'site-ny',
      name: 'New York',
      timezone: 'America/New_York',
      organisationId: globex.id,
    },
  });

  // 3. Seed Users with distinct secure passwords
  const adminPasswordHash = await bcrypt.hash('Adm!n#9vK2$7xLq', 10);
  const agentPasswordHash = await bcrypt.hash('Ag3nt*8mP4!wR9t', 10);
  const approverPasswordHash = await bcrypt.hash('Appr0v#5zY1$kE3s', 10);
  const userPasswordHash = await bcrypt.hash('Us3r@4bT7&mQ6wV', 10);
  const supportPasswordHash = await bcrypt.hash('Supp0rt!2xL8^pD5', 10);

  const admin1 = await db.user.upsert({
    where: { email: 'admin@servigen.local' },
    update: {
      username: 'admin001',
      passwordHash: adminPasswordHash,
      role: 'Admin',
      organisationId: acme.id,
      siteId: londonSite.id,
    },
    create: {
      id: 'admin-001',
      email: 'admin@servigen.local',
      username: 'admin001',
      passwordHash: adminPasswordHash,
      firstName: 'Adam',
      lastName: 'Admin',
      role: 'Admin',
      organisationId: acme.id,
      siteId: londonSite.id,
    },
  });

  const agent1 = await db.user.upsert({
    where: { email: 'agent001@servigen.local' },
    update: {
      username: 'agent001',
      passwordHash: agentPasswordHash,
      role: 'Service Agent',
      organisationId: acme.id,
      siteId: londonSite.id,
    },
    create: {
      id: 'agent-001',
      email: 'agent001@servigen.local',
      username: 'agent001',
      passwordHash: agentPasswordHash,
      firstName: 'Alex',
      lastName: 'Agent',
      role: 'Service Agent',
      organisationId: acme.id,
      siteId: londonSite.id,
    },
  });

  await db.user.upsert({
    where: { email: 'approver001@servigen.local' },
    update: {
      username: 'approver001',
      passwordHash: approverPasswordHash,
      role: 'Approver',
      organisationId: acme.id,
      siteId: londonSite.id,
    },
    create: {
      id: 'approver-001',
      email: 'approver001@servigen.local',
      username: 'approver001',
      passwordHash: approverPasswordHash,
      firstName: 'Alice',
      lastName: 'Approver',
      role: 'Approver',
      organisationId: acme.id,
      siteId: londonSite.id,
    },
  });

  await db.user.upsert({
    where: { email: 'user001@servigen.local' },
    update: {
      username: 'user001',
      passwordHash: userPasswordHash,
      role: 'Service User',
      organisationId: globex.id,
      siteId: nySite.id,
    },
    create: {
      id: 'user-001',
      email: 'user001@servigen.local',
      username: 'user001',
      passwordHash: userPasswordHash,
      firstName: 'Sam',
      lastName: 'User',
      role: 'Service User',
      organisationId: globex.id,
      siteId: nySite.id,
    },
  });

  await db.user.upsert({
    where: { email: 'support001@servigen.local' },
    update: {
      username: 'support001',
      passwordHash: supportPasswordHash,
      role: 'Support Team User',
      organisationId: acme.id,
      siteId: londonSite.id,
    },
    create: {
      id: 'support-001',
      email: 'support001@servigen.local',
      username: 'support001',
      passwordHash: supportPasswordHash,
      firstName: 'Sarah',
      lastName: 'Support',
      role: 'Support Team User',
      organisationId: acme.id,
      siteId: londonSite.id,
    },
  });

  // 4. Seed Configuration Items (CMDB)
  await db.configurationItem.upsert({
    where: { tag: 'PAY-001' },
    update: {},
    create: {
      id: 'CI-001',
      name: 'Payment Server',
      type: 'Server',
      tag: 'PAY-001',
      siteName: 'Chennai',
      status: 'Active',
      businessOwner: 'Finance',
    },
  });

  await db.configurationItem.upsert({
    where: { tag: 'DB-001' },
    update: {},
    create: {
      id: 'CI-002',
      name: 'Customer Database',
      type: 'Database',
      tag: 'DB-001',
      siteName: 'Chennai',
      status: 'Active',
      businessOwner: 'Technology',
    },
  });

  // 5. Seed Change Requests
  await db.changeRequest.upsert({
    where: { id: 'CR-001' },
    update: {},
    create: {
      id: 'CR-001',
      summary: 'Upgrade database server to v14',
      changeType: 'Normal',
      status: 'Active',
      ciId: 'CI-002',
      assignedAgentId: agent1.id,
      ciTag: 'DB-001',
      relatedService: 'Customer Database',
      startDate: new Date('2026-10-01T00:00:00Z'),
      endDate: new Date('2026-10-02T04:00:00Z'),
    },
  });

  // 6. Seed Projects & Subtasks
  const project1 = await db.project.upsert({
    where: { id: 'P-001' },
    update: {},
    create: {
      id: 'P-001',
      name: 'Network Upgrade',
      status: 'ACTIVE',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-10-15'),
      timeSpent: 42,
    },
  });

  await db.projectSubtask.upsert({
    where: { id: 'ST-001' },
    update: {},
    create: {
      id: 'ST-001',
      projectId: project1.id,
      title: 'Router Configuration',
      status: 'COMPLETED',
    },
  });

  await db.projectSubtask.upsert({
    where: { id: 'ST-002' },
    update: {},
    create: {
      id: 'ST-002',
      projectId: project1.id,
      title: 'Network Testing',
      status: 'PENDING',
    },
  });

  // 7. Seed Tickets
  await db.ticket.upsert({
    where: { id: 'INC-1001' },
    update: {},
    create: {
      id: 'INC-1001',
      summary: 'VPN connection dropping intermittently for remote users',
      priority: 'High',
      status: 'Active',
      ticketType: 'Incident',
      organisationId: acme.id,
      siteName: 'London HQ',
      assignedAgentId: agent1.id,
      slaTimeLeft: 180,
      timeRecord: 45,
    },
  });

  await db.ticket.upsert({
    where: { id: 'REQ-1002' },
    update: {},
    create: {
      id: 'REQ-1002',
      summary: 'Request for administrator rights on developer workstation',
      priority: 'Medium',
      status: 'Pending',
      ticketType: 'Service Request',
      organisationId: globex.id,
      siteName: 'New York',
      assignedAgentId: agent1.id,
      slaTimeLeft: 360,
      timeRecord: 20,
      holdReason: 'Awaiting manager approval',
    },
  });


  await db.team.upsert({where:{name:'1st Line Support'},update:{},create:{id:'team-001',name:'1st Line Support'}});
  await db.teamMembership.upsert({where:{teamId_userId:{teamId:'team-001',userId:agent1.id}},update:{},create:{teamId:'team-001',userId:agent1.id}});
  await db.ticket.update({where:{id:'INC-1001'},data:{teamId:'team-001'}});
  await db.incident.upsert({where:{ticketId:'INC-1001'},update:{},create:{id:'incident-001',ticketId:'INC-1001',category:'Network'}});
  const serviceCatalogueSeeds = [
    { id: 'service-admin-rights', name: 'Administrator Rights', description: 'Request administrator access to your device.', icon: '⚙️', category: 'End-User Catalogue', requiresApproval: true },
    { id: 'service-laptop', name: 'Request a Laptop', description: 'Standard high-performance laptop for developers.', icon: '🖥️', category: 'End-User Catalogue', requiresApproval: true },
    { id: 'service-vpn', name: 'VPN Access', description: 'Secure remote corporate network access token.', icon: '🔒', category: 'Access', requiresApproval: false },
    { id: 'service-adobe', name: 'Adobe Creative Cloud', description: 'Design and multimedia creative software suite.', icon: '🎨', category: 'Business Applications', requiresApproval: true },
    { id: 'service-crm', name: 'CRM Platform Support', description: 'Customer relationship management workspace support.', icon: '👥', category: 'Business Applications', requiresApproval: false },
    { id: 'service-data-integration', name: 'Data Integration', description: 'Enterprise application and data pipeline integration.', icon: '🧩', category: 'Business Applications', requiresApproval: true },
    { id: 'service-database-admin', name: 'Database Administration', description: 'Database schema migration and DBA provisioning support.', icon: '🗄️', category: 'Business Applications', requiresApproval: true },
    { id: 'service-desk-booking', name: 'Desk Booking', description: 'Hot-desk reservation and office seat relocation.', icon: '🪑', category: 'Services', requiresApproval: false },
    { id: 'service-air-con', name: 'Air Con & Climate', description: 'Report an office air conditioning or temperature issue.', icon: '❄️', category: 'Services', requiresApproval: false },
    { id: 'service-building-fabric', name: 'Building Fabric', description: 'Report facilities maintenance and infrastructure repairs.', icon: '🏢', category: 'Services', requiresApproval: false },
    { id: 'service-absence', name: 'Absence Management', description: 'Submit leave request or emergency attendance notification.', icon: '📅', category: 'End-User Catalogue', requiresApproval: true },
    { id: 'service-electrical', name: 'Electrical & Power', description: 'Report power outlet disruptions or UPS failures.', icon: '🔌', category: 'Services', requiresApproval: false }
  ];
  for (const s of serviceCatalogueSeeds) {
    await db.serviceCatalogueItem.upsert({
      where: { id: s.id },
      update: { name: s.name, description: s.description, icon: s.icon, category: s.category, requiresApproval: s.requiresApproval },
      create: { id: s.id, name: s.name, description: s.description, icon: s.icon, category: s.category, requiresApproval: s.requiresApproval }
    });
  }
  await db.serviceRequest.upsert({where:{ticketId:'REQ-1002'},update:{},create:{id:'request-001',ticketId:'REQ-1002',serviceCatalogueItemId:'service-admin-rights'}});
  await db.approval.upsert({where:{id:'APP-1001'},update:{},create:{id:'APP-1001',ticketId:'REQ-1002',entityType:'Service Request',entityId:'request-001',serviceRequestId:'request-001',summary:'Administrator rights request',approverId:'approver-001'}});

  // 8. Seed Major Incidents
  const majorIncidentsSeed = [
    {
      id: '0002673',
      title: 'System Login Failure',
      description: 'Widespread authentication timeouts and system login failures impacting MyFinance PROD users.',
      status: 'Investigating',
      priority: 'P1',
      impact: 'Critical customer login failure; users unable to access MyFinance PROD platform.',
      affectedServices: ['MyFinance PROD', 'Authentication Gateway', 'SSO Service'],
      commander: 'Demo User',
      startedAt: new Date('2025-11-02T16:57:00Z'),
    },
    {
      id: '0002672',
      title: 'Financial Data Corruption',
      description: 'Ledger synchronization discrepancy detected in MyFinance PROD database replica cluster.',
      status: 'Investigating',
      priority: 'P2',
      impact: 'High performance degradation and reconciliation queue lag.',
      affectedServices: ['MyFinance PROD', 'Ledger Sync', 'Reconciliation Engine'],
      commander: 'Jennifer Williams',
      startedAt: new Date('2025-11-02T16:56:00Z'),
    },
    {
      id: '0002671',
      title: 'Payment Processing Failure',
      description: 'Merchant payment tokenization service returning intermittent 502 Bad Gateway errors.',
      status: 'Investigating',
      priority: 'P1',
      impact: 'Payment gateway transactions failing for 15% of checkout traffic.',
      affectedServices: ['MyFinance PROD', 'Payment Processing', 'Merchant Gateway'],
      commander: 'Unassigned',
      startedAt: new Date('2025-11-02T16:52:00Z'),
    },
  ];

  for (const mi of majorIncidentsSeed) {
    await db.majorIncident.upsert({
      where: { id: mi.id },
      update: {
        title: mi.title,
        description: mi.description,
        status: mi.status,
        priority: mi.priority,
        impact: mi.impact,
        affectedServices: mi.affectedServices,
        commander: mi.commander,
      },
      create: mi,
    });
  }

  console.log('[servigen:seed] Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('[servigen:seed] Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    if (db && typeof db.$disconnect === 'function') {
      await db.$disconnect();
    }
  });
