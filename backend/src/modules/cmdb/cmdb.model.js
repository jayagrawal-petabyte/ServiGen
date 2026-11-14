'use strict';

const db = require('../../config/db');
const { handleDbError } = require('../../shared/utils/db-guard');

const mockConfigurationItems = [
  {
    id: 'CI-001',
    name: 'Payment Server',
    type: 'Server',
    tag: 'PAY-001',
    site: 'Chennai',
    status: 'Active',
    lifecycleStatus: 'Deployed',
    businessOwner: 'Finance',
    environment: 'Production',
    ipAddress: '192.168.1.10',
    operatingSystem: 'Ubuntu 22.04 LTS',
    supportTeam: 'Infrastructure',
    organisationId: 'org-001',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'CI-002',
    name: 'Customer Database',
    type: 'Database',
    tag: 'DB-001',
    site: 'London Primary DC (Lon-01)',
    status: 'Active',
    lifecycleStatus: 'Deployed',
    businessOwner: 'Technology',
    environment: 'Production',
    ipAddress: '192.168.1.20',
    operatingSystem: 'PostgreSQL 15',
    supportTeam: 'Database Team',
    organisationId: 'org-001',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'CI-1002',
    name: 'Payment Gateway Application Server',
    type: 'Server',
    tag: 'PAY-001',
    site: 'London Primary DC (Lon-01)',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Finance & Payments',
    technicalContact: 'Sarah Jenkins',
    environment: 'Production',
    activeIncidentsCount: 2,
    linkedChangesCount: 1,
    ipAddress: '10.240.14.88',
    lastUpdated: '18/10/2026',
    criticality: 'Tier 1 - Mission Critical',
    warrantyExpiry: '2026-12-31',
    specifications: {
      os: 'Red Hat Enterprise Linux 9.2',
      cpu: '16 vCPU',
      ram: '64 GB',
      storage: '500 GB NVMe',
      ipAddress: '10.240.14.88',
      macAddress: '00:1A:2B:88:99:AA',
      model: 'HPE ProLiant DL380 Gen10',
      rackLocation: 'Rack B-14, U10-U12',
    },
    relationships: [
      {
        type: 'depends_on',
        targetCiId: 'CI-1001',
        targetCiName: 'Primary PostgreSQL Database Cluster',
        targetCiTag: 'DB-001',
        direction: 'downstream',
      },
      {
        type: 'depends_on',
        targetCiId: 'CI-1008',
        targetCiName: 'Redis Session Cache Cluster',
        targetCiTag: 'CACHE-001',
        direction: 'downstream',
      },
    ],
    softwareLicenses: [],
    organisationId: 'org-001',
  },
  {
    id: 'CI-1003',
    name: 'Core Backbone Router 01',
    type: 'Network',
    tag: 'NET-001',
    site: 'London Primary DC (Lon-01)',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Network Infrastructure',
    technicalContact: 'Marcus Vance',
    environment: 'Production',
    activeIncidentsCount: 0,
    linkedChangesCount: 0,
    ipAddress: '10.240.0.1',
    lastUpdated: '15/10/2026',
    criticality: 'Tier 1 - Mission Critical',
    warrantyExpiry: '2026-12-31',
    specifications: {
      os: 'Cisco IOS XR 7.5',
      model: 'Cisco ASR 9901',
      rackLocation: 'Rack A-01, U40-U42',
      ipAddress: '10.240.0.1',
      macAddress: '00:00:0C:9F:F0:01',
    },
    relationships: [],
    softwareLicenses: [],
    organisationId: 'org-001',
  },
  {
    id: 'CI-1004',
    name: 'AWS Production Kubernetes Cluster (EKS)',
    type: 'Cloud Service',
    tag: 'AWS-001',
    site: 'AWS eu-west-1 (Ireland)',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Platform Engineering',
    technicalContact: 'Elena Rostova',
    environment: 'Production',
    activeIncidentsCount: 0,
    linkedChangesCount: 3,
    ipAddress: '52.214.0.0/16',
    lastUpdated: '19/10/2026',
    criticality: 'Tier 1 - Mission Critical',
    warrantyExpiry: '2026-12-31',
    specifications: {
      os: 'Amazon Linux 2 (EKS Node AMI)',
      cpu: '64 vCPU Total',
      ram: '256 GB Pool',
      model: 'm6i.4xlarge Node Group (4 instances)',
      ipAddress: '52.214.0.0/16',
    },
    relationships: [
      {
        type: 'depends_on',
        targetCiId: 'CI-1001',
        targetCiName: 'Primary PostgreSQL Database Cluster',
        targetCiTag: 'DB-001',
        direction: 'downstream',
      },
    ],
    softwareLicenses: [],
    organisationId: 'org-001',
  },
  {
    id: 'CI-1005',
    name: 'Perimeter Web Application Firewall (WAF)',
    type: 'Security',
    tag: 'SEC-001',
    site: 'Cloudflare Edge / Lon-01',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Information Security',
    technicalContact: 'Aisha Al-Mansoor',
    environment: 'Production',
    activeIncidentsCount: 0,
    linkedChangesCount: 0,
    ipAddress: '198.51.100.4',
    lastUpdated: '12/10/2026',
    criticality: 'Tier 1 - Mission Critical',
    warrantyExpiry: '2026-12-31',
    specifications: {
      model: 'Cloudflare Enterprise WAF / F5 BIG-IP i5800',
      ipAddress: '198.51.100.4',
    },
    relationships: [],
    softwareLicenses: [],
    organisationId: 'org-001',
  },
  {
    id: 'CI-1006',
    name: 'Customer Portal Web App',
    type: 'Application',
    tag: 'APP-001',
    site: 'Bangalore',
    status: 'Inactive',
    lifecycleStatus: 'Maintenance',
    businessOwner: 'Human Resources',
    environment: 'Staging',
    ipAddress: '10.0.0.15',
    operatingSystem: 'RHEL 9',
    supportTeam: 'App Support',
    organisationId: 'org-001',
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-10-05T11:00:00.000Z',
  },
  {
    id: 'CI-1007',
    name: 'SAN Backup Storage Vault',
    type: 'Server',
    tag: 'SAN-001',
    site: 'London Secondary DC (Lon-02)',
    status: 'Active',
    lifecycleStatus: 'Deployed',
    businessOwner: 'Technology',
    environment: 'Production',
    ipAddress: '192.168.1.30',
    operatingSystem: 'Alpine Linux',
    supportTeam: 'Infrastructure',
    organisationId: 'org-001',
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'CI-005',
    name: 'Core Network Switch',
    type: 'Network',
    tag: 'NET-001',
    site: 'Chennai',
    status: 'Active',
    lifecycleStatus: 'Deployed',
    businessOwner: 'Infrastructure',
    environment: 'Production',
    ipAddress: '192.168.1.1',
    operatingSystem: 'Cisco IOS-XE',
    supportTeam: 'Network Ops',
    organisationId: 'org-001',
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-10-12T12:00:00.000Z',
  },
];

const mockDependencies = [
  {
    id: 'DEP-001',
    sourceCiId: 'CI-001',
    targetCiId: 'CI-002',
    relationType: 'DEPENDS_ON',
    impactLevel: 'Critical',
    organisationId: 'org-001',
  },
  {
    id: 'DEP-002',
    sourceCiId: 'CI-004',
    targetCiId: 'CI-001',
    relationType: 'CONNECTS_TO',
    impactLevel: 'High',
    organisationId: 'org-001',
  },
];

const ciAttributesStore = new Map();

const formatCi = (ci) => {
  const extra = ciAttributesStore.get(ci.id) || {};
  return {
    id: ci.id,
    name: extra.name || ci.name,
    type: extra.type || ci.type,
    tag: ci.tag,
    site: ci.siteName || ci.site || 'Chennai',
    status: extra.status || ci.status || 'Active',
    lifecycleStatus: extra.lifecycleStatus || ci.lifecycleStatus || 'Deployed',
    businessOwner: extra.businessOwner || ci.businessOwner || 'Technology',
    environment: extra.environment || ci.environment || 'Production',
    ipAddress: extra.ipAddress !== undefined ? extra.ipAddress : (ci.ipAddress || null),
    operatingSystem: extra.operatingSystem !== undefined ? extra.operatingSystem : (ci.operatingSystem || null),
    supportTeam: extra.supportTeam !== undefined ? extra.supportTeam : (ci.supportTeam || null),
    organisationId: ci.organisationId || (ci.site?.organisationId || null),
    createdAt: ci.createdAt instanceof Date ? ci.createdAt.toISOString() : (ci.createdAt || new Date().toISOString()),
    updatedAt: ci.updatedAt instanceof Date ? ci.updatedAt.toISOString() : (ci.updatedAt || new Date().toISOString()),
  };
};

const getConfigurationItems = async (options = {}) => {
  const { organisationId } = options;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const records = await db.configurationItem.findMany({
        include: {
          site: {
            select: { organisationId: true },
          },
        },
      });
      const formatted = records.map(formatCi);

      if (records && records.length > 0) {
        // Merge DB records with any rich mock/in-memory attributes
        const formatted = records.map((ci) => {
          const inMem = findCiRecord(ci.id) || findCiRecord(ci.tag);
          return {
            id: ci.id,
            name: ci.name,
            type: ci.type,
            tag: ci.tag,
            site: ci.siteName || (inMem && inMem.site) || 'London Primary DC (Lon-01)',
            status: ci.status || (inMem && inMem.status) || 'Active',
            lifecycleState: (inMem && inMem.lifecycleState) || 'Deployed',
            businessOwner: ci.businessOwner || (inMem && inMem.businessOwner) || 'Technology',
            technicalContact: (inMem && inMem.technicalContact) || 'Platform Operations',
            environment: (inMem && inMem.environment) || 'Production',
            ipAddress: (inMem && inMem.ipAddress) || null,
            activeIncidentsCount: (inMem && inMem.activeIncidentsCount) || 0,
            linkedChangesCount: (inMem && inMem.linkedChangesCount) || 0,
            criticality: (inMem && inMem.criticality) || 'Tier 2 - Business Operational',
            warrantyExpiry: (inMem && inMem.warrantyExpiry) || (inMem && inMem.specifications && inMem.specifications.warrantyExpiry) || undefined,
            specifications: (inMem && inMem.specifications) || {},
            relationships: (inMem && inMem.relationships) || [],
            softwareLicenses: (inMem && inMem.softwareLicenses) || [],
            organisationId: ci.site?.organisationId || (inMem && inMem.organisationId) || null,
            createdAt: ci.createdAt,
            updatedAt: ci.updatedAt,
          };
        });

        // Also include any newly created in-memory items that might not have been persisted to DB
        mockConfigurationItems.forEach((memItem) => {
          if (!formatted.some((f) => f.id === memItem.id || f.tag === memItem.tag)) {
            formatted.push(memItem);
          }
        });

        if (organisationId) {
          return formatted.filter(
            (item) => !item.organisationId || item.organisationId === organisationId
          );
        }
        return formatted;
      }
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  if (organisationId) {
    return mockConfigurationItems
      .filter((item) => !item.organisationId || item.organisationId === organisationId)
      .map(formatCi);
  }
  return mockConfigurationItems.map(formatCi);
};

const getConfigurationItemsByType = async (organisationId = null) => {
  const items = await getConfigurationItems({ organisationId });

  const groupedItems = Object.create(null);

  items.forEach((item) => {
    const type =
      typeof item.type === 'string' && item.type.trim() ? item.type.trim() : 'Unknown';
    if (!Object.prototype.hasOwnProperty.call(groupedItems, type)) {
      groupedItems[type] = [];
    }

    groupedItems[type].push(item);
  });

  return { ...groupedItems };
};

const getConfigurationItemById = async (id, organisationId = null) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const ci = await db.configurationItem.findFirst({
        where: {
          OR: [{ id }, { tag: id }],
        },
        include: {
          site: {
            select: { organisationId: true },
          },
        },
      });

      if (ci) {
        const formatted = formatCi(ci);
        if (organisationId && formatted.organisationId && formatted.organisationId !== organisationId) {
          return null;
        }
        return formatted;
      }
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
    }
  }

  const item = findCiRecord(id);
  if (!item) return null;
  if (organisationId && item.organisationId && item.organisationId !== organisationId) {
    return null;
  }
  return formatCi(item);
};

const createConfigurationItemRecord = async (ciData) => {
  const id = ciData.id || `CI-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();

  const newCi = {
    id,
    name: ciData.name,
    type: ciData.type,
    tag: ciData.tag,
    site: ciData.site || 'Chennai',
    siteName: ciData.site || 'Chennai',
    status: ciData.status || 'Active',
    lifecycleStatus: ciData.lifecycleStatus || 'Deployed',
    businessOwner: ciData.businessOwner || 'Technology',
    environment: ciData.environment || 'Production',
    ipAddress: ciData.ipAddress || null,
    operatingSystem: ciData.operatingSystem || null,
    supportTeam: ciData.supportTeam || null,
    organisationId: ciData.organisationId || null,
    createdAt: now,
    updatedAt: now,
  };

  if (process.env.NODE_ENV !== 'test') {
    try {
      const created = await db.configurationItem.create({
        data: {
          id: newCi.id,
          name: newCi.name,
          type: newCi.type,
          tag: newCi.tag,
          siteName: newCi.siteName,
          status: newCi.status,
          businessOwner: newCi.businessOwner,
          organisationId: newCi.organisationId,
        },
      });
      return formatCi({ ...newCi, ...created });
    } catch (err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw err;
      }
    }
  }

  mockConfigurationItems.unshift(newCi);
  return formatCi(newCi);
};

const updateConfigurationItemRecord = async (id, organisationId, patch) => {
  const now = new Date().toISOString();
  const currentAttrs = ciAttributesStore.get(id) || {};
  ciAttributesStore.set(id, { ...currentAttrs, ...patch });

  if (process.env.NODE_ENV !== 'test') {
    try {
      const existing = await db.configurationItem.findFirst({
        where: {
          id,
          ...(organisationId ? { organisationId } : {}),
        },
      });
      if (!existing) return null;

      const updated = await db.configurationItem.update({
        where: { id },
        data: {
          ...(patch.name ? { name: patch.name } : {}),
          ...(patch.type ? { type: patch.type } : {}),
          ...(patch.status ? { status: patch.status } : {}),
          ...(patch.businessOwner ? { businessOwner: patch.businessOwner } : {}),
          ...(patch.siteName ? { siteName: patch.siteName } : {}),
        },
      });
      return formatCi({ ...existing, ...patch, ...updated });
    } catch (err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw err;
      }
    }
  }

  const idx = mockConfigurationItems.findIndex((ci) => ci.id === id || ci.tag === id);
  if (idx === -1) return null;
  if (organisationId && mockConfigurationItems[idx].organisationId && mockConfigurationItems[idx].organisationId !== organisationId) {
    return null;
  }

  mockConfigurationItems[idx] = {
    ...mockConfigurationItems[idx],
    ...patch,
    updatedAt: now,
  };

  return formatCi(mockConfigurationItems[idx]);
};

const getCiDependencies = async (ciId, organisationId = null) => {
  const ci = await getConfigurationItemById(ciId, organisationId);
  if (!ci) return null;

  const allCis = await getConfigurationItems({ organisationId });
  const ciMap = new Map(allCis.map((item) => [item.id, item]));

  const orgDeps = mockDependencies.filter(
    (dep) => !organisationId || !dep.organisationId || dep.organisationId === organisationId
  );

  const upstream = orgDeps
    .filter((dep) => dep.sourceCiId === ci.id)
    .map((dep) => ({
      dependencyId: dep.id,
      relationType: dep.relationType,
      impactLevel: dep.impactLevel,
      targetCi: ciMap.get(dep.targetCiId) || { id: dep.targetCiId, name: 'Unknown CI' },
    }));

  const downstream = orgDeps
    .filter((dep) => dep.targetCiId === ci.id)
    .map((dep) => ({
      dependencyId: dep.id,
      relationType: dep.relationType,
      impactLevel: dep.impactLevel,
      dependentCi: ciMap.get(dep.sourceCiId) || { id: dep.sourceCiId, name: 'Unknown CI' },
    }));

  return {
    ci,
    upstream,
    downstream,
  };
};

const createCiDependencyRecord = async (sourceCiId, organisationId, data) => {
  const { targetCiId, relationType = 'DEPENDS_ON', impactLevel = 'High' } = data;
  const newDep = {
    id: `DEP-${Date.now().toString().slice(-4)}`,
    sourceCiId,
    targetCiId,
    relationType,
    impactLevel,
    organisationId,
  };

  mockDependencies.push(newDep);
  return newDep;
};

const getCiImpactData = async (ciId, organisationId = null) => {
  const ci = await getConfigurationItemById(ciId, organisationId);
  if (!ci) return null;

  const deps = await getCiDependencies(ciId, organisationId);

  // Active tickets linked to this CI
  let activeIncidents = [];
  try {
    const { getIncidents } = require('../incidents/incidents.model');
    const allIncidents = await getIncidents(organisationId ? { organisationId } : {});
    activeIncidents = allIncidents.filter(
      (inc) => ['Active', 'In Progress', 'Assigned'].includes(inc.status) &&
        (inc.ciId === ci.id || (inc.affectedCis && inc.affectedCis.includes(ci.id)))
    );
  } catch (_e) {}

  // Active change requests linked to this CI
  let ongoingChanges = [];
  try {
    const { getChangeRequests } = require('../change-requests/change-requests.model');
    const allChanges = await getChangeRequests(organisationId ? { organisationId } : {});
    ongoingChanges = allChanges.filter(
      (cr) => ['Pending Approval', 'Approved', 'Scheduled', 'Implementation'].includes(cr.status) &&
        (cr.ciId === ci.id || cr.ciTag === ci.tag)
    );
  } catch (_e) {}

  // Calculate overall impact risk
  let impactScore = 1;
  if (ci.environment === 'Production') impactScore += 2;
  if (deps.downstream.length > 0) impactScore += Math.min(deps.downstream.length, 3);
  if (activeIncidents.length > 0) impactScore += 2;
  if (ongoingChanges.length > 0) impactScore += 1;

  let riskLevel = 'Low';
  if (impactScore >= 6) riskLevel = 'Critical';
  else if (impactScore >= 4) riskLevel = 'High';
  else if (impactScore >= 3) riskLevel = 'Medium';

  return {
    ci,
    downstreamServicesCount: deps.downstream.length,
    dependentServices: deps.downstream.map((d) => d.dependentCi),
    activeIncidentsCount: activeIncidents.length,
    activeIncidents: activeIncidents.map((i) => ({ id: i.id, summary: i.summary, priority: i.priority, status: i.status })),
    ongoingChangesCount: ongoingChanges.length,
    ongoingChanges: ongoingChanges.map((c) => ({ id: c.id, summary: c.summary, changeType: c.changeType, status: c.status })),
    impactScore,
    riskLevel,
  };
};

const deleteCiDependencyRecord = async (sourceCiId, targetCiId, organisationId = null) => {
  const idx = mockDependencies.findIndex(
    (dep) =>
      dep.sourceCiId === sourceCiId &&
      dep.targetCiId === targetCiId &&
      (!organisationId || !dep.organisationId || dep.organisationId === organisationId)
  );
  if (idx === -1) return null;
  const removed = mockDependencies.splice(idx, 1)[0];
  return removed;
};

const getCiTopology = async (ciId, organisationId = null) => {
  const rootCi = await getConfigurationItemById(ciId, organisationId);
  if (!rootCi) return null;

  const allCis = await getConfigurationItems({ organisationId });
  const ciMap = new Map(allCis.map((c) => [c.id, c]));

  const orgDeps = mockDependencies.filter(
    (dep) => !organisationId || !dep.organisationId || dep.organisationId === organisationId
  );

  const nodes = new Map();
  const edges = [];
  const visited = new Set();

  const traverse = (currentId, depth = 0) => {
    if (depth > 10 || visited.has(currentId)) return;
    visited.add(currentId);

    const ci = ciMap.get(currentId);
    if (ci && !nodes.has(ci.id)) {
      nodes.set(ci.id, {
        id: ci.id,
        name: ci.name,
        type: ci.type,
        tag: ci.tag,
        status: ci.status,
        lifecycleStatus: ci.lifecycleStatus,
        environment: ci.environment,
      });
    }

    // Upstream (this CI depends on target)
    const upstreamDeps = orgDeps.filter((d) => d.sourceCiId === currentId);
    for (const dep of upstreamDeps) {
      if (!edges.some((e) => e.source === dep.sourceCiId && e.target === dep.targetCiId)) {
        edges.push({
          id: dep.id,
          source: dep.sourceCiId,
          target: dep.targetCiId,
          relationType: dep.relationType,
          impactLevel: dep.impactLevel,
          direction: 'upstream',
        });
      }
      traverse(dep.targetCiId, depth + 1);
    }

    // Downstream (source depends on this CI)
    const downstreamDeps = orgDeps.filter((d) => d.targetCiId === currentId);
    for (const dep of downstreamDeps) {
      if (!edges.some((e) => e.source === dep.sourceCiId && e.target === dep.targetCiId)) {
        edges.push({
          id: dep.id,
          source: dep.sourceCiId,
          target: dep.targetCiId,
          relationType: dep.relationType,
          impactLevel: dep.impactLevel,
          direction: 'downstream',
        });
      }
      traverse(dep.sourceCiId, depth + 1);
    }
  };

  traverse(rootCi.id, 0);

  return {
    rootCi: {
      id: rootCi.id,
      name: rootCi.name,
      type: rootCi.type,
      tag: rootCi.tag,
    },
    nodes: Array.from(nodes.values()),
    edges,
  };
};

const createConfigurationItem = async (payload, organisationId = null) => {
  const generatedId = payload.id || `CI-${Math.floor(1000 + Math.random() * 9000)}`;
  const prefix = (payload.type || 'SRV').slice(0, 3).toUpperCase();
  const generatedTag =
    (payload.tag && payload.tag.trim()) ||
    `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

  const newCi = {
    id: generatedId,
    name: payload.name.trim(),
    type: payload.type.trim(),
    tag: generatedTag,
    site: payload.site || payload.siteName || 'London Primary DC (Lon-01)',
    status: payload.status || 'Active',
    lifecycleState: payload.lifecycleState || 'Deployed',
    businessOwner: payload.businessOwner || 'Technology',
    technicalContact: payload.technicalContact || 'Platform Operations',
    environment: payload.environment || 'Production',
    ipAddress: payload.ipAddress || (payload.specifications && payload.specifications.ipAddress) || undefined,
    activeIncidentsCount: 0,
    linkedChangesCount: 0,
    criticality: payload.criticality || 'Tier 2 - Business Operational',
    warrantyExpiry: payload.warrantyExpiry || (payload.specifications && payload.specifications.warrantyExpiry) || undefined,
    specifications: payload.specifications || {
      ipAddress: payload.ipAddress || undefined,
      os: 'Ubuntu Linux 22.04 LTS',
      cpu: '8 vCPU',
      ram: '32 GB',
    },
    relationships: Array.isArray(payload.relationships) ? payload.relationships : [],
    softwareLicenses: Array.isArray(payload.softwareLicenses) ? payload.softwareLicenses : [],
    organisationId: organisationId || payload.organisationId || 'org-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (process.env.NODE_ENV !== 'test') {
    try {
      await db.configurationItem.create({
        data: {
          id: newCi.id,
          name: newCi.name,
          type: newCi.type,
          tag: newCi.tag,
          siteName: newCi.site,
          status: newCi.status,
          businessOwner: newCi.businessOwner,
        },
      });
    } catch (_err) {
      handleDbError('cmdb.createConfigurationItem', _err);
    }
  }

  // Prepend to in-memory store so it persists and is returned on subsequent fetches
  mockConfigurationItems.unshift(newCi);
  return newCi;
};

const updateConfigurationItem = async (id, payload, organisationId = null) => {
  const item = findCiRecord(id);
  if (!item) return null;

  if (organisationId && item.organisationId && item.organisationId !== organisationId) {
    return null;
  }

  if (payload.name !== undefined) item.name = String(payload.name).trim();
  if (payload.type !== undefined) item.type = String(payload.type).trim();
  if (payload.tag !== undefined) item.tag = String(payload.tag).trim();
  if (payload.site !== undefined) item.site = String(payload.site).trim();
  if (payload.siteName !== undefined) item.site = String(payload.siteName).trim();
  if (payload.status !== undefined) item.status = payload.status;
  if (payload.lifecycleState !== undefined) item.lifecycleState = payload.lifecycleState;
  if (payload.businessOwner !== undefined) item.businessOwner = payload.businessOwner;
  if (payload.technicalContact !== undefined) item.technicalContact = payload.technicalContact;
  if (payload.environment !== undefined) item.environment = payload.environment;
  if (payload.ipAddress !== undefined) item.ipAddress = payload.ipAddress;
  if (payload.criticality !== undefined) item.criticality = payload.criticality;
  if (payload.warrantyExpiry !== undefined) item.warrantyExpiry = payload.warrantyExpiry;

  if (payload.specifications && typeof payload.specifications === 'object') {
    item.specifications = {
      ...(item.specifications || {}),
      ...payload.specifications,
    };
  }

  if (Array.isArray(payload.softwareLicenses)) {
    item.softwareLicenses = payload.softwareLicenses;
  }

  item.updatedAt = new Date().toISOString();

  if (process.env.NODE_ENV !== 'test') {
    try {
      await db.configurationItem.update({
        where: { id: item.id },
        data: {
          name: item.name,
          type: item.type,
          tag: item.tag,
          siteName: item.site,
          status: item.status,
          businessOwner: item.businessOwner,
        },
      });
    } catch (_err) {
      handleDbError('cmdb.updateConfigurationItem', _err);
    }
  }

  return item;
};

const addCiRelationship = async (id, relationshipData, organisationId = null) => {
  const source = findCiRecord(id);
  if (!source) {
    return { error: 'SOURCE_NOT_FOUND' };
  }

  if (organisationId && source.organisationId && source.organisationId !== organisationId) {
    return { error: 'SOURCE_NOT_FOUND' };
  }

  const targetKey =
    relationshipData.targetId ||
    relationshipData.targetCiId ||
    relationshipData.targetCiTag;

  if (!targetKey) {
    return { error: 'TARGET_REQUIRED' };
  }

  const target = findCiRecord(targetKey);
  if (!target) {
    return { error: 'TARGET_NOT_FOUND' };
  }

  if (source.id === target.id || source.tag === target.tag) {
    return { error: 'SELF_LINK' };
  }

  const type = relationshipData.type || 'depends_on';
  const direction = relationshipData.direction === 'upstream' ? 'upstream' : 'downstream';
  const inverseDirection = direction === 'downstream' ? 'upstream' : 'downstream';

  source.relationships = source.relationships || [];
  target.relationships = target.relationships || [];

  // Update or add on source
  const existingSourceIdx = source.relationships.findIndex(
    (r) =>
      r.targetCiId === target.id ||
      r.targetCiTag === target.tag ||
      r.targetCiId === target.tag
  );

  const sourceEntry = {
    type,
    targetCiId: target.id,
    targetCiName: target.name,
    targetCiTag: target.tag,
    direction,
  };

  if (existingSourceIdx >= 0) {
    source.relationships[existingSourceIdx] = sourceEntry;
  } else {
    source.relationships.push(sourceEntry);
  }

  // Update or add inverse relationship on target
  const existingTargetIdx = target.relationships.findIndex(
    (r) =>
      r.targetCiId === source.id ||
      r.targetCiTag === source.tag ||
      r.targetCiId === source.tag
  );

  const targetEntry = {
    type,
    targetCiId: source.id,
    targetCiName: source.name,
    targetCiTag: source.tag,
    direction: inverseDirection,
  };

  if (existingTargetIdx >= 0) {
    target.relationships[existingTargetIdx] = targetEntry;
  } else {
    target.relationships.push(targetEntry);
  }

  source.updatedAt = new Date().toISOString();
  target.updatedAt = new Date().toISOString();

  return { source, target, relationships: source.relationships };
};

const removeCiRelationship = async (id, targetId, organisationId = null) => {
  const source = findCiRecord(id);
  if (!source) {
    return { error: 'SOURCE_NOT_FOUND' };
  }

  if (organisationId && source.organisationId && source.organisationId !== organisationId) {
    return { error: 'SOURCE_NOT_FOUND' };
  }

  const targetNeedle = (targetId || '').trim().toLowerCase();
  source.relationships = (source.relationships || []).filter((r) => {
    const idMatch = r.targetCiId && r.targetCiId.toLowerCase() === targetNeedle;
    const tagMatch = r.targetCiTag && r.targetCiTag.toLowerCase() === targetNeedle;
    return !idMatch && !tagMatch;
  });

  const target = findCiRecord(targetId);
  if (target && target.relationships) {
    const sourceIdNeedle = source.id.toLowerCase();
    const sourceTagNeedle = source.tag.toLowerCase();
    target.relationships = target.relationships.filter((r) => {
      const idMatch = r.targetCiId && r.targetCiId.toLowerCase() === sourceIdNeedle;
      const tagMatch = r.targetCiTag && r.targetCiTag.toLowerCase() === sourceTagNeedle;
      return !idMatch && !tagMatch;
    });
  }

  source.updatedAt = new Date().toISOString();
  return { source, relationships: source.relationships };
};

const getCiTopology = async (id, organisationId = null) => {
  const root = findCiRecord(id);
  if (!root) return null;

  if (organisationId && root.organisationId && root.organisationId !== organisationId) {
    return null;
  }

  const visited = new Set();
  const nodes = [];
  const edges = [];
  const queue = [root];
  visited.add(root.id);
  if (root.tag) visited.add(root.tag);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!nodes.some((n) => n.id === current.id || (n.tag && current.tag && n.tag === current.tag))) {
      nodes.push({
        id: current.id,
        name: current.name,
        tag: current.tag,
        type: current.type,
        status: current.status,
        lifecycleState: current.lifecycleState || 'Deployed',
        site: current.site || current.siteName,
        businessOwner: current.businessOwner,
        technicalContact: current.technicalContact,
        criticality: current.criticality || 'Tier 2 - Business Operational',
        warrantyExpiry: current.warrantyExpiry,
      });
    }

    // 1. Traverse outgoing direct relationships configured on current CI
    const rels = current.relationships || [];
    for (const rel of rels) {
      const targetIdKey = rel.targetCiId || rel.targetCiTag;
      const target = findCiRecord(targetIdKey);
      const targetId = target ? target.id : targetIdKey;
      const targetTag = target ? target.tag : targetIdKey;

      const edgeAlreadyAdded = edges.some(
        (e) =>
          ((e.source === current.id || e.source === current.tag) &&
            (e.target === targetId || e.target === targetTag) &&
            e.type === rel.type &&
            e.direction === rel.direction) ||
          ((e.source === targetId || e.source === targetTag) &&
            (e.target === current.id || e.target === current.tag) &&
            e.type === rel.type &&
            e.direction === rel.direction)
      );

      if (!edgeAlreadyAdded) {
        edges.push({
          source: current.tag || current.id,
          target: targetTag || targetId,
          sourceId: current.id,
          targetId: targetId,
          type: rel.type || 'depends_on',
          direction: rel.direction || 'downstream',
        });
      }

      if (target && !visited.has(target.id) && !visited.has(target.tag)) {
        visited.add(target.id);
        if (target.tag) visited.add(target.tag);
        queue.push(target);
      }
    }

    // 2. Discover incoming relationships from other CIs (Upstream Callers / Consumers)
    for (const otherCi of mockConfigurationItems) {
      if (otherCi.id === current.id || otherCi.tag === current.tag) continue;
      const otherRels = otherCi.relationships || [];
      for (const rel of otherRels) {
        const isPointingToCurrent =
          rel.targetCiId === current.id ||
          rel.targetCiTag === current.tag ||
          rel.targetCiId === current.tag ||
          rel.targetCiTag === current.id;

        if (isPointingToCurrent) {
          const edgeAlreadyAdded = edges.some(
            (e) =>
              ((e.source === otherCi.id || e.source === otherCi.tag) &&
                (e.target === current.id || e.target === current.tag)) ||
              ((e.source === current.id || e.source === current.tag) &&
                (e.target === otherCi.id || e.target === otherCi.tag))
          );

          if (!edgeAlreadyAdded) {
            edges.push({
              source: otherCi.tag || otherCi.id,
              target: current.tag || current.id,
              sourceId: otherCi.id,
              targetId: current.id,
              type: rel.type || 'runs_on',
              direction: 'upstream',
            });
          }

          if (!visited.has(otherCi.id) && !visited.has(otherCi.tag)) {
            visited.add(otherCi.id);
            if (otherCi.tag) visited.add(otherCi.tag);
            queue.push(otherCi);
          }
        }
      }
    }
  }

  return {
    rootId: root.id,
    rootTag: root.tag,
    nodes,
    edges,
  };
};

module.exports = {
  mockConfigurationItems,
  findCiRecord,
  getConfigurationItems,
  getConfigurationItemsByType,
  getConfigurationItemById,
  createConfigurationItemRecord,
  updateConfigurationItemRecord,
  getCiDependencies,
  createCiDependencyRecord,
  deleteCiDependencyRecord,
  getCiTopology,
  getCiImpactData,
};
