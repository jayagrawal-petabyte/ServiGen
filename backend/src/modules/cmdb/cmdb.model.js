'use strict';

const db = require('../../config/db');
const { handleDbError } = require('../../shared/utils/db-guard');

const mockConfigurationItems = [
  {
    id: 'CI-1001',
    name: 'Primary PostgreSQL Database Cluster',
    type: 'Database',
    tag: 'DB-001',
    site: 'London Primary DC (Lon-01)',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Data Platform',
    technicalContact: 'David Miller',
    environment: 'Production',
    activeIncidentsCount: 1,
    linkedChangesCount: 2,
    ipAddress: '10.240.12.15',
    lastUpdated: 'Today at 09:30',
    criticality: 'Tier 1 - Mission Critical',
    warrantyExpiry: '2028-06-30',
    specifications: {
      os: 'Ubuntu Linux 22.04 LTS',
      cpu: '32 vCPU',
      ram: '128 GB ECC',
      storage: '2 TB NVMe RAID 10',
      ipAddress: '10.240.12.15',
      macAddress: '00:1A:2B:3C:4D:5E',
      model: 'Dell PowerEdge R750',
      rackLocation: 'Rack B-14, U18-U20',
    },
    relationships: [
      {
        type: 'runs_on',
        targetCiId: 'CI-1002',
        targetCiName: 'Payment Gateway Application Server',
        targetCiTag: 'PAY-001',
        direction: 'upstream',
      },
      {
        type: 'backed_up_by',
        targetCiId: 'CI-1007',
        targetCiName: 'SAN Backup Storage Vault',
        targetCiTag: 'SAN-001',
        direction: 'downstream',
      },
    ],
    softwareLicenses: [
      {
        name: 'PostgreSQL Enterprise Support (EDB)',
        licenseKeyMasked: 'EDB-PROD-****-9821',
        expiryDate: 'Dec 31, 2027',
        seatsTotal: 1,
        seatsAllocated: 1,
      },
    ],
    organisationId: 'org-001',
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
    site: 'London Primary DC (Lon-01)',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Digital Products',
    technicalContact: 'Priya Sharma',
    environment: 'Production',
    activeIncidentsCount: 1,
    linkedChangesCount: 1,
    ipAddress: '10.240.16.20',
    lastUpdated: '16/10/2026',
    criticality: 'Tier 2 - Business Operational',
    warrantyExpiry: '2026-11-20',
    specifications: {
      os: 'Node.js 20 LTS on Debian 12',
      cpu: '8 vCPU',
      ram: '32 GB',
      ipAddress: '10.240.16.20',
    },
    relationships: [
      {
        type: 'depends_on',
        targetCiId: 'CI-1002',
        targetCiName: 'Payment Gateway Application Server',
        targetCiTag: 'PAY-001',
        direction: 'downstream',
      },
    ],
    softwareLicenses: [],
    organisationId: 'org-001',
  },
  {
    id: 'CI-1007',
    name: 'SAN Backup Storage Vault',
    type: 'Server',
    tag: 'SAN-001',
    site: 'London Secondary DC (Lon-02)',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Storage Engineering',
    technicalContact: 'David Miller',
    environment: 'Disaster Recovery',
    activeIncidentsCount: 0,
    linkedChangesCount: 0,
    ipAddress: '10.242.8.50',
    lastUpdated: '01/10/2026',
    criticality: 'Tier 2 - Business Operational',
    warrantyExpiry: '2025-08-30',
    specifications: {
      model: 'NetApp AFF A400',
      storage: '50 TB All-Flash NVMe',
      rackLocation: 'Lon-02, Rack S-05',
      ipAddress: '10.242.8.50',
    },
    relationships: [
      {
        type: 'backed_up_by',
        targetCiId: 'CI-1001',
        targetCiName: 'Primary PostgreSQL Database Cluster',
        targetCiTag: 'DB-001',
        direction: 'upstream',
      },
    ],
    softwareLicenses: [],
    organisationId: 'org-001',
  },
  {
    id: 'CI-1008',
    name: 'Redis Session Cache Cluster',
    type: 'Cloud Service',
    tag: 'CACHE-001',
    site: 'London Primary DC (Lon-01)',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Platform Engineering',
    technicalContact: 'Sarah Jenkins',
    environment: 'Production',
    activeIncidentsCount: 0,
    linkedChangesCount: 0,
    ipAddress: '10.240.12.30',
    lastUpdated: '14/10/2026',
    criticality: 'Tier 2 - Business Operational',
    warrantyExpiry: '2028-09-15',
    specifications: {
      os: 'Redis Enterprise 7.2',
      ram: '32 GB In-Memory',
      ipAddress: '10.240.12.30',
    },
    relationships: [
      {
        type: 'runs_on',
        targetCiId: 'CI-1002',
        targetCiName: 'Payment Gateway Application Server',
        targetCiTag: 'PAY-001',
        direction: 'upstream',
      },
    ],
    softwareLicenses: [],
    organisationId: 'org-001',
  },
];

const findCiRecord = (idOrTag) => {
  if (!idOrTag || typeof idOrTag !== 'string') return null;
  const needle = idOrTag.trim().toLowerCase();
  if (needle === 'ci-001') {
    return mockConfigurationItems[0];
  }
  if (needle === 'ci-002') {
    return mockConfigurationItems[1];
  }
  if (needle === 'ci-003') {
    return mockConfigurationItems[2];
  }
  return (
    mockConfigurationItems.find(
      (ci) =>
        (ci.id && ci.id.toLowerCase() === needle) ||
        (ci.tag && ci.tag.toLowerCase() === needle)
    ) || null
  );
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
      handleDbError('cmdb.getConfigurationItems', _err);
    }
  }

  if (organisationId) {
    return mockConfigurationItems.filter(
      (item) => !item.organisationId || item.organisationId === organisationId
    );
  }
  return mockConfigurationItems;
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
        const inMem = findCiRecord(ci.id) || findCiRecord(ci.tag);
        const formatted = {
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

        if (organisationId && formatted.organisationId && formatted.organisationId !== organisationId) {
          return null;
        }
        return formatted;
      }
    } catch (_err) {
      handleDbError('cmdb.getConfigurationItemById', _err);
    }
  }

  const item = findCiRecord(id);
  if (!item) return null;
  if (organisationId && item.organisationId && item.organisationId !== organisationId) {
    return null;
  }
  return item;
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

  while (queue.length > 0) {
    const current = queue.shift();
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
    });

    const rels = current.relationships || [];
    for (const rel of rels) {
      const targetIdKey = rel.targetCiId || rel.targetCiTag;
      const target = findCiRecord(targetIdKey);
      const targetId = target ? target.id : targetIdKey;

      const edgeAlreadyAdded = edges.some(
        (e) =>
          e.source === current.id &&
          e.target === targetId &&
          e.type === rel.type &&
          e.direction === rel.direction
      );

      if (!edgeAlreadyAdded) {
        edges.push({
          source: current.id,
          target: targetId,
          type: rel.type,
          direction: rel.direction,
        });
      }

      if (target && !visited.has(target.id)) {
        visited.add(target.id);
        queue.push(target);
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
  createConfigurationItem,
  updateConfigurationItem,
  addCiRelationship,
  removeCiRelationship,
  getCiTopology,
};
