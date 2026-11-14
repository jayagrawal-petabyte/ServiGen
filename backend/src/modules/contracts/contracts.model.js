'use strict';

const { randomUUID } = require('node:crypto');
const db = require('../../config/db');
const { handleDbError } = require('../../shared/utils/db-guard');

// ─── Domain Constants ─────────────────────────────────────────────────────────

const VALID_CONTRACT_TYPES = Object.freeze([
  'SLA',
  'Maintenance',
  'License',
  'Underpinning',
  'Warranty',
  'Support',
  'Other',
]);

const VALID_STATUSES = Object.freeze([
  'Draft',
  'Active',
  'Pending Renewal',
  'Expired',
  'Terminated',
]);

// ─── Mock Seed Data (dev/test/offline fallback) ───────────────────────────────

const NOW = new Date();
const addDays = (d, n) => new Date(new Date(d).setDate(new Date(d).getDate() + n)).toISOString();
const subDays = (d, n) => addDays(d, -n);

const MOCK_CONTRACTS = [
  {
    id: 'CON-001',
    title: 'Microsoft 365 Enterprise License Agreement',
    vendorName: 'Microsoft Corporation',
    vendorEmail: 'licensing@microsoft.com',
    contractType: 'License',
    status: 'Active',
    value: 48000,
    currency: 'GBP',
    startDate: subDays(NOW, 180),
    endDate: addDays(NOW, 185),
    renewalDate: addDays(NOW, 155),
    autoRenew: true,
    notes: 'Covers 200 seats of M365 E3. Includes Teams, Exchange, SharePoint, and OneDrive.',
    linkedCiIds: ['CI-001'],
    organisationId: 'org-001',
    createdAt: subDays(NOW, 180),
    updatedAt: subDays(NOW, 10),
  },
  {
    id: 'CON-002',
    title: 'Network Infrastructure Maintenance – Cisco',
    vendorName: 'Cisco Systems',
    vendorEmail: 'support@cisco.com',
    contractType: 'Maintenance',
    status: 'Active',
    value: 12500,
    currency: 'GBP',
    startDate: subDays(NOW, 90),
    endDate: addDays(NOW, 275),
    renewalDate: addDays(NOW, 245),
    autoRenew: false,
    notes: 'SmartNet maintenance for core switches and routers. 4-hour hardware replacement SLA.',
    linkedCiIds: ['CI-004'],
    organisationId: 'org-001',
    createdAt: subDays(NOW, 90),
    updatedAt: subDays(NOW, 5),
  },
  {
    id: 'CON-003',
    title: 'Underpinning Contract – AWS Infrastructure SLA',
    vendorName: 'Amazon Web Services',
    vendorEmail: 'aws-support@amazon.com',
    contractType: 'Underpinning',
    status: 'Active',
    value: 36000,
    currency: 'USD',
    startDate: subDays(NOW, 300),
    endDate: addDays(NOW, 65),
    renewalDate: addDays(NOW, 35),
    autoRenew: true,
    notes: '99.99% uptime SLA covering EC2, RDS, and S3. Includes Business Support tier.',
    linkedCiIds: ['CI-002', 'CI-003'],
    organisationId: 'org-001',
    createdAt: subDays(NOW, 300),
    updatedAt: subDays(NOW, 1),
  },
  {
    id: 'CON-004',
    title: 'CrowdStrike Falcon EDR – Annual Subscription',
    vendorName: 'CrowdStrike',
    vendorEmail: 'renewals@crowdstrike.com',
    contractType: 'License',
    status: 'Pending Renewal',
    value: 9800,
    currency: 'USD',
    startDate: subDays(NOW, 355),
    endDate: addDays(NOW, 10),
    renewalDate: addDays(NOW, 10),
    autoRenew: false,
    notes: 'Endpoint Detection & Response for 150 endpoints. Must manually approve renewal.',
    linkedCiIds: [],
    organisationId: 'org-001',
    createdAt: subDays(NOW, 355),
    updatedAt: subDays(NOW, 2),
  },
  {
    id: 'CON-005',
    title: 'On-Site Hardware Warranty – Dell PowerEdge Servers',
    vendorName: 'Dell Technologies',
    vendorEmail: 'warranty@dell.com',
    contractType: 'Warranty',
    status: 'Active',
    value: 5200,
    currency: 'GBP',
    startDate: subDays(NOW, 400),
    endDate: addDays(NOW, 330),
    renewalDate: null,
    autoRenew: false,
    notes: 'ProSupport Plus 3-year on-site warranty covering 8 PowerEdge R750 servers.',
    linkedCiIds: ['CI-005'],
    organisationId: 'org-001',
    createdAt: subDays(NOW, 400),
    updatedAt: subDays(NOW, 30),
  },
  {
    id: 'CON-006',
    title: 'Helpdesk SLA – Tier 1 Support Agreement',
    vendorName: 'Internal IT',
    vendorEmail: 'helpdesk@servigen.internal',
    contractType: 'SLA',
    status: 'Active',
    value: 0,
    currency: 'GBP',
    startDate: subDays(NOW, 500),
    endDate: addDays(NOW, 500),
    renewalDate: addDays(NOW, 470),
    autoRenew: true,
    notes: 'Internal SLA: P1 response < 15 min, P2 < 1 hr, P3 < 4 hrs, P4 < 1 business day.',
    linkedCiIds: [],
    organisationId: 'org-001',
    createdAt: subDays(NOW, 500),
    updatedAt: subDays(NOW, 60),
  },
  {
    id: 'CON-007',
    title: 'Zscaler Internet Access – Annual License',
    vendorName: 'Zscaler Inc.',
    vendorEmail: 'contracts@zscaler.com',
    contractType: 'License',
    status: 'Expired',
    value: 22000,
    currency: 'USD',
    startDate: subDays(NOW, 395),
    endDate: subDays(NOW, 30),
    renewalDate: null,
    autoRenew: false,
    notes: 'Zero-trust internet gateway. Expired — pending vendor evaluation for renewal vs. alternative.',
    linkedCiIds: [],
    organisationId: 'org-001',
    createdAt: subDays(NOW, 395),
    updatedAt: subDays(NOW, 30),
  },
];

// ─── Prisma Helpers ───────────────────────────────────────────────────────────

const CONTRACT_SELECT = {
  id: true,
  title: true,
  vendorName: true,
  vendorEmail: true,
  contractType: true,
  status: true,
  value: true,
  currency: true,
  startDate: true,
  endDate: true,
  renewalDate: true,
  autoRenew: true,
  notes: true,
  linkedCiIds: true,
  organisationId: true,
  createdAt: true,
  updatedAt: true,
};

// ─── Days-until helper ────────────────────────────────────────────────────────
function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.round((new Date(dateStr) - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatContract(c) {
  return {
    ...c,
    daysUntilExpiry: daysUntil(c.endDate),
    daysUntilRenewal: daysUntil(c.renewalDate),
  };
}

// ─── Mock tenant filter ───────────────────────────────────────────────────────
function applyOrgFilter(list, organisationId) {
  if (!organisationId) return list;
  return list.filter((c) => !c.organisationId || c.organisationId === organisationId);
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

async function getContracts({ organisationId, status, contractType, expiringSoonDays } = {}) {
  try {
    const prisma = db.getClient();
    const where = {};
    if (organisationId) where.organisationId = organisationId;
    if (status) where.status = status;
    if (contractType) where.contractType = contractType;
    if (expiringSoonDays) {
      const cutoff = new Date(Date.now() + Number(expiringSoonDays) * 24 * 60 * 60 * 1000);
      where.endDate = { lte: cutoff, gte: new Date() };
    }
    const rows = await prisma.contract.findMany({
      where,
      select: CONTRACT_SELECT,
      orderBy: { endDate: 'asc' },
    });
    return rows.map(formatContract);
  } catch (err) {
    handleDbError(err);
    let list = MOCK_CONTRACTS;
    if (organisationId) list = applyOrgFilter(list, organisationId);
    if (status) list = list.filter((c) => c.status === status);
    if (contractType) list = list.filter((c) => c.contractType === contractType);
    if (expiringSoonDays) {
      const cutoff = Date.now() + Number(expiringSoonDays) * 24 * 60 * 60 * 1000;
      list = list.filter((c) => c.endDate && new Date(c.endDate) >= Date.now() && new Date(c.endDate) <= cutoff);
    }
    return list.map(formatContract);
  }
}

async function getContractById(id, organisationId = null) {
  try {
    const prisma = db.getClient();
    const where = { id };
    if (organisationId) where.organisationId = organisationId;
    const row = await prisma.contract.findFirst({ where, select: CONTRACT_SELECT });
    return row ? formatContract(row) : null;
  } catch (err) {
    handleDbError(err);
    const found = MOCK_CONTRACTS.find((c) => c.id === id);
    if (!found) return null;
    if (organisationId && found.organisationId && found.organisationId !== organisationId) return null;
    return formatContract(found);
  }
}

async function createContract(data) {
  const id = `CON-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const record = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  try {
    const prisma = db.getClient();
    const created = await prisma.contract.create({
      data: {
        id,
        title: data.title,
        vendorName: data.vendorName,
        vendorEmail: data.vendorEmail || null,
        contractType: data.contractType,
        status: data.status || 'Draft',
        value: data.value || null,
        currency: data.currency || 'GBP',
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
        autoRenew: data.autoRenew || false,
        notes: data.notes || null,
        linkedCiIds: data.linkedCiIds || [],
        organisationId: data.organisationId || null,
      },
      select: CONTRACT_SELECT,
    });
    return formatContract(created);
  } catch (err) {
    handleDbError(err);
    MOCK_CONTRACTS.unshift(record);
    return formatContract(record);
  }
}

async function updateContract(id, data, organisationId = null) {
  try {
    const prisma = db.getClient();
    const where = { id };
    if (organisationId) where.organisationId = organisationId;
    const existing = await prisma.contract.findFirst({ where });
    if (!existing) return null;
    const updated = await prisma.contract.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.vendorName !== undefined && { vendorName: data.vendorName }),
        ...(data.vendorEmail !== undefined && { vendorEmail: data.vendorEmail }),
        ...(data.contractType !== undefined && { contractType: data.contractType }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
        ...(data.renewalDate !== undefined && { renewalDate: data.renewalDate ? new Date(data.renewalDate) : null }),
        ...(data.autoRenew !== undefined && { autoRenew: data.autoRenew }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.linkedCiIds !== undefined && { linkedCiIds: data.linkedCiIds }),
        updatedAt: new Date(),
      },
      select: CONTRACT_SELECT,
    });
    return formatContract(updated);
  } catch (err) {
    handleDbError(err);
    const idx = MOCK_CONTRACTS.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    MOCK_CONTRACTS[idx] = { ...MOCK_CONTRACTS[idx], ...data, updatedAt: new Date().toISOString() };
    return formatContract(MOCK_CONTRACTS[idx]);
  }
}

async function deleteContract(id, organisationId = null) {
  try {
    const prisma = db.getClient();
    const where = { id };
    if (organisationId) where.organisationId = organisationId;
    const existing = await prisma.contract.findFirst({ where });
    if (!existing) return null;
    return await prisma.contract.delete({ where: { id } });
  } catch (err) {
    handleDbError(err);
    const idx = MOCK_CONTRACTS.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const removed = MOCK_CONTRACTS.splice(idx, 1)[0];
    return removed;
  }
}

module.exports = {
  VALID_CONTRACT_TYPES,
  VALID_STATUSES,
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
};
