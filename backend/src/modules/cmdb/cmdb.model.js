'use strict';

const db = require('../../config/db');

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
    site: 'Chennai',
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
    id: 'CI-003',
    name: 'HR Application',
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
    id: 'CI-004',
    name: 'Web Server',
    type: 'Server',
    tag: 'WEB-001',
    site: 'Mumbai',
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

const findCiRecord = (idOrTag, autoCreate = false) => {
  if (!idOrTag || typeof idOrTag !== 'string') return null;
  const needle = idOrTag.trim().toLowerCase();

  // Resolve Prisma-seeded alias IDs to canonical tags/IDs
  let effectiveNeedle = needle;
  if (needle === 'ci-001') effectiveNeedle = 'pay-001';
  else if (needle === 'ci-002') effectiveNeedle = 'db-001';
  else if (needle === 'ci-003') effectiveNeedle = 'net-001';

  let found = mockConfigurationItems.find(
    (ci) =>
      (ci.tag && ci.tag.toLowerCase() === effectiveNeedle) ||
      (ci.id && ci.id.toLowerCase() === effectiveNeedle) ||
      (ci.tag && ci.tag.toLowerCase() === needle) ||
      (ci.id && ci.id.toLowerCase() === needle)
  );

  // If autoCreate is explicitly enabled and not found, dynamically register it
  if (!found && autoCreate && idOrTag.trim()) {
    const cleanId = idOrTag.trim();
    const newCi = {
      id: cleanId.startsWith('CI-') ? cleanId : `CI-${cleanId}`,
      name: cleanId,
      tag: cleanId,
      type: cleanId.toLowerCase().includes('db')
        ? 'Database'
        : cleanId.toLowerCase().includes('net')
        ? 'Network'
        : 'Server',
      status: 'Active',
      lifecycleState: 'Deployed',
      site: 'London Primary DC (Lon-01)',
      businessOwner: 'Technology',
      technicalContact: 'Platform Operations',
      environment: 'Production',
      criticality: 'Tier 2 - Business Operational',
      specifications: { ipAddress: '10.240.50.1' },
      relationships: [],
      softwareLicenses: [],
      organisationId: 'org-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockConfigurationItems.push(newCi);
    return newCi;
  }

  return found || null;
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

      if (organisationId) {
        return formatted.filter((item) => !item.organisationId || item.organisationId === organisationId);
      }
      return formatted;
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
    const type = (typeof item.type === 'string' && item.type.trim()) ? item.type.trim() : 'Unknown';
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
          OR: [
            { id },
            { tag: id },
          ],
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

  const item = mockConfigurationItems.find((ci) => ci.id === id || ci.tag === id);
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

const updateConfigurationItem = updateConfigurationItemRecord;

const addCiRelationship = async (id, relationshipData, organisationId = null) => {
  const source = findCiRecord(id, true);
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

  const target = findCiRecord(targetKey, true);
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
  const target = findCiRecord(targetId);

  const sourceIdNeedle = (source.id || '').toLowerCase();
  const sourceTagNeedle = (source.tag || '').toLowerCase();
  const targetIdNeedle = target ? (target.id || '').toLowerCase() : targetNeedle;
  const targetTagNeedle = target && target.tag ? target.tag.toLowerCase() : targetNeedle;

  // 1. Remove from source relationships
  source.relationships = (source.relationships || []).filter((r) => {
    const rId = (r.targetCiId || '').toLowerCase();
    const rTag = (r.targetCiTag || '').toLowerCase();
    const match =
      rId === targetNeedle ||
      rTag === targetNeedle ||
      rId === targetIdNeedle ||
      rTag === targetTagNeedle;
    return !match;
  });

  // 2. Remove reciprocal from target relationships if target exists
  if (target && target.relationships) {
    target.relationships = target.relationships.filter((r) => {
      const rId = (r.targetCiId || '').toLowerCase();
      const rTag = (r.targetCiTag || '').toLowerCase();
      const match =
        rId === sourceIdNeedle ||
        rTag === sourceTagNeedle ||
        rId === sourceTagNeedle ||
        rTag === sourceIdNeedle;
      return !match;
    });
    target.updatedAt = new Date().toISOString();
  }

  // 3. Also sweep any CI in mockConfigurationItems that links to source
  for (const other of mockConfigurationItems) {
    const otherId = (other.id || '').toLowerCase();
    const otherTag = (other.tag || '').toLowerCase();
    if (
      otherId === targetNeedle ||
      otherTag === targetNeedle ||
      otherId === targetIdNeedle ||
      otherTag === targetTagNeedle
    ) {
      other.relationships = (other.relationships || []).filter((r) => {
        const rId = (r.targetCiId || '').toLowerCase();
        const rTag = (r.targetCiTag || '').toLowerCase();
        const match =
          rId === sourceIdNeedle ||
          rTag === sourceTagNeedle ||
          rId === sourceTagNeedle ||
          rTag === sourceIdNeedle;
        return !match;
      });
      other.updatedAt = new Date().toISOString();
    }
  }

  source.updatedAt = new Date().toISOString();
  return { source, relationships: source.relationships };
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

module.exports = {
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
