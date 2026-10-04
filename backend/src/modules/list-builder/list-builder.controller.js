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
    const {
      name,
      description,
      fields,
      status,
      createdBy,
    } = req.body || {};

    // BI-15: Validate list name
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name must be a non-empty string',
      });
    }

    // BI-15: Validate fields array and field entries
    if (
      !Array.isArray(fields) ||
      fields.length === 0 ||
      fields.some(
        (field) =>
          typeof field !== 'string' || field.trim() === ''
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Fields must be a non-empty array of non-empty strings',
      });
    }

    const newList = await createNewList({
      name: name.trim(),
      description,
      fields,
      status: status || 'Draft',
      createdBy,
    });

    return res.status(201).json({
      success: true,
      data: newList,
    });
  } catch (error) {
    return res.status(500).json({
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