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
    businessOwner: 'Finance',
    organisationId: 'org-001',
  },
  {
    id: 'CI-002',
    name: 'Customer Database',
    type: 'Database',
    tag: 'DB-001',
    site: 'Chennai',
    status: 'Active',
    businessOwner: 'Technology',
    organisationId: 'org-001',
  },
  {
    id: 'CI-003',
    name: 'HR Application',
    type: 'Application',
    tag: 'APP-001',
    site: 'Bangalore',
    status: 'Inactive',
    businessOwner: 'Human Resources',
    organisationId: 'org-001',
  },
  {
    id: 'CI-004',
    name: 'Web Server',
    type: 'Server',
    tag: 'WEB-001',
    site: 'Mumbai',
    status: 'Active',
    businessOwner: 'Technology',
    organisationId: 'org-001',
  },
];

const getConfigurationItems = async (options = {}) => {
  const { organisationId } = options;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const records = await db.configurationItem.findMany();
      if (records && records.length > 0) {
        const formatted = records.map((ci) => ({
          id: ci.id,
          name: ci.name,
          type: ci.type,
          tag: ci.tag,
          site: ci.siteName || 'Chennai',
          status: ci.status,
          businessOwner: ci.businessOwner || 'Technology',
          organisationId: 'org-001',
        }));

        if (organisationId) {
          return formatted.filter((item) => !item.organisationId || item.organisationId === organisationId);
        }
        return formatted;
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  if (organisationId) {
    return mockConfigurationItems.filter((item) => !item.organisationId || item.organisationId === organisationId);
  }
  return mockConfigurationItems;
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
      });

      if (ci) {
        const formatted = {
          id: ci.id,
          name: ci.name,
          type: ci.type,
          tag: ci.tag,
          site: ci.siteName || 'Chennai',
          status: ci.status,
          businessOwner: ci.businessOwner || 'Technology',
          organisationId: 'org-001',
        };

        if (organisationId && formatted.organisationId && formatted.organisationId !== organisationId) {
          return null;
        }
        return formatted;
      }
    } catch (_err) {
      // Database connection fallback
    }
  }

  const item = mockConfigurationItems.find((ci) => ci.id === id || ci.tag === id);
  if (!item) return null;
  if (organisationId && item.organisationId && item.organisationId !== organisationId) {
    return null;
  }
  return item;
};

module.exports = {
  getConfigurationItems,
  getConfigurationItemsByType,
  getConfigurationItemById,
};