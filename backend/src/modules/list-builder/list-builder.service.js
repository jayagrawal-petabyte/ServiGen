const {
  getLists,
  getListById,
  createList,
} = require('./list-builder.model');

const getAllLists = async (options = {}) => {
  return await getLists(options);
};

const getList = async (id, organisationId = null) => {
  return await getListById(id, organisationId);
};

const createNewList = async (listData) => {
  return await createList(listData);
};

module.exports = {
  getAllLists,
  getList,
  createNewList,
};