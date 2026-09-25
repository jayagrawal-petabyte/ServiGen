const {
  getAllLists,
  getList,
  createNewList,
} = require('./list-builder.service');

const getLists = async (req, res) => {
  try {
    const lists = await getAllLists();

    res.status(200).json({
      success: true,
      data: lists,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lists',
    });
  }
};

const getListById = async (req, res) => {
  try {
    const list = await getList(req.params.id);

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch list',
    });
  }
};

const createList = async (req, res) => {
  try {
    const { name, description, fields, status, createdBy } = req.body;

    if (!name || !fields) {
      return res.status(400).json({
        success: false,
        message: 'Name and fields are required',
      });
    }

    const newList = await createNewList({
      name,
      description,
      fields,
      status: status || 'Draft',
      createdBy,
    });

    res.status(201).json({
      success: true,
      data: newList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create list',
    });
  }
};

module.exports = {
  getLists,
  getListById,
  createList,
};