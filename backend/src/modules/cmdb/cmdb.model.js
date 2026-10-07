const configurationItems = [
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
  if (organisationId) {
    return configurationItems.filter((item) => !item.organisationId || item.organisationId === organisationId);
  }
  return configurationItems;
};

const getConfigurationItemsByType = async (organisationId = null) => {
  const items = organisationId
    ? configurationItems.filter((item) => !item.organisationId || item.organisationId === organisationId)
    : configurationItems;

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
  const item = configurationItems.find((ci) => ci.id === id || ci.tag === id);
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