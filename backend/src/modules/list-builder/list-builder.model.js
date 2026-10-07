const lists = [
  {
    id: 'LIST-001',
    name: 'Active Servers',
    description: 'List of all active servers',
    status: 'Draft',
    fields: ['name', 'type', 'site', 'status'],
    createdBy: 'Admin',
    organisationId: 'org-001',
  },
  {
    id: 'LIST-002',
    name: 'Critical Applications',
    description: 'List of critical business applications',
    status: 'Published',
    fields: ['name', 'type', 'businessOwner', 'status'],
    createdBy: 'Admin',
    organisationId: 'org-001',
  },
];

const getLists = async (options = {}) => {
  const { organisationId } = options;
  if (organisationId) {
    return lists.filter((list) => !list.organisationId || list.organisationId === organisationId);
  }
  return lists;
};

const getListById = async (id, organisationId = null) => {
  const list = lists.find((l) => l.id === id);
  if (!list) return null;
  if (organisationId && list.organisationId && list.organisationId !== organisationId) {
    return null;
  }
  return list;
};

const createList = async (listData) => {
  const newList = {
    id: `LIST-${String(lists.length + 1).padStart(3, '0')}`,
    ...listData,
  };

  lists.push(newList);

  return newList;
};

module.exports = {
  getLists,
  getListById,
  createList,
};