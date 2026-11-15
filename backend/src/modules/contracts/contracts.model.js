'use strict';

const db = require('../../config/db');

const mockContracts = [
  {
    id: 'CON-1001',
    contractNumber: 'CON-1001',
    title: 'Enterprise Database Support Agreement',
    vendorName: 'Postgres Solutions Ltd',
    vendorEmail: 'support@postgressolutions.local',
    type: 'Maintenance',
    status: 'Active',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.000Z',
    renewalDate: '2026-11-30T00:00:00.000Z',
    autoRenew: true,
    contractValue: 48000,
    currency: 'USD',
    notes: '24/7 dedicated DBA support with 15-minute response SLA.',
    organisationId: 'org-001',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
    linkedCiIds: ['CI-002'],
  },
  {
    id: 'CON-1002',
    contractNumber: 'CON-1002',
    title: 'Cloud Infrastructure SLA',
    vendorName: 'Global Cloud Services Inc',
    vendorEmail: 'contracts@globalcloud.local',
    type: 'SLA',
    status: 'Active',
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-11-28T23:59:59.000Z',
    renewalDate: '2026-11-20T00:00:00.000Z',
    autoRenew: false,
    contractValue: 120000,
    currency: 'USD',
    notes: '99.99% uptime guarantee across all availability zones.',
    organisationId: 'org-001',
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-01T09:00:00.000Z',
    linkedCiIds: ['CI-001', 'CI-004'],
  },
  {
    id: 'CON-1003',
    contractNumber: 'CON-1003',
    title: 'Workstation Extended Hardware Warranty',
    vendorName: 'Hardware Tech Group',
    vendorEmail: 'warranty@hardwaretech.local',
    type: 'Warranty',
    status: 'Pending Renewal',
    startDate: '2025-11-15T00:00:00.000Z',
    endDate: '2026-11-18T23:59:59.000Z',
    renewalDate: '2026-11-10T00:00:00.000Z',
    autoRenew: false,
    contractValue: 15000,
    currency: 'USD',
    notes: 'Next business day on-site replacement.',
    organisationId: 'org-001',
    createdAt: '2025-11-15T10:00:00.000Z',
    updatedAt: '2026-10-15T11:00:00.000Z',
    linkedCiIds: [],
  },
];

const useMockData = process.env.NODE_ENV === 'test';
const allowOfflineMocks = process.env.ALLOW_OFFLINE_MOCKS === 'true' || process.env.NODE_ENV !== 'production';

const formatContract = (c) => ({
  id: c.id,
  contractNumber: c.contractNumber || c.id,
  title: c.title,
  vendorName: c.vendorName,
  vendorEmail: c.vendorEmail || null,
  type: c.type || 'SLA',
  status: c.status || 'Draft',
  startDate: c.startDate instanceof Date ? c.startDate.toISOString() : c.startDate || null,
  endDate: c.endDate instanceof Date ? c.endDate.toISOString() : c.endDate || null,
  renewalDate: c.renewalDate instanceof Date ? c.renewalDate.toISOString() : c.renewalDate || null,
  autoRenew: Boolean(c.autoRenew),
  contractValue: typeof c.contractValue === 'number' ? c.contractValue : null,
  currency: c.currency || 'USD',
  notes: c.notes || null,
  organisationId: c.organisationId || null,
  createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
  linkedCiIds: c.linkedCiIds || (c.linkedCis ? c.linkedCis.map((link) => link.configurationItemId) : []),
});

const getContracts = async (filters = {}) => {
  const { organisationId, status, type, vendorName, search } = filters;

  if (useMockData) {
    return mockContracts
      .filter((c) => {
        if (organisationId && c.organisationId !== organisationId) return false;
        if (status && c.status.toLowerCase() !== status.toLowerCase()) return false;
        if (type && c.type.toLowerCase() !== type.toLowerCase()) return false;
        if (vendorName && !c.vendorName.toLowerCase().includes(vendorName.toLowerCase())) return false;
        if (search) {
          const q = search.toLowerCase();
          const match = c.title.toLowerCase().includes(q) ||
            c.vendorName.toLowerCase().includes(q) ||
            (c.contractNumber && c.contractNumber.toLowerCase().includes(q)) ||
            (c.notes && c.notes.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .map(formatContract);
  }

  try {
    const where = {};
    if (organisationId) where.organisationId = organisationId;
    if (status) where.status = { equals: status, mode: 'insensitive' };
    if (type) where.type = { equals: type, mode: 'insensitive' };
    if (vendorName) where.vendorName = { contains: vendorName, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { vendorName: { contains: search, mode: 'insensitive' } },
        { contractNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const records = await db.contract.findMany({
      where,
      include: {
        linkedCis: {
          select: { configurationItemId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(formatContract);
  } catch (err) {
    if (allowOfflineMocks) {
      return mockContracts
        .filter((c) => !organisationId || c.organisationId === organisationId)
        .map(formatContract);
    }
    throw err;
  }
};

const getContractById = async (id, organisationId = null) => {
  if (useMockData) {
    const c = mockContracts.find((item) => item.id === id || item.contractNumber === id);
    if (!c) return null;
    if (organisationId && c.organisationId !== organisationId) return null;
    return formatContract(c);
  }

  try {
    const where = {
      OR: [{ id }, { contractNumber: id }],
    };
    if (organisationId) where.organisationId = organisationId;

    const record = await db.contract.findFirst({
      where,
      include: {
        linkedCis: {
          include: {
            configurationItem: {
              select: {
                id: true,
                name: true,
                type: true,
                tag: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!record) return null;
    const formatted = formatContract(record);
    if (record.linkedCis) {
      formatted.linkedCis = record.linkedCis.map((link) => link.configurationItem);
    }
    return formatted;
  } catch (err) {
    if (allowOfflineMocks) {
      const c = mockContracts.find((item) => item.id === id || item.contractNumber === id);
      if (!c || (organisationId && c.organisationId !== organisationId)) return null;
      return formatContract(c);
    }
    throw err;
  }
};

const createContractRecord = async (contractData) => {
  const id = contractData.id || `CON-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();

  const newContract = {
    id,
    contractNumber: contractData.contractNumber || id,
    title: contractData.title,
    vendorName: contractData.vendorName,
    vendorEmail: contractData.vendorEmail || null,
    type: contractData.type || 'SLA',
    status: contractData.status || 'Draft',
    startDate: contractData.startDate || null,
    endDate: contractData.endDate || null,
    renewalDate: contractData.renewalDate || null,
    autoRenew: Boolean(contractData.autoRenew),
    contractValue: contractData.contractValue !== undefined ? Number(contractData.contractValue) : null,
    currency: contractData.currency || 'USD',
    notes: contractData.notes || null,
    organisationId: contractData.organisationId || null,
    createdAt: now,
    updatedAt: now,
    linkedCiIds: Array.isArray(contractData.ciIds) ? [...contractData.ciIds] : [],
  };

  if (useMockData) {
    mockContracts.unshift(newContract);
    return formatContract(newContract);
  }

  try {
    const created = await db.contract.create({
      data: {
        id: newContract.id,
        contractNumber: newContract.contractNumber,
        title: newContract.title,
        vendorName: newContract.vendorName,
        vendorEmail: newContract.vendorEmail,
        type: newContract.type,
        status: newContract.status,
        startDate: newContract.startDate ? new Date(newContract.startDate) : null,
        endDate: newContract.endDate ? new Date(newContract.endDate) : null,
        renewalDate: newContract.renewalDate ? new Date(newContract.renewalDate) : null,
        autoRenew: newContract.autoRenew,
        contractValue: newContract.contractValue,
        currency: newContract.currency,
        notes: newContract.notes,
        organisationId: newContract.organisationId,
      },
    });

    if (newContract.linkedCiIds.length > 0) {
      await db.contractCiLink.createMany({
        data: newContract.linkedCiIds.map((configurationItemId) => ({
          contractId: id,
          configurationItemId,
        })),
        skipDuplicates: true,
      });
    }

    return formatContract(created);
  } catch (err) {
    if (allowOfflineMocks) {
      mockContracts.unshift(newContract);
      return formatContract(newContract);
    }
    throw err;
  }
};

const updateContractRecord = async (id, organisationId, patch) => {
  const now = new Date().toISOString();

  if (useMockData) {
    const idx = mockContracts.findIndex((c) => c.id === id || c.contractNumber === id);
    if (idx === -1) return null;
    if (organisationId && mockContracts[idx].organisationId !== organisationId) return null;

    mockContracts[idx] = {
      ...mockContracts[idx],
      ...patch,
      updatedAt: now,
    };
    return formatContract(mockContracts[idx]);
  }

  try {
    const where = { id };
    if (organisationId) where.organisationId = organisationId;

    const existing = await db.contract.findFirst({ where });
    if (!existing) return null;

    const updated = await db.contract.update({
      where: { id },
      data: {
        ...patch,
        ...(patch.startDate ? { startDate: new Date(patch.startDate) } : {}),
        ...(patch.endDate ? { endDate: new Date(patch.endDate) } : {}),
        ...(patch.renewalDate ? { renewalDate: new Date(patch.renewalDate) } : {}),
      },
    });

    return formatContract(updated);
  } catch (err) {
    if (allowOfflineMocks) {
      const idx = mockContracts.findIndex((c) => c.id === id || c.contractNumber === id);
      if (idx === -1 || (organisationId && mockContracts[idx].organisationId !== organisationId)) return null;
      mockContracts[idx] = { ...mockContracts[idx], ...patch, updatedAt: now };
      return formatContract(mockContracts[idx]);
    }
    throw err;
  }
};

const deleteContractRecord = async (id, organisationId) => {
  if (useMockData) {
    const idx = mockContracts.findIndex((c) => c.id === id || c.contractNumber === id);
    if (idx === -1) return null;
    if (organisationId && mockContracts[idx].organisationId !== organisationId) return null;

    const deleted = mockContracts.splice(idx, 1)[0];
    return formatContract(deleted);
  }

  try {
    const where = { id };
    if (organisationId) where.organisationId = organisationId;

    const existing = await db.contract.findFirst({ where });
    if (!existing) return null;

    await db.contract.delete({ where: { id } });
    return formatContract(existing);
  } catch (err) {
    if (allowOfflineMocks) {
      const idx = mockContracts.findIndex((c) => c.id === id || c.contractNumber === id);
      if (idx === -1 || (organisationId && mockContracts[idx].organisationId !== organisationId)) return null;
      const deleted = mockContracts.splice(idx, 1)[0];
      return formatContract(deleted);
    }
    throw err;
  }
};

const linkCiToContract = async (contractId, organisationId, ciId, notes = null) => {
  if (useMockData) {
    const contract = mockContracts.find((c) => c.id === contractId || c.contractNumber === contractId);
    if (!contract) return null;
    if (organisationId && contract.organisationId !== organisationId) return null;

    if (!contract.linkedCiIds.includes(ciId)) {
      contract.linkedCiIds.push(ciId);
    }
    return {
      contractId: contract.id,
      configurationItemId: ciId,
      notes,
    };
  }

  try {
    const where = { id: contractId };
    if (organisationId) where.organisationId = organisationId;

    const contract = await db.contract.findFirst({ where });
    if (!contract) return null;

    const link = await db.contractCiLink.upsert({
      where: {
        contractId_configurationItemId: {
          contractId,
          configurationItemId: ciId,
        },
      },
      update: { notes },
      create: {
        contractId,
        configurationItemId: ciId,
        notes,
      },
    });

    return link;
  } catch (err) {
    if (allowOfflineMocks) {
      const contract = mockContracts.find((c) => c.id === contractId || c.contractNumber === contractId);
      if (!contract || (organisationId && contract.organisationId !== organisationId)) return null;
      if (!contract.linkedCiIds.includes(ciId)) contract.linkedCiIds.push(ciId);
      return { contractId: contract.id, configurationItemId: ciId, notes };
    }
    throw err;
  }
};

const unlinkCiFromContract = async (contractId, organisationId, ciId) => {
  if (useMockData) {
    const contract = mockContracts.find((c) => c.id === contractId || c.contractNumber === contractId);
    if (!contract) return null;
    if (organisationId && contract.organisationId !== organisationId) return null;

    contract.linkedCiIds = contract.linkedCiIds.filter((id) => id !== ciId);
    return { success: true };
  }

  try {
    const where = { id: contractId };
    if (organisationId) where.organisationId = organisationId;

    const contract = await db.contract.findFirst({ where });
    if (!contract) return null;

    await db.contractCiLink.deleteMany({
      where: {
        contractId,
        configurationItemId: ciId,
      },
    });

    return { success: true };
  } catch (err) {
    if (allowOfflineMocks) {
      const contract = mockContracts.find((c) => c.id === contractId || c.contractNumber === contractId);
      if (!contract || (organisationId && contract.organisationId !== organisationId)) return null;
      contract.linkedCiIds = contract.linkedCiIds.filter((id) => id !== ciId);
      return { success: true };
    }
    throw err;
  }
};

const getExpiringContracts = async (organisationId = null, daysAhead = 30) => {
  const all = await getContracts({ organisationId });
  const now = new Date();
  const futureThreshold = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return all.filter((c) => {
    if (c.status === 'Expired') return false;
    const targetDate = c.renewalDate || c.endDate;
    if (!targetDate) return false;
    const d = new Date(targetDate);
    return d >= now && d <= futureThreshold;
  });
};

module.exports = {
  getContracts,
  getContractById,
  createContractRecord,
  updateContractRecord,
  deleteContractRecord,
  linkCiToContract,
  unlinkCiFromContract,
  getExpiringContracts,
};

