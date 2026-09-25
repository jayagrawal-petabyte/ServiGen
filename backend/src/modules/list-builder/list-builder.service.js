const {
  getLists,
  getListById,
  createList,
} = require('./list-builder.model');

const getAllLists = async () => {
  return await getLists();
};

const getList = async (id) => {
  return await getListById(id);
};

const createNewList = async (listData) => {
  return await createList(listData);
};

module.exports = {
  getAllLists,
  getList,
  createNewList,
};