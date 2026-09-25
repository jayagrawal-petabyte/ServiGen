const configurationItems = [
  {
    id: 'CI-001',
    name: 'Payment Server',
    type: 'Server',
    tag: 'PAY-001',
    site: 'Chennai',
    status: 'Active',
    businessOwner: 'Finance',
  },
  {
    id: 'CI-002',
    name: 'Customer Database',
    type: 'Database',
    tag: 'DB-001',
    site: 'Chennai',
    status: 'Active',
    businessOwner: 'Technology',
  },
  {
    id: 'CI-003',
    name: 'HR Application',
    type: 'Application',
    tag: 'APP-001',
    site: 'Bangalore',
    status: 'Inactive',
    businessOwner: 'Human Resources',
  },
  {
    id: 'CI-004',
    name: 'Web Server',
    type: 'Server',
    tag: 'WEB-001',
    site: 'Mumbai',
    status: 'Active',
    businessOwner: 'Technology',
  },
];

const getConfigurationItems = async () => {
  return configurationItems;
};

const getConfigurationItemsByType = async () => {
  const groupedItems = {};

  configurationItems.forEach((item) => {
    if (!groupedItems[item.type]) {
      groupedItems[item.type] = [];
    }

    groupedItems[item.type].push(item);
  });

  return groupedItems;
};

module.exports = {
  getConfigurationItems,
  getConfigurationItemsByType,
};