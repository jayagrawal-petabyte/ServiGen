const lists = [
  {
    id: 'LIST-001',
    name: 'Active Servers',
    description: 'List of all active servers',
    status: 'Draft',
    fields: ['name', 'type', 'site', 'status'],
    createdBy: 'Admin',
  },
  {
    id: 'LIST-002',
    name: 'Critical Applications',
    description: 'List of critical business applications',
    status: 'Published',
    fields: ['name', 'type', 'businessOwner', 'status'],
    createdBy: 'Admin',
  },
];

const getLists = async () => {
  return lists;
};

const getListById = async (id) => {
  return lists.find((list) => list.id === id);
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